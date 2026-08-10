'use client';

import { useState } from 'react';

/**
 * Logo da Nicopel.
 *
 * A logo oficial NÃO é redesenhada aqui. O componente carrega o arquivo
 * autorizado de `public/brand/` e, enquanto ele não existir, mostra um
 * marcador tipográfico neutro — deliberadamente diferente da marca, para não
 * ser confundido com ela. Veja `public/brand/README.md`.
 */

export interface LogoProps {
  variant?: 'dark' | 'light';
  className?: string;
}

const SOURCES = {
  dark: '/brand/nicopel-logo.svg',
  light: '/brand/nicopel-logo-branca.svg',
} as const;

export function Logo({ variant = 'dark', className = 'h-8' }: LogoProps) {
  const [failed, setFailed] = useState(false);
  const isLight = variant === 'light';

  if (!failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- asset local de tamanho fixo; next/image não agrega aqui e o fallback depende de onError.
      <img
        src={SOURCES[variant]}
        alt="Nicopel Embalagens"
        className={`w-auto ${className}`}
        onError={() => setFailed(true)}
        decoding="async"
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      role="img"
      aria-label="Nicopel Embalagens"
      data-logo-placeholder="true"
    >
      <span
        aria-hidden="true"
        className="inline-block h-3 w-3 rounded-sm bg-nicopel-green"
        style={{ transform: 'rotate(45deg)' }}
      />
      <span
        className={`text-lg font-bold tracking-tight ${isLight ? 'text-white' : 'text-nicopel-ink'}`}
      >
        Nicopel
      </span>
    </span>
  );
}
