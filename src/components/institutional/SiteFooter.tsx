import Link from 'next/link';
import { company, footer } from '@/content/site-content';
import { Logo } from '@/components/ui/Logo';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-nicopel-black text-white">
      <div className="bg-paper-grid-dark">
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
          <Logo variant="light" className="h-8" />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">{footer.text}</p>

          <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="font-semibold text-white">Onde estamos</p>
              <address className="mt-1 not-italic text-white/70">
                {company.address.line1}
                <br />
                {company.address.line2}
              </address>
            </div>
            <div className="sm:text-right">
              <p className="font-semibold text-white">Grupo Nicopel</p>
              <p className="mt-1 text-white/70">{company.group.join(' • ')}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <a
                href={company.site}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 underline-offset-4 hover:text-nicopel-green hover:underline"
              >
                nicopel.com.br
              </a>
              <Link
                href="/privacidade"
                className="text-white/80 underline-offset-4 hover:text-nicopel-green hover:underline"
              >
                Aviso de privacidade
              </Link>
              <a
                href={`mailto:${company.contactEmail}`}
                className="text-white/80 underline-offset-4 hover:text-nicopel-green hover:underline"
              >
                {company.contactEmail}
              </a>
            </div>
            <p className="text-xs text-white/50">
              © {new Date().getFullYear()} Nicopel Embalagens
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
