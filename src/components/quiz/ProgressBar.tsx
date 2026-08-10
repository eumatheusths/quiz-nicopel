import { quizUi } from '@/content/site-content';

export interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = Math.round((current / total) * 100);
  const label = quizUi.progress(current, total);

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        {/* aria-live avisa leitores de tela a cada mudança de etapa. */}
        <p className="text-xs font-semibold text-nicopel-gray-text" aria-live="polite">
          {label}
        </p>
        <p className="text-xs font-medium text-nicopel-gray-mid" aria-hidden="true">
          {percent}%
        </p>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-[var(--radius-pill)] bg-nicopel-gray"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-valuetext={label}
      >
        <div
          className="h-full rounded-[var(--radius-pill)] bg-nicopel-green transition-[width] duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
