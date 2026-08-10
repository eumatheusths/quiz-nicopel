'use client';

import { useSyncExternalStore } from 'react';
import { Icon } from '@/components/ui/Icon';
import { groups } from '@/content/quiz';
import { resultUi } from '@/content/site-content';
import { GROUP_IDS, type GroupId, type RoleId } from '@/content/types';
import {
  getResultServerSnapshot,
  getResultSnapshot,
  subscribeToQuizStore,
} from '@/lib/quiz-session';

/**
 * “Você também pode explorar...”.
 *
 * A área secundária vem do cálculo, guardado na sessão — não da URL. Em um link
 * compartilhado, sem sessão, o bloco simplesmente não aparece; o resultado
 * principal continua completo.
 */
export function SecondaryArea({ role }: { role: RoleId }) {
  const snapshot = useSyncExternalStore(
    subscribeToQuizStore,
    getResultSnapshot,
    getResultServerSnapshot,
  );

  if (!snapshot || snapshot.role !== role) return null;
  if (!GROUP_IDS.includes(snapshot.secondaryGroup as GroupId)) return null;

  const secondary = groups[snapshot.secondaryGroup as GroupId];

  return (
    <section
      aria-labelledby="area-secundaria-titulo"
      className="rounded-[var(--radius-card)] border border-nicopel-gray bg-nicopel-gray/30 p-5 animate-[var(--animate-fade)]"
    >
      <h2
        id="area-secundaria-titulo"
        className="flex items-center gap-2 text-sm font-bold text-nicopel-ink"
      >
        <Icon name="route" className="h-4 w-4 text-nicopel-green-deep" />
        {resultUi.secondaryTitle}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-nicopel-gray-text">
        {resultUi.secondaryText(secondary.name)}
      </p>
      <p className="mt-1 text-xs text-nicopel-gray-mid">{secondary.tagline}</p>
    </section>
  );
}
