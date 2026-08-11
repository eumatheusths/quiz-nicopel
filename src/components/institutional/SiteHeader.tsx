import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { event } from '@/content/site-content';

/**
 * Cabeçalho fixo no topo. Usa a mesma coluna (`max-w-5xl` + `px-5`) das seções
 * da página, para o logo alinhar com o conteúdo abaixo dele.
 */
export function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-nicopel-gray bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
        <Link
          href="/"
          className="flex items-center rounded-md"
          aria-label="Início do quiz Nicopel"
        >
          <Logo className="h-7 sm:h-8" priority />
        </Link>

        {compact ? (
          <span className="text-xs font-medium text-nicopel-gray-text">Quiz de Carreiras</span>
        ) : (
          <span className="hidden text-xs font-medium text-nicopel-gray-text sm:block">
            {event.shortLabel}
          </span>
        )}
      </div>
    </header>
  );
}
