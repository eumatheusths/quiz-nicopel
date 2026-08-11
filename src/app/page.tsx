import Link from 'next/link';
import { FactoryVideo } from '@/components/institutional/FactoryVideo';
import { SiteFooter } from '@/components/institutional/SiteFooter';
import { SiteHeader } from '@/components/institutional/SiteHeader';
import { ButtonLink } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { PhotoFrame } from '@/components/ui/PhotoFrame';
import { Eyebrow, Section, SectionHeading } from '@/components/ui/Section';
import {
  company,
  culture,
  event,
  history,
  landing,
  numbers,
  sustainability,
  whatWeDo,
} from '@/content/site-content';
import type { IconName } from '@/content/types';

const HIGHLIGHTS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'clipboard', title: '10 perguntas', text: 'Sem cronômetro e sem resposta certa.' },
  { icon: 'factory', title: '16 caminhos', text: 'Todos são áreas que existem de verdade aqui.' },
  { icon: 'heart', title: 'Uma descoberta', text: 'Não é teste, prova nem avaliação.' },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main id="conteudo">
        {/* ---------------------------------------------------------------- Hero */}
        <section className="relative overflow-hidden border-b border-nicopel-gray bg-white">
          <div className="bg-paper-grid">
            <div className="mx-auto grid w-full max-w-5xl items-center gap-10 px-5 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-14">
              <div className="animate-[var(--animate-rise)]">
                <Eyebrow>
                  <Icon name="sparkles" className="h-4 w-4" />
                  {landing.badge}
                </Eyebrow>

                <h1 className="mt-5 text-[2rem] font-bold leading-[1.08] tracking-tight text-balance sm:text-5xl">
                  {landing.hero.split(/(quiz)/i).map((part, i) => 
                    part.toLowerCase() === 'quiz' 
                      ? <span key={i} className="text-nicopel-green-deep underline decoration-4 decoration-nicopel-green-soft underline-offset-4">{part}</span> 
                      : part
                  )}
                </h1>

                <p className="mt-5 max-w-md text-base leading-relaxed text-nicopel-gray-text sm:text-lg">
                  {landing.subtitle}
                </p>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <ButtonLink 
                    href="/quiz" 
                    variant="inverse" 
                    size="lg" 
                    className="w-full sm:w-auto shadow-xl shadow-nicopel-green/30 ring-4 ring-nicopel-green-soft hover:ring-nicopel-green scale-105 transform transition-all duration-300"
                  >
                    {landing.primaryCta}
                    <Icon name="target" className="h-5 w-5 animate-pulse" />
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

                <p className="mt-7 flex items-center gap-2 border-t border-nicopel-gray pt-5 text-xs font-medium text-nicopel-gray-text">
                  <Icon name="calendar" className="h-4 w-4 shrink-0" />
                  {event.shortLabel}
                </p>
              </div>

              <PhotoFrame
                src="/factory/fachada.webp"
                avifSrc="/factory/fachada.avif"
                alt="Vista aérea do parque fabril da Nicopel Embalagens em Londrina, com a fachada preta e o nome Grupo Nicopel na lateral do galpão."
                width={1600}
                height={900}
                priority
                className="aspect-[4/3] w-full shadow-[var(--shadow-lifted)]"
              />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------- Boas-vindas */}
        <Section spacing="tight">
          <div className="rounded-[var(--radius-card)] border border-nicopel-gray bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
            <p className="max-w-3xl text-base leading-relaxed text-nicopel-ink sm:text-lg">
              {landing.welcome}
            </p>

            <div className="cut-line my-7" />

            <ul className="grid gap-6 sm:grid-cols-3">
              {HIGHLIGHTS.map((item) => (
                <li key={item.title} className="flex gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-nicopel-green-soft text-nicopel-green-deep">
                    <Icon name={item.icon} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight">{item.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-nicopel-gray-text">
                      {item.text}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* --------------------------------------------------------- A Nicopel */}
        <Section id="a-nicopel" tone="muted" labelledBy="a-nicopel-titulo">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <figure className="order-2 lg:order-1">
              <PhotoFrame
                src="/factory/historia-2000.webp"
                avifSrc="/factory/historia-2000.avif"
                alt="Foto de 2000: um dos fundadores da Nicopel imprimindo caixas em serigrafia sobre uma mesa de madeira, ao lado de pilhas de papelão."
                width={900}
                height={1200}
                className="aspect-[3/4] w-full shadow-[var(--shadow-soft)]"
              />
              <figcaption className="mt-3 text-xs leading-relaxed text-nicopel-gray-text">
                <span className="font-semibold text-nicopel-ink">2000.</span> Serigrafia manual,
                caixa por caixa, nos primeiros 30 m².
              </figcaption>
            </figure>

            <SectionHeading
              id="a-nicopel-titulo"
              title="Uma indústria que começou em 30 m²"
              description={history.intro}
              className="order-1 lg:order-2"
            />
          </div>

          {/* Linha do tempo */}
          <ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {history.timeline.map((milestone) => (
              <li
                key={milestone.year}
                className="flex flex-col rounded-xl border border-nicopel-gray bg-white p-4 shadow-[var(--shadow-soft)]"
              >
                <span className="text-lg font-bold leading-none text-nicopel-green-deep">
                  {milestone.year}
                </span>
                <span className="mt-2 text-xs leading-relaxed text-nicopel-gray-text">
                  {milestone.text}
                </span>
              </li>
            ))}
          </ol>

          {/* Números */}
          <dl className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
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
                <dd className="order-1 text-xl font-bold leading-none sm:text-2xl">
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
        </Section>

        {/* ------------------------------------------------- O que a Nicopel faz */}
        <Section labelledBy="o-que-fazemos-titulo">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <SectionHeading
                id="o-que-fazemos-titulo"
                title="O que a gente faz todos os dias"
                description={whatWeDo.text}
              />

              <ul className="mt-6 flex flex-wrap gap-2">
                {whatWeDo.products.map((product) => (
                  <li
                    key={product}
                    className="rounded-[var(--radius-pill)] border border-nicopel-gray bg-white px-3.5 py-1.5 text-xs font-medium text-nicopel-ink"
                  >
                    {product}
                  </li>
                ))}
              </ul>

              <div className="mt-7 rounded-[var(--radius-card)] border border-nicopel-green-deep/20 bg-nicopel-green-soft p-5">
                <p className="flex items-start gap-3 text-sm leading-relaxed text-nicopel-ink">
                  <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0 text-nicopel-green-deep" />
                  <span>{sustainability}</span>
                </p>
              </div>
            </div>

            <PhotoFrame
              src="/factory/produtos.webp"
              avifSrc="/factory/produtos.avif"
              alt="Linha de embalagens produzidas pela Nicopel: caixas de sorvete, copos de papel, potes de açaí, caixas de café e embalagens industriais personalizadas."
              width={1600}
              height={900}
              className="aspect-[4/3] w-full bg-white shadow-[var(--shadow-soft)]"
            />
          </div>
        </Section>

        {/* -------------------------------------------------- Vídeo da indústria */}
        <div className="border-y border-nicopel-gray bg-nicopel-gray/30">
          <FactoryVideo />
        </div>

        {/* ------------------------------------------------------------- Equipe */}
        <Section labelledBy="equipe-titulo">
          <SectionHeading
            id="equipe-titulo"
            title="Mais de 160 pessoas fazem isso acontecer"
            description={culture}
          />

          <PhotoFrame
            src="/factory/equipe.webp"
            avifSrc="/factory/equipe.avif"
            alt="Equipe da Nicopel Embalagens reunida no galpão de matéria-prima, entre bobinas de papel e pallets."
            width={1600}
            height={1200}
            objectPosition="center 32%"
            className="mt-8 aspect-[16/9] w-full shadow-[var(--shadow-soft)] sm:aspect-[21/9]"
          />
        </Section>

        {/* ------------------------------------------------------------ CTA final */}
        <Section tone="muted" spacing="loose">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
              Pronto para descobrir o seu caminho?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-nicopel-gray-text sm:text-base">
              São 10 perguntas rápidas. No fim, você conhece uma área que existe de verdade dentro
              da Nicopel.
            </p>

            <ButtonLink href="/quiz" variant="primary" size="lg" className="mt-7 w-full sm:w-auto">
              {landing.primaryCta}
              <Icon name="target" className="h-5 w-5" />
            </ButtonLink>

            <p className="mt-7 border-t border-nicopel-gray pt-5 text-xs text-nicopel-gray-text">
              Quer saber mais sobre a empresa?{' '}
              <a
                href={company.site}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-nicopel-ink underline underline-offset-4"
              >
                nicopel.com.br
              </a>{' '}
              ·{' '}
              <Link
                href="/privacidade"
                className="font-semibold text-nicopel-ink underline underline-offset-4"
              >
                Aviso de privacidade
              </Link>
            </p>
          </div>
        </Section>
      </main>

      <SiteFooter />
    </>
  );
}
