import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="border-b border-nicopel-gray bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center rounded-md" aria-label="Início do quiz Nicopel">
          <Logo className="h-7 sm:h-8" />
        </Link>
        {!compact && (
          <span className="hidden text-xs font-medium text-nicopel-gray-text sm:block">
            Quiz de Carreiras
          </span>
        )}
      </div>
    </header>
  );
}
