/**
 * Analytics anônimo e agregado.
 *
 * Regra do projeto: nada aqui pode conter nome, contato, respostas individuais
 * ou qualquer identificador de pessoa. Só marcos do funil e o grupo resultante.
 * Se nenhuma ferramenta estiver instalada, as chamadas viram no-op.
 */

export type AnalyticsEvent =
  | { name: 'quiz_started' }
  | { name: 'quiz_question_reached'; step: number }
  | { name: 'quiz_completed'; group: string }
  | { name: 'raffle_invite_opened' }
  | { name: 'raffle_choice'; choice: 'sim' | 'nao' | 'pulou' }
  | { name: 'raffle_submitted'; status: 'ok' | 'erro' }
  | { name: 'talent_pool_clicked' }
  | { name: 'result_shared'; method: 'share' | 'copy' };

type VercelAnalytics = (
  kind: 'event',
  payload: { name: string; data?: Record<string, string | number | boolean> },
) => void;

declare global {
  interface Window {
    va?: VercelAnalytics;
  }
}

export function track(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;

  const { name, ...rest } = event;
  const data = Object.fromEntries(
    Object.entries(rest).filter(([, value]) => value !== undefined),
  ) as Record<string, string | number | boolean>;

  try {
    window.va?.('event', { name, data: Object.keys(data).length > 0 ? data : undefined });
  } catch {
    // Métrica nunca pode quebrar a experiência do quiz.
  }
}
