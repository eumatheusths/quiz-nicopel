import type { Metadata } from 'next';
import { SiteFooter } from '@/components/institutional/SiteFooter';
import { SiteHeader } from '@/components/institutional/SiteHeader';
import { Eyebrow, SectionHeading } from '@/components/ui/Section';
import { Icon } from '@/components/ui/Icon';
import { results } from '@/content/results';
import { ROLE_IDS, type RoleId } from '@/content/types';
import { ResumeForm } from './ResumeForm';

/**
 * Banco de talentos.
 *
 * É o destino do CTA final do quiz. Componente de servidor para ler o cargo
 * vindo da URL sem precisar de `useSearchParams` (que exigiria um limite de
 * Suspense); o formulário em si é cliente.
 */

export const metadata: Metadata = {
  title: 'Banco de talentos',
  description:
    'Envie seu currículo para o banco de talentos da Nicopel Embalagens e fique de olho nas próximas oportunidades.',
  robots: { index: false, follow: true },
};

/**
 * Cada cargo do quiz cai em uma das áreas de triagem do RH, que são mais
 * amplas. Serve só para pré-marcar a opção — a pessoa pode trocar à vontade.
 */
const AREA_BY_ROLE: Record<RoleId, string> = {
  comercial: 'Comercial/Vendas',
  compras: 'Administrativo',
  financeiro: 'Administrativo',
  logistica: 'Logística',
  marketing: 'Comercial/Vendas',
  design: 'Administrativo',
  ti: 'Administrativo',
  rh: 'Administrativo',
  administrativo: 'Administrativo',
  endomarketing: 'Administrativo',
  sst: 'Produção',
  pcp: 'Produção',
  'engenharia-produto': 'Produção',
  qualidade: 'Produção',
  producao: 'Produção',
  'operador-maquinas': 'Manutenção',
};

export default async function CurriculoPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string }>;
}) {
  const { de } = await searchParams;
  const role = de && ROLE_IDS.includes(de as RoleId) ? (de as RoleId) : null;

  return (
    <>
      <SiteHeader compact />

      <main id="conteudo" className="bg-nicopel-gray/25">
        <div className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-6 sm:py-14">
          <Eyebrow>
            <Icon name="target" className="h-4 w-4" />
            Banco de talentos
          </Eyebrow>

          <SectionHeading
            title="Deixe seu currículo com a gente"
            description="Preenchendo leva um minuto. Guardamos seu contato para chamar quando abrir uma oportunidade que combine com o seu perfil."
            className="mt-4 mb-8"
          />

          <ResumeForm
            quizResultName={role ? results[role].name : null}
            quizResultId={role}
            suggestedArea={role ? AREA_BY_ROLE[role] : null}
          />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
