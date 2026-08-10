import { ButtonLink } from '@/components/ui/Button';
import { SiteFooter } from '@/components/institutional/SiteFooter';
import { SiteHeader } from '@/components/institutional/SiteHeader';

export default function NotFound() {
  return (
    <>
      <SiteHeader compact />
      <main id="conteudo" className="flex min-h-[60vh] items-center bg-nicopel-gray/25">
        <div className="mx-auto w-full max-w-md px-4 py-16 text-center sm:px-6">
          <p className="text-xs font-bold uppercase tracking-wide text-nicopel-green-deep">
            Página não encontrada
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-balance sm:text-3xl">
            Essa dobra não existe por aqui
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-nicopel-gray-text">
            O link pode estar desatualizado. Que tal descobrir qual área da Nicopel combina com
            você?
          </p>
          <ButtonLink href="/" variant="primary" size="lg" className="mt-6">
            Voltar para o início
          </ButtonLink>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
