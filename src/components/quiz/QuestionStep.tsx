'use client';

import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/content/types';

/**
 * Uma pergunta por tela, com as alternativas em um radio group nativo.
 *
 * Usar `input[type=radio]` de verdade dá de graça a navegação por setas, o
 * anúncio correto em leitores de tela e o comportamento esperado em formulário.
 * O visual de card vem do `label` que envolve o input.
 */

export interface StepOption {
  id: string;
  label: string;
  icon: IconName;
}

export interface QuestionStepProps {
  questionId: string;
  prompt: string;
  options: readonly StepOption[];
  selectedId: string | undefined;
  onSelect: (optionId: string) => void;
}

export function QuestionStep({
  questionId,
  prompt,
  options,
  selectedId,
  onSelect,
}: QuestionStepProps) {
  return (
    <fieldset className="animate-[var(--animate-fold-in)]" key={questionId}>
      <legend className="mb-5 text-xl font-bold leading-snug tracking-tight text-balance sm:text-2xl">
        {prompt}
      </legend>

      <div className="grid gap-2.5">
        {options.map((option) => {
          const checked = selectedId === option.id;
          return (
            <label
              key={option.id}
              className={[
                'group relative flex cursor-pointer items-center gap-3.5 rounded-[var(--radius-card)] border-2 bg-white p-4 transition-[border-color,background-color,box-shadow] duration-150',
                'has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-nicopel-green-deep',
                checked
                  ? 'border-nicopel-black bg-nicopel-green-soft shadow-[var(--shadow-soft)]'
                  : 'border-nicopel-gray hover:border-nicopel-gray-mid',
              ].join(' ')}
            >
              <input
                type="radio"
                name={questionId}
                value={option.id}
                checked={checked}
                onChange={() => onSelect(option.id)}
                className="sr-only"
              />

              <span
                className={[
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors',
                  checked
                    ? 'bg-nicopel-black text-nicopel-green'
                    : 'bg-nicopel-gray/60 text-nicopel-gray-text group-hover:bg-nicopel-gray',
                ].join(' ')}
                aria-hidden="true"
              >
                <Icon name={option.icon} className="h-5 w-5" />
              </span>

              <span className="flex-1 text-sm leading-snug font-medium sm:text-base">
                {option.label}
              </span>

              {/* Indicador de seleção: forma + cor, nunca só cor. */}
              <span
                aria-hidden="true"
                className={[
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  checked ? 'border-nicopel-black bg-nicopel-black' : 'border-nicopel-gray-mid',
                ].join(' ')}
              >
                {checked && (
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-nicopel-green" fill="none">
                    <path
                      d="m3.5 8.5 3 3 6-7"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
