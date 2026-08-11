'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ProcessingScreen } from '@/components/quiz/ProcessingScreen';
import { ProgressBar } from '@/components/quiz/ProgressBar';
import { QuestionStep, type StepOption } from '@/components/quiz/QuestionStep';
import { RegistrationStep } from '@/components/quiz/RegistrationStep';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { TOTAL_QUESTIONS, generalQuestions } from '@/content/quiz';
import { quizUi } from '@/content/site-content';
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
 * Orquestra a jornada: cadastro → 10 perguntas → processamento → resultado.
 *
 * O cadastro vem antes das perguntas e é onde a pessoa decide, de forma
 * opcional, participar do sorteio. O progresso vem do store de sessão
 * (`useSyncExternalStore`), então recarregar a página durante o evento devolve
 * a pessoa exatamente onde ela estava — sem descompasso de hidratação.
 */

type Phase = 'registration' | 'questions' | 'processing';

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

  const [phase, setPhase] = useState<Phase>('registration');
  const [restoreChecked, setRestoreChecked] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [result, setResult] = useState<{ role: RoleId; group: GroupId } | null>(null);

  const headingRef = useRef<HTMLDivElement>(null);
  const revealedRef = useRef(false);

  // Retomada do progresso: acontece na primeira renderização em que o store já
  // trouxe o valor do navegador (depois da hidratação), sem efeito.
  if (!restoreChecked && session !== null) {
    setRestoreChecked(true);
    setPhase('questions');
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
    if (phase !== 'processing' || !result) return;
    const timer = window.setTimeout(() => {
      if (revealedRef.current) return;
      revealedRef.current = true;
      router.push(`/resultado/${result.role}`);
    }, PROCESSING_MS);
    return () => window.clearTimeout(timer);
  }, [phase, result, router]);

  // --- Ações ---------------------------------------------------------------

  function handleRegistered(participantId: string | null) {
    saveSession(createSession(participantId));
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
    if (!session || step === 0) return;
    setShowValidation(false);
    saveSession({ ...session, step: step - 1 });
  }

  function finish() {
    if (!session) return;

    let computed;
    try {
      computed = computeResult(session.answers);
    } catch {
      // Estado inconsistente (ex.: storage adulterado): recomeça em vez de travar.
      restart(true);
      return;
    }

    setResult({ role: computed.role, group: computed.group });
    saveResultSnapshot({
      role: computed.role,
      group: computed.group,
      secondaryGroup: computed.secondaryGroup,
    });
    track({ name: 'quiz_completed', group: computed.group });
    setPhase('processing');

    // Anexa o resultado ao cadastro. Falhar aqui não pode segurar a revelação,
    // então nem esperamos a resposta.
    if (session.participantId) {
      void fetch('/api/participants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: session.participantId,
          resultGroup: computed.group,
          resultRole: computed.role,
        }),
      }).catch(() => {
        // O resultado já está na tela; a gravação é secundária.
      });
    }
  }

  function restart(silent = false) {
    if (!silent && !window.confirm(quizUi.restartConfirm)) return;
    clearSession();
    setResult(null);
    setPhase('registration');
  }

  // --- Render --------------------------------------------------------------

  if (phase === 'registration') {
    return <RegistrationStep onRegistered={handleRegistered} />;
  }

  if (phase === 'processing') {
    return <ProcessingScreen />;
  }

  const hasAnswer = currentStep ? Boolean(answers[currentStep.questionId]) : false;

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6 sm:px-6 sm:py-8">
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
        <Button
          variant="secondary"
          size="lg"
          onClick={goBack}
          disabled={step === 0}
          className="px-5"
        >
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
  );
}
