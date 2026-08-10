'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ProcessingScreen } from '@/components/quiz/ProcessingScreen';
import { ProgressBar } from '@/components/quiz/ProgressBar';
import { QuestionStep, type StepOption } from '@/components/quiz/QuestionStep';
import { RaffleModal } from '@/components/raffle/RaffleModal';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { TOTAL_QUESTIONS, generalQuestions } from '@/content/quiz';
import { landing, quizUi } from '@/content/site-content';
import type { GroupId, QuestionId, RoleId } from '@/content/types';
import { track } from '@/lib/analytics';
import {
  clearSession,
  createSession,
  getSessionServerSnapshot,
  getSessionSnapshot,
  saveResultSnapshot,
  saveSession,
  shuffleForDisplay,
  subscribeToQuizStore,
} from '@/lib/quiz-session';
import { computeGroupStage, computeResult, getAdaptiveQuestions } from '@/lib/scoring';

/**
 * Orquestra a jornada: intro → 10 perguntas → processamento → convite do
 * sorteio → resultado.
 *
 * O progresso vem do store de sessão (`useSyncExternalStore`), então recarregar
 * a página durante o evento devolve a pessoa exatamente onde ela estava — sem
 * descompasso de hidratação e sem efeito de restauração.
 */

type Phase = 'intro' | 'questions' | 'processing' | 'raffle';

const PROCESSING_MS = 1200;

interface PreparedStep {
  questionId: QuestionId;
  prompt: string;
  options: StepOption[];
}

export function QuizFlow() {
  const router = useRouter();

  const session = useSyncExternalStore(
    subscribeToQuizStore,
    getSessionSnapshot,
    getSessionServerSnapshot,
  );

  const [phase, setPhase] = useState<Phase>('intro');
  const [restoreChecked, setRestoreChecked] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [result, setResult] = useState<{
    role: RoleId;
    group: GroupId;
    secondaryGroup: GroupId;
  } | null>(null);

  const headingRef = useRef<HTMLDivElement>(null);
  const revealedRef = useRef(false);

  // Retomada do progresso: acontece na primeira renderização em que o store já
  // trouxe o valor do navegador (depois da hidratação), sem efeito.
  if (!restoreChecked && session !== null) {
    setRestoreChecked(true);
    if (Object.keys(session.answers).length > 0) setPhase('questions');
  }

  const step = session?.step ?? 0;
  const answers = useMemo(() => session?.answers ?? {}, [session]);

  /**
   * O grupo vencedor só é conhecido depois da pergunta 8 — é ele que define
   * quais perguntas 9 e 10 serão exibidas.
   */
  const winningGroup = useMemo<GroupId | null>(() => {
    if (step < 8) return null;
    try {
      return computeGroupStage(answers).group;
    } catch {
      return null;
    }
  }, [step, answers]);

  const currentStep = useMemo<PreparedStep | null>(() => {
    if (!session) return null;

    if (step < 8) {
      const question = generalQuestions[step];
      if (!question) return null;
      return {
        questionId: question.id,
        prompt: question.prompt,
        options: shuffleForDisplay(question.options, session.seed, question.id).map((option) => ({
          id: option.id,
          label: option.label,
          icon: option.icon,
        })),
      };
    }

    if (!winningGroup) return null;
    const pair = getAdaptiveQuestions(winningGroup);
    const question = step === 8 ? pair[0] : pair[1];
    return {
      questionId: question.id,
      prompt: question.prompt,
      options: shuffleForDisplay(
        question.options,
        session.seed,
        `${winningGroup}-${question.id}`,
      ).map((option) => ({ id: option.id, label: option.label, icon: option.icon })),
    };
  }, [session, step, winningGroup]);

  // Move o foco para o topo da pergunta a cada troca de tela.
  useEffect(() => {
    if (phase === 'questions') headingRef.current?.focus();
  }, [phase, step]);

  // Processamento curto e com teto fixo: nunca atrasa o resultado de propósito.
  useEffect(() => {
    if (phase !== 'processing') return;
    const timer = window.setTimeout(() => {
      setPhase('raffle');
      track({ name: 'raffle_invite_opened' });
    }, PROCESSING_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // --- Ações ---------------------------------------------------------------

  function start() {
    saveSession(createSession());
    setPhase('questions');
    track({ name: 'quiz_started' });
    track({ name: 'quiz_question_reached', step: 1 });
  }

  function select(optionId: string) {
    if (!session || !currentStep) return;
    setShowValidation(false);

    const nextAnswers = { ...session.answers, [currentStep.questionId]: optionId };

    // Mudar uma resposta geral pode mudar o grupo vencedor — e com ele as
    // perguntas 9 e 10. As respostas adaptativas antigas deixariam de fazer
    // sentido, então são descartadas.
    if (step < 8) {
      delete nextAnswers.q9;
      delete nextAnswers.q10;
    }

    saveSession({ ...session, answers: nextAnswers });
  }

  function goNext() {
    if (!session || !currentStep) return;

    if (!session.answers[currentStep.questionId]) {
      setShowValidation(true);
      return;
    }

    if (step < TOTAL_QUESTIONS - 1) {
      const nextStep = step + 1;
      saveSession({ ...session, step: nextStep });
      track({ name: 'quiz_question_reached', step: nextStep + 1 });
      return;
    }

    finish();
  }

  function goBack() {
    if (!session || step === 0) {
      setPhase('intro');
      return;
    }
    setShowValidation(false);
    saveSession({ ...session, step: step - 1 });
  }

  function finish() {
    if (!session) return;
    try {
      const computed = computeResult(session.answers);
      const snapshot = {
        role: computed.role,
        group: computed.group,
        secondaryGroup: computed.secondaryGroup,
      };
      setResult(snapshot);
      saveResultSnapshot(snapshot);
      track({ name: 'quiz_completed', group: computed.group });
      setPhase('processing');
    } catch {
      // Estado inconsistente (ex.: storage adulterado): recomeça em vez de travar.
      restart(true);
    }
  }

  function restart(silent = false) {
    if (!silent && !window.confirm(quizUi.restartConfirm)) return;
    clearSession();
    setResult(null);
    setPhase('intro');
  }

  const reveal = useCallback(() => {
    if (!result || revealedRef.current) return;
    revealedRef.current = true;
    router.push(`/resultado/${result.role}`);
  }, [result, router]);

  // --- Render --------------------------------------------------------------

  if (phase === 'intro') {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col justify-center px-4 py-10 sm:px-6">
        <div className="rounded-[var(--radius-card)] border border-nicopel-gray bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
          <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-nicopel-green-soft px-3 py-1.5 text-xs font-semibold text-nicopel-green-deep">
            <Icon name="sparkles" className="h-4 w-4" />
            {landing.badge}
          </span>
          <h1 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-balance sm:text-3xl">
            Antes de começar
          </h1>
          <p className="mt-3 text-base leading-relaxed text-nicopel-gray-text">{landing.welcome}</p>

          <ul className="mt-5 space-y-2.5 text-sm text-nicopel-ink">
            {[
              'São 10 perguntas e leva de 2 a 3 minutos.',
              'Você pode voltar e mudar qualquer resposta.',
              'No fim, você conhece uma área que existe de verdade na Nicopel.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <Icon
                  name="check-badge"
                  className="mt-0.5 h-4 w-4 shrink-0 text-nicopel-green-deep"
                />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>

          <Button variant="primary" size="lg" onClick={start} className="mt-7 w-full">
            Vamos lá
          </Button>
        </div>
      </div>
    );
  }

  if (phase === 'processing') {
    return <ProcessingScreen />;
  }

  const hasAnswer = currentStep ? Boolean(answers[currentStep.questionId]) : false;

  return (
    <>
      {/* Com o convite aberto, o quiz atrás dele sai da árvore de acessibilidade
          e do alcance do teclado — nada de foco escapando para o fundo. */}
      <div
        inert={phase === 'raffle' ? true : undefined}
        className="mx-auto w-full max-w-xl px-4 py-6 sm:px-6 sm:py-8"
      >
        <ProgressBar current={step + 1} total={TOTAL_QUESTIONS} />

        <div ref={headingRef} tabIndex={-1} className="mt-7 outline-none">
          {currentStep && (
            <QuestionStep
              questionId={currentStep.questionId}
              prompt={currentStep.prompt}
              options={currentStep.options}
              selectedId={answers[currentStep.questionId]}
              onSelect={select}
            />
          )}
        </div>

        <p aria-live="assertive" className="mt-3 min-h-5 text-sm font-medium text-red-700">
          {showValidation ? quizUi.validation : ''}
        </p>

        <div className="mt-5 flex items-center gap-3">
          <Button variant="secondary" size="lg" onClick={goBack} className="px-5">
            <Icon name="route" className="h-4 w-4 rotate-180" />
            {quizUi.back}
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={goNext}
            // Fica visualmente apagado antes da escolha, mas continua ativo:
            // um botão realmente desabilitado deixaria a mensagem de validação
            // inalcançável para quem usa teclado ou leitor de tela.
            className={`flex-1 ${hasAnswer ? '' : 'opacity-45'}`}
          >
            {step === TOTAL_QUESTIONS - 1 ? quizUi.finish : quizUi.next}
          </Button>
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => restart()}
            className="tap-target inline-flex items-center justify-center px-4 text-xs font-medium text-nicopel-gray-text underline underline-offset-4 hover:text-nicopel-ink"
          >
            {quizUi.restart}
          </button>
        </div>
      </div>

      {result && (
        <RaffleModal
          open={phase === 'raffle'}
          resultGroup={result.group}
          resultRole={result.role}
          onReveal={reveal}
        />
      )}
    </>
  );
}
