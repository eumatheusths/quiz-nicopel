import type { NextConfig } from 'next';

/**
 * Headers de segurança aplicados a todas as rotas.
 * A CSP é restritiva de propósito: o quiz não depende de nenhuma chamada externa.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // O Next injeta scripts inline de hidratação; 'unsafe-inline' é necessário no App Router.
      "script-src 'self' 'unsafe-inline'" +
        (process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'" + (process.env.NODE_ENV === 'development' ? ' ws:' : ''),
      "form-action 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    serverActions: {
      /**
       * O envio de currículo passa por uma Server Action, e o padrão do Next
       * é 1 MB — acima disso a requisição morre com 500 antes de chegar ao
       * nosso código, derrubando a página.
       *
       * 4 MB deixa folga para o arquivo (limitado a 3 MB na interface) mais os
       * demais campos e o overhead do multipart, e ainda fica abaixo do teto
       * de 4,5 MB que a Vercel impõe ao corpo de uma função serverless.
       */
      bodySizeLimit: '4mb',
    },
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // O painel e as APIs administrativas nunca podem ser indexados.
      {
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
      {
        source: '/api/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
    ];
  },
};

export default nextConfig;
