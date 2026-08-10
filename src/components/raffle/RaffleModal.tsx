'use client';

import { useId, useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { company, raffle } from '@/content/site-content';
import type { GroupId, RoleId } from '@/content/types';
import { track } from '@/lib/analytics';
import { RaffleForm } from './RaffleForm';

/**
 * Convite opcional para o sorteio da visita técnica.
 *
 * Aparece depois do cálculo e antes da revelação. Recusar, pular ou fechar
 * revela o resultado imediatamente e sem coletar nada. Nenhuma opção vem
 * pré-selecionada.
 */

type Step = 'choice' | 'form' | 'success' | 'failure';
type Choice = 'yes' | 'no';

export interface RaffleModalProps {
  open: boolean;
  resultGroup: GroupId;
  resultRole: RoleId;
  /** Revela o resultado. Chamado em qualquer caminho de saída do modal. */
  onReveal: () => void;
}

export function RaffleModal({ open, resultGroup, resultRole, onReveal }: RaffleModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const [step, setStep] = useState<Step>('choice');
  const [choice, setChoice] = useState<Choice | null>(null);
  const [duplicate, setDuplicate] = useState(false);

  function skip() {
    track({ name: 'raffle_choice', choice: 'pulou' });
    onReveal();
  }

  function confirmChoice() {
    if (choice === 'yes') {
      track({ name: 'raffle_choice', choice: 'sim' });
      setStep('form');
      return;
    }
    track({ name: 'raffle_choice', choice: 'nao' });
    onReveal();
  }

  return (
    <Modal open={open} onClose={skip} labelledBy={titleId} describedBy={descriptionId}>
      {/* ------------------------------------------------ Banner do convite */}
      <div className="relative overflow-hidden rounded-t-[var(--radius-card)] bg-nicopel-black px-6 py-6 text-white">
        <div className="bg-paper-grid-dark absolute inset-0" aria-hidden="true" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-nicopel-green px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-nicopel-black">
            <Icon name="factory" className="h-3.5 w-3.5" />
            Visita técnica
          </span>
          <h2 id={titleId} className="mt-3 text-lg font-bold leading-snug text-balance sm:text-xl">
            {step === 'success' ? raffle.successTitle : raffle.banner}
          </h2>
        </div>
      </div>

      <div className="px-6 py-6">
        {step === 'choice' && (
          <ChoiceStep
            descriptionId={descriptionId}
            choice={choice}
            onChoice={setChoice}
            onConfirm={confirmChoice}
            onSkip={skip}
          />
        )}

        {step === 'form' && (
          <>
            <h3 className="text-base font-bold">{raffle.formTitle}</h3>
            <p id={descriptionId} className="mt-1 mb-5 text-sm leading-relaxed text-nicopel-gray-text">
              {raffle.formSubtitle}
            </p>
            <RaffleForm
              resultGroup={resultGroup}
              resultRole={resultRole}
              onSuccess={(outcome) => {
                track({ name: 'raffle_submitted', status: 'ok' });
                setDuplicate(outcome === 'duplicate');
                setStep('success');
              }}
              onFailure={() => {
                track({ name: 'raffle_submitted', status: 'erro' });
                setStep('failure');
              }}
              onSkip={skip}
            />
          </>
        )}

        {step === 'success' && (
          <div className="text-center">
            <span
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-nicopel-green-soft text-nicopel-green-deep"
              aria-hidden="true"
            >
              <Icon name="check-badge" className="h-7 w-7" />
            </span>
            <p id={descriptionId} className="mt-4 text-sm leading-relaxed text-nicopel-gray-text" role="status">
              {duplicate
                ? 'Você já estava inscrito com esse contato — está tudo certo, sua participação continua valendo. '
                : ''}
              {raffle.successText}
            </p>
            <p className="mt-4 rounded-xl bg-nicopel-gray/40 p-3 text-xs leading-relaxed text-nicopel-gray-text">
              <span className="font-semibold text-nicopel-ink">Onde acontece a visita</span>
              <br />
              {company.address.full}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Button variant="primary" size="lg" onClick={onReveal}>
                Ver meu resultado
              </Button>
              <ButtonLink href={company.address.mapUrl} variant="secondary" size="md">
                Abrir no mapa
              </ButtonLink>
            </div>
          </div>
        )}

        {step === 'failure' && (
          <div>
            <p
              id={descriptionId}
              role="alert"
              className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900"
            >
              {raffle.errorText}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Button variant="primary" size="lg" onClick={() => setStep('form')}>
                {raffle.retry}
              </Button>
              <Button variant="secondary" size="md" onClick={onReveal}>
                {raffle.seeResultAnyway}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

/** Etapa 1: dois radio cards, nenhum pré-selecionado, e o link de pular sempre visível. */
function ChoiceStep({
  descriptionId,
  choice,
  onChoice,
  onConfirm,
  onSkip,
}: {
  descriptionId: string;
  choice: Choice | null;
  onChoice: (value: Choice) => void;
  onConfirm: () => void;
  onSkip: () => void;
}) {
  const options: { value: Choice; label: string }[] = [
    { value: 'yes', label: raffle.optionYes },
    { value: 'no', label: raffle.optionNo },
  ];

  return (
    <>
      <p id={descriptionId} className="text-sm leading-relaxed text-nicopel-gray-text">
        {raffle.text}
      </p>

      <p className="mt-3 flex items-start gap-2 rounded-xl bg-nicopel-gray/40 p-3 text-xs leading-relaxed text-nicopel-gray-text">
        <Icon name="route" className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{company.address.full}</span>
      </p>

      <fieldset className="mt-5">
        <legend className="sr-only">Quer participar do sorteio da visita técnica?</legend>
        <div className="grid gap-2.5">
          {options.map((option) => {
            const checked = choice === option.value;
            return (
              <label
                key={option.value}
                className={[
                  'flex cursor-pointer items-center gap-3 rounded-[var(--radius-card)] border-2 p-4 transition-colors',
                  'has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-nicopel-green-deep',
                  checked
                    ? 'border-nicopel-black bg-nicopel-green-soft'
                    : 'border-nicopel-gray hover:border-nicopel-gray-mid',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="raffle-choice"
                  value={option.value}
                  checked={checked}
                  onChange={() => onChoice(option.value)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={[
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                    checked ? 'border-nicopel-black bg-nicopel-black' : 'border-nicopel-gray-mid',
                  ].join(' ')}
                >
                  {checked && <span className="h-2.5 w-2.5 rounded-full bg-nicopel-green" />}
                </span>
                <span className="text-sm font-medium">{option.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5 flex flex-col gap-2">
        <Button variant="primary" size="lg" onClick={onConfirm} disabled={choice === null}>
          {choice === 'no' ? raffle.ctaNo : raffle.ctaYes}
        </Button>
        <Button variant="ghost" size="md" onClick={onSkip}>
          {raffle.skipLink}
        </Button>
      </div>
    </>
  );
}
