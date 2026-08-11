import type { Metadata } from 'next';
import { SiteFooter } from '@/components/institutional/SiteFooter';
import { SiteHeader } from '@/components/institutional/SiteHeader';
import { Icon } from '@/components/ui/Icon';
import { company, consent, event, isPending, links, privacy } from '@/content/site-content';

export const metadata: Metadata = {
  title: 'Aviso de privacidade',
  description:
    'Como a Nicopel usa os dados informados no sorteio da visita técnica: finalidade, dados coletados, retenção e como pedir a exclusão.',
};

export default function PrivacyPage() {
  const retentionPending = isPending(privacy.retention);
  const policyPending = isPending(links.privacyPolicy);

  return (
    <>
      <SiteHeader compact />

      <main id="conteudo" className="bg-nicopel-gray/25">
        <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
          <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {privacy.title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-nicopel-gray-text">
            Em linguagem simples, sem letras miúdas. Vale para o formulário do sorteio da visita
            técnica realizado na {event.name} ({event.dateLabel}).
          </p>

          <div className="mt-8 space-y-4">
            <Block title="Para que usamos" icon="target">
              <p>{privacy.purpose}</p>
            </Block>

            <Block title="O que guardamos" icon="clipboard">
              <ul className="space-y-1.5">
                {privacy.collected.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-nicopel-gray-mid" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Block>

            <Block title="O que NÃO pedimos" icon="shield">
              <ul className="space-y-1.5">
                {privacy.notCollected.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-nicopel-gray-mid" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-nicopel-gray-text">{privacy.analyticsNote}</p>
            </Block>

            <Block title="Por quanto tempo" icon="calendar">
              {retentionPending ? (
                <p className="rounded-xl border-2 border-dashed border-nicopel-gray p-3">
                  <strong className="font-semibold">Pendente de definição.</strong> O período de
                  retenção será publicado aqui antes do evento. Enquanto isso, qualquer pessoa pode
                  pedir a exclusão imediata dos seus dados pelo e-mail abaixo.
                </p>
              ) : (
                <p>
                  Os dados são excluídos até <strong className="font-semibold">{privacy.retention}</strong>,
                  depois de cumprida a finalidade do sorteio. Você pode pedir a exclusão antes
                  disso, a qualquer momento.
                </p>
              )}
            </Block>

            <Block title="Seus dois consentimentos, separados" icon="check-badge">
              <p className="rounded-xl bg-nicopel-gray/40 p-3 text-xs leading-relaxed">
                <strong className="font-semibold">Cadastro (necessário para fazer o quiz):</strong>{' '}
                {consent.registration}
              </p>
              <p className="mt-2 rounded-xl bg-nicopel-gray/40 p-3 text-xs leading-relaxed">
                <strong className="font-semibold">Sorteio (opcional):</strong> {consent.raffle}
              </p>
              <p className="mt-3">{privacy.optionalNote}</p>
              <p className="mt-2 text-xs text-nicopel-gray-mid">
                Versão do texto de consentimento: {consent.version}
              </p>
            </Block>

            <Block title="Quem é responsável e como falar com a gente" icon="users">
              <p>{privacy.controller}</p>
              <p className="mt-3">
                Dúvidas, revogação do consentimento ou exclusão dos dados:{' '}
                <a
                  href={`mailto:${privacy.channel}`}
                  className="font-semibold text-nicopel-ink underline underline-offset-4"
                >
                  {privacy.channel}
                </a>
              </p>
              <address className="mt-3 text-xs not-italic leading-relaxed text-nicopel-gray-text">
                {company.name}
                <br />
                {company.address.full}
              </address>
              <p className="mt-3">
                {policyPending ? (
                  <span className="text-nicopel-gray-text">
                    A política de privacidade completa da Nicopel será publicada aqui antes do
                    evento.
                  </span>
                ) : (
                  <a
                    href={links.privacyPolicy}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-nicopel-ink underline underline-offset-4"
                  >
                    Ler a política de privacidade completa
                  </a>
                )}
              </p>
            </Block>
          </div>

          {/* Nota operacional para a equipe da Nicopel, não é texto jurídico. */}
          <p className="mt-8 rounded-[var(--radius-card)] border-2 border-dashed border-amber-300 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
            <strong className="font-semibold">Nota interna:</strong> {privacy.legalReviewNote}
          </p>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

function Block({
  title,
  icon,
  children,
}: {
  title: string;
  icon: 'target' | 'clipboard' | 'shield' | 'calendar' | 'check-badge' | 'users';
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-card)] border border-nicopel-gray bg-white p-6 shadow-[var(--shadow-soft)]">
      <h2 className="flex items-center gap-2.5 text-base font-bold">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-nicopel-green-soft text-nicopel-green-deep"
          aria-hidden="true"
        >
          <Icon name={icon} className="h-4.5 w-4.5" />
        </span>
        {title}
      </h2>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-nicopel-ink">{children}</div>
    </section>
  );
}
