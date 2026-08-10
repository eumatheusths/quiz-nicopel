import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CollaboratorCard } from '@/components/result/CollaboratorCard';
import { ResultActions } from '@/components/result/ResultActions';
import { SecondaryArea } from '@/components/result/SecondaryArea';
import { CompanyStory } from '@/components/institutional/CompanyStory';
import { SiteFooter } from '@/components/institutional/SiteFooter';
import { SiteHeader } from '@/components/institutional/SiteHeader';
import { Icon } from '@/components/ui/Icon';
import { groups } from '@/content/quiz';
import { results } from '@/content/results';
import { resultUi, seo } from '@/content/site-content';
import { ROLE_IDS, type RoleId } from '@/content/types';

/**
 * Página de resultado.
 *
 * É uma rota estática por cargo: carrega instantaneamente, funciona sem o
 * banco e pode ser compartilhada. A URL contém só o cargo — nunca respostas
 * nem dados pessoais.
 */

export function generateStaticParams() {
  return ROLE_IDS.map((role) => ({ role }));
}

function getResult(role: string) {
  return ROLE_IDS.includes(role as RoleId) ? results[role as RoleId] : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ role: string }>;
}): Promise<Metadata> {
  const { role } = await params;
  const result = getResult(role);
  if (!result) return { title: 'Resultado não encontrado' };

  return {
    title: `${result.name} — ${result.headline}`,
    description: result.summary,
    // Open Graph genérico da campanha: o card compartilhado não expõe o perfil.
    openGraph: { title: seo.ogTitle, description: seo.ogDescription },
    robots: { index: false, follow: true },
  };
}

export default async function ResultPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  const result = getResult(role);
  if (!result) notFound();

  const group = groups[result.group];

  return (
    <>
      <SiteHeader compact />

      <main id="conteudo" className="bg-nicopel-gray/25 pb-4">
        <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6 sm:px-6 sm:py-10">
          {/* ------------------------------------------------ Card principal */}
          <section
            aria-labelledby="resultado-titulo"
            className="overflow-hidden rounded-[var(--radius-card)] border border-nicopel-gray bg-white shadow-[var(--shadow-lifted)] animate-[var(--animate-fold-in)]"
          >
            <div className="relative bg-nicopel-black px-6 py-7 text-white sm:px-8">
              <div className="bg-paper-grid-dark absolute inset-0" aria-hidden="true" />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-wide text-nicopel-green">
                  {resultUi.eyebrow}
                </p>
                <h1
                  id="resultado-titulo"
                  className="mt-2 text-3xl font-bold leading-[1.1] tracking-tight text-balance sm:text-4xl"
                >
                  {result.name}
                </h1>
                <p className="mt-3 flex items-start gap-2.5 text-base font-medium text-white/85 sm:text-lg">
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-nicopel-green"
                    aria-hidden="true"
                  >
                    <Icon name={result.icon} className="h-5 w-5" />
                  </span>
                  <span className="text-balance">{result.headline}</span>
                </p>
                <p className="mt-4 text-xs text-white/50">{group.name}</p>
              </div>
            </div>

            <div className="px-6 py-6 sm:px-8">
              <p className="text-base leading-relaxed text-nicopel-ink">{result.summary}</p>

              <h2 className="mt-6 text-xs font-bold uppercase tracking-wide text-nicopel-gray-text">
                {resultUi.skillsTitle}
              </h2>
              <ul className="mt-2.5 flex flex-wrap gap-2">
                {result.skills.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-[var(--radius-pill)] border border-nicopel-gray bg-nicopel-gray/40 px-3.5 py-1.5 text-xs font-medium text-nicopel-ink"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ----------------------------------------------------- Na prática */}
          <section
            aria-labelledby="na-pratica-titulo"
            className="rounded-[var(--radius-card)] border border-nicopel-gray bg-white p-6 shadow-[var(--shadow-soft)]"
          >
            <h2 id="na-pratica-titulo" className="text-base font-bold">
              {resultUi.inPracticeTitle}
            </h2>
            <ul className="mt-3 space-y-2.5">
              {result.inPractice.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed">
                  <Icon
                    name="check-badge"
                    className="mt-0.5 h-4 w-4 shrink-0 text-nicopel-green-deep"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="cut-line my-5" />

            <h3 className="text-xs font-bold uppercase tracking-wide text-nicopel-gray-text">
              {resultUi.educationTitle}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-nicopel-gray-text">
              {result.education.join(' • ')}
            </p>
          </section>

          {/* --------------------------------------------------- Colaborador */}
          <CollaboratorCard collaboratorId={result.collaboratorId} />

          {/* ---------------------------------------------- Área secundária */}
          <SecondaryArea role={result.id} />

          {/* ----------------------------------------------------- Aviso */}
          <p className="rounded-[var(--radius-card)] border border-nicopel-gray bg-white/70 p-4 text-xs leading-relaxed text-nicopel-gray-text">
            {resultUi.disclaimer}
          </p>

          {/* ------------------------------------------------------- CTAs */}
          <ResultActions roleName={result.name} />

          {/* --------------------------------------- História e números */}
          <CompanyStory />

          <p className="pt-2 text-center text-xs text-nicopel-gray-text">
            <Link href="/privacidade" className="underline underline-offset-4 hover:text-nicopel-ink">
              Aviso de privacidade
            </Link>
          </p>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
