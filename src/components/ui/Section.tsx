import type { ReactNode } from 'react';

/**
 * Primitivas de layout.
 *
 * Antes cada seção escolhia o próprio `py-`, o próprio `max-w-` e a própria
 * borda, e o resultado eram blocos desalinhados verticalmente. Estas duas
 * peças centralizam essas decisões: toda seção respira igual e todo conteúdo
 * fica na mesma coluna, do topo ao rodapé.
 */

type Tone = 'default' | 'muted' | 'dark';

const TONES: Record<Tone, string> = {
  default: 'bg-white',
  muted: 'border-y border-nicopel-gray bg-nicopel-gray/30',
  dark: 'bg-nicopel-black text-white',
};

export interface SectionProps {
  children: ReactNode;
  tone?: Tone;
  /** Ritmo vertical. `tight` para blocos curtos, `loose` para os de destaque. */
  spacing?: 'tight' | 'normal' | 'loose';
  id?: string;
  labelledBy?: string;
  className?: string;
}

const SPACING = {
  tight: 'py-10 sm:py-12',
  normal: 'py-14 sm:py-18',
  loose: 'py-16 sm:py-24',
} as const;

export function Section({
  children,
  tone = 'default',
  spacing = 'normal',
  id,
  labelledBy,
  className = '',
}: SectionProps) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={`${TONES[tone]} ${id ? 'scroll-mt-16' : ''}`}>
      <div className={`mx-auto w-full max-w-5xl px-5 sm:px-6 ${SPACING[spacing]} ${className}`}>
        {children}
      </div>
    </section>
  );
}

export interface SectionHeadingProps {
  /** Selo curto acima do título. */
  eyebrow?: ReactNode;
  title: string;
  description?: string;
  id?: string;
  align?: 'left' | 'center';
  tone?: 'light' | 'dark';
  className?: string;
}

/** Cabeçalho de seção: selo, título e descrição sempre na mesma proporção. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  id,
  align = 'left',
  tone = 'light',
  className = '',
}: SectionHeadingProps) {
  const centered = align === 'center';

  return (
    <div className={`${centered ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'} ${className}`}>
      {eyebrow && <div className={centered ? 'flex justify-center' : ''}>{eyebrow}</div>}
      <h2
        id={id}
        className={`text-balance text-2xl font-bold leading-tight tracking-tight sm:text-3xl ${
          eyebrow ? 'mt-4' : ''
        } ${tone === 'dark' ? 'text-white' : 'text-nicopel-ink'}`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-3 text-sm leading-relaxed sm:text-base ${
            tone === 'dark' ? 'text-white/75' : 'text-nicopel-gray-text'
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}

/** Selo pequeno usado acima dos títulos. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-nicopel-green-soft px-3.5 py-1.5 text-xs font-semibold text-nicopel-green-deep">
      {children}
    </span>
  );
}
