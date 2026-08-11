'use client';

import { useState } from 'react';

/**
 * Moldura para as fotos reais do parque fabril, da equipe e das embalagens.
 *
 * Serve AVIF para quem suporta, WebP para o resto e mantém um `onError` que cai
 * numa composição gráfica de dobras de papel caso o arquivo não exista — é o
 * que permite subir uma foto nova sem tocar em código, e nunca exibir foto
 * genérica de banco de imagem.
 */

export interface PhotoFrameProps {
  /** Caminho da imagem de fallback (WebP). */
  src: string;
  /** Versão AVIF, quando existir. */
  avifSrc?: string;
  alt: string;
  className?: string;
  /** Proporção intrínseca, para reservar espaço e evitar layout shift. */
  width?: number;
  height?: number;
  /** Rótulo curto exibido sobre o placeholder, para orientar quem for subir a foto. */
  placeholderLabel?: string;
  priority?: boolean;
  /** Ajusta o enquadramento quando o corte padrão (centro) não funciona. */
  objectPosition?: string;
}

export function PhotoFrame({
  src,
  avifSrc,
  alt,
  className = '',
  width,
  height,
  placeholderLabel = 'Foto real da Nicopel',
  priority = false,
  objectPosition,
}: PhotoFrameProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`relative overflow-hidden rounded-[var(--radius-card)] bg-nicopel-gray ${className}`}
    >
      {!failed ? (
        <picture>
          {avifSrc && <source srcSet={avifSrc} type="image/avif" />}
          <source srcSet={src} type="image/webp" />
          {/* `img` dentro de `picture`: precisa de onError para cair no
              placeholder quando a foto ainda não foi autorizada. */}
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="h-full w-full object-cover"
            style={objectPosition ? { objectPosition } : undefined}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            onError={() => setFailed(true)}
          />
        </picture>
      ) : (
        <div
          className="flex h-full w-full items-center justify-center bg-nicopel-gray"
          role="img"
          aria-label={alt}
          data-photo-placeholder="true"
        >
          <svg
            viewBox="0 0 400 300"
            className="h-full w-full"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="pf-paper" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f4f5f5" />
                <stop offset="100%" stopColor="#dcdedf" />
              </linearGradient>
            </defs>
            <rect width="400" height="300" fill="url(#pf-paper)" />
            {/* Dobras de embalagem */}
            <path d="M0 210 L120 150 L260 220 L400 160 L400 300 L0 300 Z" fill="#cfd2d3" />
            <path d="M120 150 L260 220 L260 300 L120 300 Z" fill="#c3c7c8" opacity="0.7" />
            {/* Faca de corte */}
            <path
              d="M40 60 H360 V240 H40 Z"
              fill="none"
              stroke="#9a9c9e"
              strokeWidth="1.5"
              strokeDasharray="9 7"
            />
            <path d="M40 60 L90 20 M360 60 L310 20" stroke="#b4d334" strokeWidth="3" />
          </svg>
          <span className="absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-1 text-[11px] font-medium text-nicopel-gray-text">
            {placeholderLabel}
          </span>
        </div>
      )}
    </div>
  );
}
