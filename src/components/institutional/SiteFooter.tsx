import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { company, footer } from '@/content/site-content';

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-nicopel-black text-white">
      <div className="bg-paper-grid-dark">
        <div className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div>
              <Logo variant="light" className="h-8" />
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">{footer.text}</p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-nicopel-green">
                  Onde estamos
                </h2>
                <address className="mt-2.5 text-sm not-italic leading-relaxed text-white/70">
                  {company.address.line1}
                  <br />
                  {company.address.line2}
                </address>
                <a
                  href={company.address.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm text-white/80 underline-offset-4 hover:text-nicopel-green hover:underline"
                >
                  Abrir no mapa
                </a>
              </div>

              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-nicopel-green">
                  Grupo Nicopel
                </h2>
                <ul className="mt-2.5 space-y-1 text-sm text-white/70">
                  {company.group.map((brand) => (
                    <li key={brand}>{brand}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
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
            <p className="text-xs text-white/50">© {new Date().getFullYear()} Nicopel Embalagens</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
