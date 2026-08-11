'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';

/**
 * Vídeo institucional da indústria, em loop e sem som.
 *
 * O carregamento só começa quando a seção entra na tela (IntersectionObserver):
 * quem abre o quiz e vai direto responder nunca baixa os 4 MB. Quem rola até
 * aqui vê o loop começar sozinho — sem áudio, como manda o autoplay dos
 * navegadores, e sem autoplay algum se a pessoa pediu menos movimento.
 */
export function FactoryVideo() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    // Sem IntersectionObserver, carrega direto — melhor que não mostrar nada.
    if (typeof IntersectionObserver === 'undefined') {
      const timer = window.setTimeout(() => setVisible(true), 0);
      return () => window.clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  return (
    <section
      ref={sectionRef}
      aria-labelledby="video-titulo"
      className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6"
    >
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-nicopel-green-soft px-3.5 py-1.5 text-xs font-semibold text-nicopel-green-deep">
          <Icon name="factory" className="h-4 w-4" />
          Por dentro da fábrica
        </span>
        <h2
          id="video-titulo"
          className="mt-4 text-2xl font-bold tracking-tight text-balance sm:text-3xl"
        >
          Veja onde o papel vira embalagem
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-nicopel-gray-text sm:text-base">
          São 6.000 m² de parque fabril em Londrina, com impressão offset, corte-vinco, acabamento e
          logística sob o mesmo teto.
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-[var(--radius-card)] bg-nicopel-black shadow-[var(--shadow-lifted)]">
        <video
          className="aspect-video w-full"
          poster="/video/industria-poster.webp"
          controls
          muted
          loop
          playsInline
          autoPlay={visible && !reduceMotion}
          preload={visible ? 'auto' : 'none'}
          aria-label="Vídeo institucional da Nicopel Embalagens mostrando o parque fabril e a produção de embalagens de papel"
        >
          {visible && <source src="/video/industria.mp4" type="video/mp4" />}
          Seu navegador não consegue exibir este vídeo. Ele mostra o parque fabril da Nicopel e as
          etapas de produção das embalagens de papel.
        </video>
      </div>
    </section>
  );
}
