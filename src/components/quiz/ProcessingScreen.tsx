import { quizUi } from '@/content/site-content';

/**
 * Tela de processamento — no máximo 1,2 s, sem atraso artificial longo.
 * A animação é leve (CSS puro) e desligada por `prefers-reduced-motion`.
 */
export function ProcessingScreen() {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="relative h-24 w-24" aria-hidden="true">
        {/* Embalagem sendo dobrada */}
        <svg viewBox="0 0 96 96" className="h-full w-full">
          <g style={{ transformOrigin: '48px 48px' }} className="animate-[var(--animate-fold-loop)]">
            <path d="M20 40 L48 26 L76 40 L48 54 Z" fill="#b4d334" />
            <path d="M20 40 L48 54 L48 82 L20 68 Z" fill="#d7d9da" />
            <path d="M76 40 L48 54 L48 82 L76 68 Z" fill="#9a9c9e" />
          </g>
          <path
            d="M8 88 H88"
            stroke="#e6e7e8"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="10 8"
            className="animate-[var(--animate-belt)]"
          />
        </svg>
      </div>

      <h1 className="mt-7 text-xl font-bold tracking-tight text-balance sm:text-2xl">
        {quizUi.processingTitle}
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-nicopel-gray-text">
        {quizUi.processingText}
      </p>
    </div>
  );
}
