import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { seo, siteUrl } from '@/content/site-content';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
  // Auto-hospedada no build: nenhuma requisição externa em tempo de execução.
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: seo.title,
    template: '%s | Nicopel',
  },
  description: seo.description,
  applicationName: 'Quiz de Carreiras Nicopel',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Nicopel Embalagens',
    // Metadados genéricos da campanha: nenhum resultado ou dado pessoal aqui.
    title: seo.ogTitle,
    description: seo.ogDescription,
    url: siteUrl(),
  },
  twitter: {
    card: 'summary_large_image',
    title: seo.ogTitle,
    description: seo.ogDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-dvh antialiased">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-nicopel-black focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
        >
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
