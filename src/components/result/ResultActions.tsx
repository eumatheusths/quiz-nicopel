'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { isPending, links, resultUi, seo } from '@/content/site-content';
import { track } from '@/lib/analytics';
import { clearResultSnapshot, clearSession } from '@/lib/quiz-session';


/**
 * CTAs finais do resultado.
 *
 * O compartilhamento usa a Web Share API quando existe e cai para cópia de link.
 * O link compartilhado é sempre a URL pública do cargo — sem respostas nem
 * dados pessoais.
 */
export function ResultActions({ roleName }: { roleName: string }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const talentPoolPending = isPending(links.talentPool);

  async function share() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const shareData = {
      title: seo.ogTitle,
      text: `Meu perfil combinou com ${roleName} na Nicopel. Descubra o seu:`,
      url,
    };

    const nav: Navigator | undefined = typeof navigator === 'undefined' ? undefined : navigator;
    if (!nav) return;

    try {
      if (typeof nav.share === 'function') {
        await nav.share(shareData);
        track({ name: 'result_shared', method: 'share' });
        return;
      }
      await nav.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
      track({ name: 'result_shared', method: 'copy' });
    } catch {
      // Cancelar o compartilhamento é uma ação normal — nada a tratar.
    }
  }

  function retake() {
    clearSession();
    clearResultSnapshot();
    router.push('/quiz');
  }

  return (
    <section aria-label="O que fazer agora" className="space-y-4">
      <div className="rounded-[var(--radius-card)] border border-nicopel-gray bg-white p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-lg font-bold text-balance">{resultUi.talentPool.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-nicopel-gray-text">
          {resultUi.talentPool.text}
        </p>

        {talentPoolPending ? (
          // Sem a URL oficial, não inventamos link nem prometemos vaga.
          <p className="mt-4 rounded-xl border-2 border-dashed border-nicopel-gray p-3 text-xs text-nicopel-gray-text">
            O link do banco de talentos será publicado em breve. Fale com a equipe da Nicopel no
            estande para saber como se cadastrar.
          </p>
        ) : (
          <ButtonLink
            href={links.talentPool}
            variant="inverse"
            size="lg"
            className="mt-4 w-full"
            onClick={() => track({ name: 'talent_pool_clicked' })}
          >
            {resultUi.talentPool.cta}
            <Icon name="target" className="h-5 w-5" />
          </ButtonLink>
        )}
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <Button variant="secondary" size="lg" onClick={share}>
          <Icon name="sparkles" className="h-5 w-5" />
          {copied ? resultUi.shareCopied : resultUi.share}
        </Button>
        <Button variant="secondary" size="lg" onClick={retake}>
          {resultUi.retake}
        </Button>
      </div>

      {/* aria-live para confirmar a cópia a quem usa leitor de tela. */}
      <p aria-live="polite" className="sr-only">
        {copied ? resultUi.shareCopied : ''}
      </p>
    </section>
  );
}
