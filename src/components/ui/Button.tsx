import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * Botões do projeto. Todos respeitam o alvo de toque mínimo de 44 × 44 px e
 * mantêm contraste AA nas duas variantes.
 */

type Variant = 'primary' | 'secondary' | 'ghost' | 'inverse';
type Size = 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] font-semibold tap-target transition-[transform,background-color,border-color,color] duration-150 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100';

const variants: Record<Variant, string> = {
  primary:
    'bg-nicopel-black text-white hover:bg-nicopel-ink border border-nicopel-black shadow-[var(--shadow-soft)]',
  secondary:
    'bg-white text-nicopel-ink border border-nicopel-gray hover:border-nicopel-black hover:bg-nicopel-gray/40',
  ghost: 'bg-transparent text-nicopel-gray-text underline underline-offset-4 hover:text-nicopel-ink',
  inverse:
    'bg-nicopel-green text-nicopel-black border border-nicopel-green hover:bg-nicopel-green-deep hover:text-white hover:border-nicopel-green-deep font-bold',
};

const sizes: Record<Size, string> = {
  md: 'px-5 py-3 text-sm',
  lg: 'px-7 py-4 text-base',
};

function classes(variant: Variant, size: Size, className?: string): string {
  return [base, variants[variant], sizes[size], className].filter(Boolean).join(' ');
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return <button {...props} className={classes(variant, size, className)} />;
}

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonLinkProps) {
  const isExternal = /^https?:\/\//.test(href);
  const finalClassName = classes(variant, size, className);

  if (isExternal) {
    return <a {...props} href={href} target="_blank" rel="noopener noreferrer" className={finalClassName} />;
  }

  return <Link {...props} href={href} className={finalClassName} />;
}
