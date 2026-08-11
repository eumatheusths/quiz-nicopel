/**
 * Logo oficial da Nicopel.
 *
 * Usa os arquivos originais fornecidos pela Nicopel, sem redesenhar, deformar
 * ou recolorir: `nicopel-logo.png` sobre fundos claros e
 * `nicopel-logo-branca.png` sobre fundos escuros ou fotos.
 *
 * As dimensões intrínsecas (802 × 216) vão no HTML para o navegador reservar o
 * espaço exato e a página não pular durante o carregamento.
 */

const INTRINSIC = { width: 802, height: 216 } as const;

const SOURCES = {
  dark: '/brand/nicopel-logo.png',
  light: '/brand/nicopel-logo-branca.png',
} as const;

export interface LogoProps {
  /** `dark` = logo preta (fundo claro). `light` = logo branca (fundo escuro). */
  variant?: 'dark' | 'light';
  /** Classe de altura, ex.: `h-8`. A largura acompanha na proporção original. */
  className?: string;
  priority?: boolean;
}

export function Logo({ variant = 'dark', className = 'h-8', priority = false }: LogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- asset local pequeno e de tamanho fixo; o otimizador do next/image não traz ganho aqui.
    <img
      src={SOURCES[variant]}
      alt="Grupo Nicopel Embalagens"
      width={INTRINSIC.width}
      height={INTRINSIC.height}
      className={`w-auto ${className}`}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
    />
  );
}
