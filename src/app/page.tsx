import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { PhotoFrame } from '@/components/ui/PhotoFrame';
import { SiteFooter } from '@/components/institutional/SiteFooter';
import { SiteHeader } from '@/components/institutional/SiteHeader';
import {
  company,
  event,
  history,
  landing,
  numbers,
  sustainability,
  whatWeDo,
} from '@/content/site-content';

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main id="conteudo">
        {/* ---------------------------------------------------------------- Hero */}
        <section className="relative overflow-hidden border-b border-nicopel-gray">
          <div className="bg-paper-grid">
            <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
              <div className="animate-[var(--animate-rise)]">
                <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-nicopel-green-deep/25 bg-nicopel-green-soft px-3.5 py-1.5 text-xs font-semibold text-nicopel-green-deep">
                  <Icon name="sparkles" className="h-4 w-4" />
                  {landing.badge}
                </span>

                <h1 className="mt-5 text-3xl font-bold leading-[1.1] tracking-tight text-balance sm:text-4xl lg:text-5xl">
                  {landing.hero}
                </h1>

                <p className="mt-4 max-w-lg text-base leading-relaxed text-nicopel-gray-text sm:text-lg">
                  {landing.subtitle}
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <ButtonLink href="/quiz" variant="primary" size="lg" className="w-full sm:w-auto">
                    {landing.primaryCta}
                    <Icon name="target" className="h-5 w-5" />
                  </ButtonLink>
                  <ButtonLink
                    href="#a-nicopel"
                    variant="secondary"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    {landing.secondaryCta}
                  </ButtonLink>
                </div>

                <p className="mt-6 flex items-center gap-2 text-xs font-medium text-nicopel-gray-text">
                  <Icon name="calendar" className="h-4 w-4 shrink-0" />
                  {event.shortLabel}
                </p>
              </div>

              <PhotoFrame
                src="/factory/hero.webp"
                alt="Parque fabril da Nicopel em Londrina, com a linha de produção de embalagens de papel em operação."
                placeholderLabel="Substituir por foto real da fábrica"
                priority
                className="aspect-[4/3] w-full shadow-[var(--shadow-lifted)] lg:aspect-[5/4]"
              />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------- Boas-vindas */}
        <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
          <div className="rounded-[var(--radius-card)] border border-nicopel-gray bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
            <p className="text-base leading-relaxed text-nicopel-ink sm:text-lg">
              {landing.welcome}
            </p>
            <div className="cut-line my-6" />
            <ul className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: 'clipboard', title: '10 perguntas', text: 'Sem cronômetro e sem resposta certa.' },
                { icon: 'factory', title: '16 caminhos', text: 'Todos são áreas que existem de verdade aqui.' },
                { icon: 'heart', title: 'Uma descoberta', text: 'Não é teste, prova nem avaliação.' },
              ].map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nicopel-green-soft text-nicopel-green-deep">
                    <Icon name={item.icon as 'clipboard'} className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{item.title}</span>
                    <span className="block text-sm leading-relaxed text-nicopel-gray-text">
                      {item.text}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* --------------------------------------------------------- A Nicopel */}
        <section id="a-nicopel" className="scroll-mt-4 border-y border-nicopel-gray bg-nicopel-gray/30">
          <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
              Uma indústria que começou em 30 m²
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-nicopel-gray-text sm:text-base">
              {history.intro}
            </p>

            <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {history.timeline.map((milestone) => (
                <li
                  key={milestone.year}
                  className="rounded-xl border border-nicopel-gray bg-white p-4 shadow-[var(--shadow-soft)]"
                >
                  <span className="block text-lg font-bold text-nicopel-green-deep">
                    {milestone.year}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-nicopel-gray-text">
                    {milestone.text}
                  </span>
                </li>
              ))}
            </ol>

            <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
              {numbers.map((item) => (
                <div
                  key={item.label}
                  // `order` inverte só a apresentação: no DOM o termo vem antes
                  // da definição, que é o que o leitor de tela espera.
                  className="flex flex-col rounded-xl border border-nicopel-gray bg-white p-4"
                >
                  <dt className="order-2 mt-1 text-xs leading-snug text-nicopel-gray-text">
                    {item.label}
                  </dt>
                  <dd className="order-1 text-xl font-bold leading-tight sm:text-2xl">
                    {item.value}
                    {item.unit && (
                      <span className="ml-1 text-sm font-semibold text-nicopel-green-deep">
                        {item.unit}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ------------------------------------------------- O que a Nicopel faz */}
        <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
                O que a gente faz todos os dias
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-nicopel-gray-text sm:text-base">
                {whatWeDo.text}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {whatWeDo.products.map((product) => (
                  <li
                    key={product}
                    className="rounded-[var(--radius-pill)] border border-nicopel-gray bg-white px-3.5 py-1.5 text-xs font-medium text-nicopel-ink"
                  >
                    {product}
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-[var(--radius-card)] border border-nicopel-green-deep/20 bg-nicopel-green-soft p-5">
                <p className="flex items-start gap-2.5 text-sm leading-relaxed text-nicopel-ink">
                  <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0 text-nicopel-green-deep" />
                  <span>{sustainability}</span>
                </p>
              </div>
            </div>

            <PhotoFrame
              src="/factory/producao.webp"
              alt="Colaboradores da Nicopel acompanhando a produção de embalagens de papel."
              placeholderLabel="Substituir por foto real da produção"
              className="aspect-[4/3] w-full shadow-[var(--shadow-soft)]"
            />
          </div>
        </section>

        {/* ------------------------------------------------------------ CTA final */}
        <section className="mx-auto w-full max-w-5xl px-4 pb-14 sm:px-6">
          <div className="rounded-[var(--radius-card)] border border-nicopel-gray bg-white p-7 text-center shadow-[var(--shadow-soft)] sm:p-10">
            <h2 className="text-xl font-bold text-balance sm:text-2xl">
              Pronto para descobrir o seu caminho?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-nicopel-gray-text">
              São 10 perguntas rápidas. No fim, você conhece uma área que existe de verdade dentro
              da Nicopel.
            </p>
            <ButtonLink href="/quiz" variant="primary" size="lg" className="mt-6 w-full sm:w-auto">
              {landing.primaryCta}
            </ButtonLink>
            <p className="mt-5 text-xs text-nicopel-gray-text">
              Quer saber mais sobre a empresa?{' '}
              <a
                href={company.site}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-nicopel-ink underline underline-offset-4"
              >
                nicopel.com.br
              </a>{' '}
              •{' '}
              <Link
                href="/privacidade"
                className="font-medium text-nicopel-ink underline underline-offset-4"
              >
                Aviso de privacidade
              </Link>
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
