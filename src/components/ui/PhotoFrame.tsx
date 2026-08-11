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
          {/* Planificação de uma caixa: contorno sólido é a faca de corte,
              tracejado são os vincos, e o verde marca os cantos. Tudo cabe no
              terço central, então sobrevive ao recorte em qualquer proporção —
              de 21:9 na foto da equipe a 3:4 no retrato do colaborador. */}
          <svg
            viewBox="0 0 400 300"
            className="h-full w-full"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="pf-paper" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f6f7f7" />
                <stop offset="100%" stopColor="#dcdedf" />
              </linearGradient>
            </defs>
            <rect width="400" height="300" fill="url(#pf-paper)" />

            <path
              d="M140 95 H260 V115 H290 V185 H260 V205 H140 V185 H110 V115 H140 Z"
              fill="#ffffff"
              fillOpacity="0.55"
              stroke="#9a9c9e"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />

            <g stroke="#b0b3b4" strokeWidth="1.2" strokeDasharray="7 6">
              <path d="M110 115 H290" />
              <path d="M110 185 H290" />
              <path d="M140 95 V205" />
              <path d="M260 95 V205" />
            </g>

            <g stroke="#b4d334" strokeWidth="2.4" fill="none" strokeLinecap="round">
              <path d="M101 95 H110 V86" />
              <path d="M299 95 H290 V86" />
              <path d="M101 205 H110 V214" />
              <path d="M299 205 H290 V214" />
            </g>
          </svg>
          <span className="absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-1 text-[11px] font-medium text-nicopel-gray-text">
            {placeholderLabel}
          </span>
        </div>
      )}
    </div>
  );
}
