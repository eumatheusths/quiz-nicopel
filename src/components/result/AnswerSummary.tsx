'use client';

import { useSyncExternalStore } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { RoleId } from '@/content/types';
import { tryExplainResult } from '@/lib/explain';
import {
  getSessionServerSnapshot,
  getSessionSnapshot,
  subscribeToQuizStore,
} from '@/lib/quiz-session';

/**
 * “Por que esse resultado” + o mapa das 10 respostas.
 *
 * Lê as respostas da sessão do navegador. Em um link compartilhado, sem sessão,
 * o bloco some e o resultado continua completo — as respostas de alguém nunca
 * viajam pela URL.
 */
export function AnswerSummary({ role }: { role: RoleId }) {
  const session = useSyncExternalStore(
    subscribeToQuizStore,
    getSessionSnapshot,
    getSessionServerSnapshot,
  );

  if (!session) return null;

  const explanation = tryExplainResult(session.answers);
  if (!explanation || explanation.role !== role) return null;

  const maxScore = Math.max(...explanation.ranking.map((entry) => entry.score), 1);

  return (
    <section
      aria-labelledby="resumo-respostas-titulo"
      className="overflow-hidden rounded-[var(--radius-card)] border border-nicopel-gray bg-white shadow-[var(--shadow-soft)]"
    >
      <div className="border-b border-nicopel-gray p-6">
        <h2 id="resumo-respostas-titulo" className="flex items-center gap-2.5 text-base font-bold">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-nicopel-green-soft text-nicopel-green-deep"
            aria-hidden="true"
          >
            <Icon name="search" className="h-4 w-4" />
          </span>
          Por que esse resultado
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-nicopel-ink">{explanation.reason}</p>

        {/* Ranking das áreas — barras proporcionais às escolhas. */}
        <ul className="mt-5 space-y-2.5">
          {explanation.ranking.map((entry) => {
            const isWinner = entry.group === explanation.group;
            return (
              <li key={entry.group} className="grid grid-cols-[1fr_auto] items-center gap-x-3">
                <span
                  className={`truncate text-xs ${
                    isWinner ? 'font-bold text-nicopel-ink' : 'text-nicopel-gray-text'
                  }`}
                >
                  {entry.name}
                </span>
                <span
                  className={`text-xs font-semibold tabular-nums ${
                    isWinner ? 'text-nicopel-green-deep' : 'text-nicopel-gray-mid'
                  }`}
                >
                  {entry.score}/8
                </span>
                <span
                  className="col-span-2 mt-1 h-2 w-full overflow-hidden rounded-[var(--radius-pill)] bg-nicopel-gray"
                  aria-hidden="true"
                >
                  <span
                    className={`block h-full rounded-[var(--radius-pill)] ${
                      isWinner ? 'bg-nicopel-green' : 'bg-nicopel-gray-mid/50'
                    }`}
                    style={{ width: `${(entry.score / maxScore) * 100}%` }}
                  />
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ------------------------------------------------------ As 10 respostas */}
      <div className="p-6">
        <h3 className="text-xs font-bold uppercase tracking-wide text-nicopel-gray-text">
          Suas 10 respostas
        </h3>

        <ol className="mt-4 space-y-4">
          {explanation.steps.map((step) => (
            <li key={step.questionId} className="grid grid-cols-[28px_1fr] gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-nicopel-black text-xs font-bold text-nicopel-green"
                aria-hidden="true"
              >
                {step.number}
              </span>

              <div className="min-w-0">
                <p className="text-xs leading-snug text-nicopel-gray-text">{step.prompt}</p>
                <p className="mt-1 text-sm font-semibold leading-snug text-nicopel-ink">
                  {step.answer}
                </p>

                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                  <span className="rounded-[var(--radius-pill)] bg-nicopel-gray/60 px-2.5 py-0.5 font-medium text-nicopel-gray-text">
                    {step.insight}
                  </span>
                  <span aria-hidden="true" className="text-nicopel-gray-mid">
                    →
                  </span>
                  <span className="font-semibold text-nicopel-green-deep">
                    {step.target}
                    <span className="sr-only">
                      {step.targetKind === 'area' ? ' (área)' : ' (cargo)'}
                    </span>
                  </span>
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
