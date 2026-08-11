import type { IconName } from '@/content/types';

/**
 * Conjunto de ícones de linha, desenhados para o vocabulário visual da Nicopel:
 * papel, dobras, linha de produção e movimento industrial.
 *
 * São decorativos — o significado sempre está no texto ao lado, por isso todos
 * saem com `aria-hidden`.
 */

const paths: Record<IconName, React.ReactNode> = {
  handshake: (
    <>
      {/* Duas mãos se apertando: cada braço entra por um lado e as mãos se
          cruzam no centro. O par de traços diagonais é o antebraço. */}
      <path d="m12 13.2-2.6-2.6a2 2 0 0 0-2.8 2.8l3.6 3.6a2 2 0 0 0 2.8 0" />
      <path d="m12 12.4 3 3a2 2 0 0 0 2.8-2.8l-3.6-3.6a2 2 0 0 0-2.8 0l-1 1" />
      <path d="M3 8.5h3.5L9 6" />
      <path d="M21 8.5h-3.5L15 6" />
    </>
  ),
  lightbulb: (
    <>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.5.4.8 1 .9 1.6l.1.6h5.2l.1-.6c.1-.6.4-1.2.9-1.6A6 6 0 0 0 12 3Z" />
    </>
  ),
  users: (
    <>
      {/* Duas pessoas completas: a de trás é menor e desenhada por inteiro,
          em vez de um arco solto que parecia um traço perdido. */}
      <circle cx="8.5" cy="8" r="3" />
      <path d="M3 19.5a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="9.5" r="2.2" />
      <path d="M16 13.8a4.2 4.2 0 0 1 5 4.1" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20h16" />
      <rect x="5" y="12" width="3.5" height="6" rx="1" />
      <rect x="10.2" y="8" width="3.5" height="10" rx="1" />
      <rect x="15.5" y="4" width="3.5" height="14" rx="1" />
    </>
  ),
  wrench: (
    <>
      <path d="M15.5 3.5a5 5 0 0 0-5.9 6.4l-6 6a2 2 0 0 0 2.9 2.8l6-6a5 5 0 0 0 6.4-5.9l-3 3-2.8-.6-.6-2.8Z" />
    </>
  ),
  truck: (
    <>
      <path d="M3 7h10v8H3z" />
      <path d="M13 10h4l3 3v2h-7z" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H16a5 5 0 0 0 5-5c0-3.9-4-7-9-7Z" />
      <circle cx="8" cy="11" r="1" />
      <circle cx="11" cy="7.5" r="1" />
      <circle cx="15.5" cy="9" r="1" />
    </>
  ),
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M9 20h6" />
      <path d="M12 16v4" />
      <path d="m8.5 8 2 2-2 2" />
      <path d="M13 12h3" />
    </>
  ),
  heart: (
    <>
      <path d="M12 20s-7-4.4-7-9.2A4 4 0 0 1 12 8a4 4 0 0 1 7 2.8C19 15.6 12 20 12 20Z" />
    </>
  ),
  clipboard: (
    <>
      <path d="M9 4h6v3H9z" />
      <path d="M9 5.5H7a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5a2 2 0 0 0-2-2h-2" />
      <path d="M8.5 11.5h7" />
      <path d="M8.5 15.5h4.5" />
    </>
  ),
  megaphone: (
    <>
      <path d="M4 10v4a1 1 0 0 0 1 1h2.5L15 19V5L7.5 9H5a1 1 0 0 0-1 1Z" />
      <path d="M18 9.5a3.5 3.5 0 0 1 0 5" />
      <path d="M8 15v4h3" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v6c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M4 10h16" />
      <path d="M8 3v4M16 3v4" />
      <path d="M8.5 14h2M13.5 14h2M8.5 17.5h2" />
    </>
  ),
  ruler: (
    <>
      <rect x="2.5" y="8.5" width="19" height="7" rx="1.5" transform="rotate(-8 12 12)" />
      <path d="M7 9.5v2.5M10.5 9v2M14 8.5v2.5M17.5 8v2" />
    </>
  ),
  'check-badge': (
    <>
      <path d="m12 3 2.2 1.6 2.7-.2.8 2.6 2.2 1.6-1 2.5 1 2.5-2.2 1.6-.8 2.6-2.7-.2L12 21l-2.2-1.6-2.7.2-.8-2.6L4.1 15.4l1-2.5-1-2.5 2.2-1.6.8-2.6 2.7.2L12 3Z" />
      <path d="m9.3 12.2 1.9 1.9 3.5-3.7" />
    </>
  ),
  factory: (
    <>
      <path d="M3 20V11l5 3V11l5 3V8l6 3.5V20z" />
      <path d="M2 20h20" />
      <path d="M6 4h3l.5 5h-4z" />
      {/* Janelas alinhadas dentro do galpão, no lugar do traço solto. */}
      <path d="M6.2 17h1.6M11.2 17h1.6M16.2 17h1.6" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="m19.4 13.5.1-1.5-.1-1.5 1.7-1.2-1.5-2.6-2 .7-2.6-1.5L14.5 3h-3l-.5 2.9-2.6 1.5-2-.7L4.9 9.3l1.7 1.2-.1 1.5.1 1.5-1.7 1.2 1.5 2.6 2-.7 2.6 1.5.5 2.9h3l.5-2.9 2.6-1.5 2 .7 1.5-2.6-1.7-1.2Z" />
    </>
  ),
  coins: (
    <>
      <ellipse cx="9" cy="7" rx="5.5" ry="2.5" />
      <path d="M3.5 7v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5V7" />
      <path d="M9 13.5v3c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4" />
      <ellipse cx="14.5" cy="12.5" rx="5.5" ry="2.5" />
    </>
  ),
  cart: (
    <>
      <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.5L20 7H6" />
      <circle cx="10" cy="19.5" r="1.4" />
      <circle cx="17" cy="19.5" r="1.4" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
      <path d="m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
      <path d="m5.5 14 .6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6L3.3 16.2l1.6-.6.6-1.6Z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.2" />
    </>
  ),
  box: (
    <>
      <path d="m12 3 8 4.2v9.6L12 21l-8-4.2V7.2z" />
      <path d="m4 7.2 8 4.2 8-4.2" />
      <path d="M12 11.4V21" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M8.5 6H14a3.5 3.5 0 0 1 0 7h-4a3.5 3.5 0 0 0 0 7h5.5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
};

export interface IconProps {
  name: IconName;
  className?: string;
}

export function Icon({ name, className = 'h-6 w-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
