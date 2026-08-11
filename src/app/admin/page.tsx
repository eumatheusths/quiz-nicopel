import { and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import type { Metadata } from 'next';
import { groups } from '@/content/quiz';
import { results } from '@/content/results';
import { event } from '@/content/site-content';
import { GROUP_IDS, type GroupId, type RoleId } from '@/content/types';
import { isAdminConfigured, isAuthenticated } from '@/lib/admin-auth';
import { getDb, isDatabaseConfigured } from '@/lib/db';
import { participants } from '@/lib/schema';
import { formatPhone } from '@/lib/validation';
import { DeleteEntryButton } from './DeleteEntryButton';
import { LoginForm } from './LoginForm';
import { logout } from './actions';

/**
 * Painel administrativo.
 *
 * Protegido no servidor, `noindex` e sem nenhum segredo enviado ao cliente.
 * Mostra todo mundo que fez o cadastro e destaca quem marcou a participação no
 * sorteio. As exportações (planilha e PDF) são a fonte oficial do sorteio.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Painel',
  robots: { index: false, follow: false, nocache: true },
};

const PAGE_SIZE = 200;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtro?: string }>;
}) {
  if (!(await isAuthenticated())) {
    return (
      <Shell>
        <div className="mx-auto w-full max-w-sm">
          <h1 className="text-2xl font-bold">Painel do quiz</h1>
          <p className="mt-2 mb-6 text-sm text-nicopel-gray-text">
            Acesso restrito à equipe da Nicopel.
          </p>
          {isAdminConfigured() ? (
            <LoginForm />
          ) : (
            <p className="rounded-xl border-2 border-dashed border-nicopel-gray p-4 text-sm text-nicopel-gray-text">
              Painel não configurado. Defina <code className="font-mono">ADMIN_PASSWORD_HASH</code>{' '}
              e <code className="font-mono">ADMIN_SESSION_SECRET</code> no ambiente e recarregue.
            </p>
          )}
        </div>
      </Shell>
    );
  }

  if (!isDatabaseConfigured()) {
    return (
      <Shell>
        <Header />
        <p className="mt-6 rounded-xl border-2 border-dashed border-nicopel-gray p-4 text-sm text-nicopel-gray-text">
          Banco de dados não configurado. Defina <code className="font-mono">DATABASE_URL</code>{' '}
          para ver os participantes.
        </p>
      </Shell>
    );
  }

  const db = getDb();
  if (!db) return null;

  const { q, filtro } = await searchParams;
  const query = q?.trim() ?? '';
  const onlyRaffle = filtro === 'sorteio';

  const activeFilter = and(eq(participants.eventCode, event.code), isNull(participants.deletedAt));

  const conditions = [activeFilter];
  if (onlyRaffle) conditions.push(eq(participants.raffleConsent, true));
  if (query.length > 0) {
    conditions.push(
      or(
        ilike(participants.fullName, `%${query}%`),
        ilike(participants.email, `%${query}%`),
        ilike(participants.phone, `%${query}%`),
      ),
    );
  }

  const [totals, byRole, rows] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        raffle: sql<number>`count(*) filter (where ${participants.raffleConsent})::int`,
        completed: sql<number>`count(*) filter (where ${participants.completedAt} is not null)::int`,
        avgAge: sql<number>`coalesce(round(avg(${participants.age}))::int, 0)`,
      })
      .from(participants)
      .where(activeFilter),
    db
      .select({
        group: participants.resultGroup,
        role: participants.resultRole,
        count: sql<number>`count(*)::int`,
      })
      .from(participants)
      .where(and(activeFilter, sql`${participants.resultRole} is not null`))
      .groupBy(participants.resultGroup, participants.resultRole),
    db
      .select()
      .from(participants)
      .where(and(...conditions))
      .orderBy(desc(participants.createdAt))
      .limit(PAGE_SIZE),
  ]);

  const summary = totals[0] ?? { total: 0, raffle: 0, completed: 0, avgAge: 0 };
  const exportSuffix = onlyRaffle ? '?sorteio=1' : '';

  const groupTotals = new Map<string, number>();
  for (const row of byRole) {
    if (row.group) groupTotals.set(row.group, (groupTotals.get(row.group) ?? 0) + row.count);
  }

  return (
    <Shell>
      <Header />

      {/* ------------------------------------------------------------ Totais */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Fizeram o cadastro" value={summary.total} />
        <Stat label="Querem o sorteio" value={summary.raffle} highlight />
        <Stat label="Concluíram o quiz" value={summary.completed} />
        <Stat label="Idade média" value={summary.avgAge} suffix="anos" />
      </div>

      {/* ------------------------------------------------------- Exportações */}
      <section className="mt-6 rounded-xl border border-nicopel-gray bg-white p-4">
        <h2 className="text-sm font-bold">
          Exportar {onlyRaffle ? 'somente quem quer o sorteio' : 'todos os participantes'}
        </h2>
        <p className="mt-1 text-xs text-nicopel-gray-text">
          A planilha abre direto no Excel (UTF-8, separador <code className="font-mono">;</code>).
          Use o filtro acima da tabela para alternar entre a lista completa e a do sorteio.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={`/api/admin/export${exportSuffix}`}
            download
            className="inline-flex items-center justify-center rounded-xl bg-nicopel-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-nicopel-ink"
          >
            Baixar planilha (CSV)
          </a>
          <a
            href={`/api/admin/export/pdf${exportSuffix}`}
            download
            className="inline-flex items-center justify-center rounded-xl border-2 border-nicopel-black px-4 py-2.5 text-sm font-semibold text-nicopel-ink hover:bg-nicopel-gray/40"
          >
            Baixar relatório (PDF)
          </a>
        </div>
      </section>

      {/* -------------------------------------------------------- Distribuição */}
      {byRole.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-nicopel-gray-text">
            Distribuição por área
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {GROUP_IDS.map((groupId) => {
              const groupRoles = byRole.filter((row) => row.group === groupId);
              const total = groupTotals.get(groupId) ?? 0;
              return (
                <div
                  key={groupId}
                  className="rounded-xl border border-nicopel-gray bg-white p-4 text-sm"
                >
                  <p className="flex items-baseline justify-between gap-2 font-semibold">
                    <span>{groups[groupId as GroupId].name}</span>
                    <span className="text-lg font-bold">{total}</span>
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-nicopel-gray-text">
                    {groups[groupId as GroupId].roles.map((roleId) => {
                      const count = groupRoles.find((row) => row.role === roleId)?.count ?? 0;
                      return (
                        <li key={roleId} className="flex justify-between gap-2">
                          <span className="truncate">{results[roleId as RoleId].name}</span>
                          <span className="shrink-0 font-medium tabular-nums">{count}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------- Busca/lista */}
      <section className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <form method="get" className="flex w-full max-w-sm items-end gap-2">
            {onlyRaffle && <input type="hidden" name="filtro" value="sorteio" />}
            <div className="flex-1">
              <label htmlFor="q" className="block text-xs font-semibold text-nicopel-gray-text">
                Buscar por nome, e-mail ou WhatsApp
              </label>
              <input
                id="q"
                name="q"
                type="search"
                defaultValue={query}
                className="mt-1 w-full rounded-xl border-2 border-nicopel-gray px-3 py-2.5 text-sm focus:border-nicopel-black focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-nicopel-black px-4 py-2.5 text-sm font-semibold text-white"
            >
              Buscar
            </button>
          </form>

          {/* Alterna entre a lista completa e a do sorteio. */}
          <div
            className="inline-flex rounded-xl border-2 border-nicopel-gray p-1"
            role="group"
            aria-label="Filtrar lista"
          >
            <FilterLink active={!onlyRaffle} href={query ? `/admin?q=${encodeURIComponent(query)}` : '/admin'}>
              Todos ({summary.total})
            </FilterLink>
            <FilterLink
              active={onlyRaffle}
              href={`/admin?filtro=sorteio${query ? `&q=${encodeURIComponent(query)}` : ''}`}
            >
              Sorteio ({summary.raffle})
            </FilterLink>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-nicopel-gray bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <caption className="sr-only">
              {onlyRaffle
                ? 'Participantes que aceitaram concorrer ao sorteio da visita técnica'
                : 'Todos os participantes cadastrados no quiz'}
            </caption>
            <thead className="border-b border-nicopel-gray bg-nicopel-gray/40 text-xs uppercase tracking-wide text-nicopel-gray-text">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Nome</th>
                <th scope="col" className="px-4 py-3 font-semibold">WhatsApp</th>
                <th scope="col" className="px-4 py-3 font-semibold">E-mail</th>
                <th scope="col" className="px-4 py-3 font-semibold">Idade</th>
                <th scope="col" className="px-4 py-3 font-semibold">Sorteio</th>
                <th scope="col" className="px-4 py-3 font-semibold">Resultado</th>
                <th scope="col" className="px-4 py-3 font-semibold">Cadastro</th>
                <th scope="col" className="px-4 py-3 font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-nicopel-gray-text">
                    {query
                      ? 'Nenhum participante encontrado para essa busca.'
                      : 'Nenhum participante ainda.'}
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-nicopel-gray/60 last:border-0">
                  <td className="px-4 py-3 font-medium">{row.fullName}</td>
                  <td className="px-4 py-3 text-nicopel-gray-text tabular-nums">
                    {formatPhone(row.phone)}
                  </td>
                  <td className="px-4 py-3 text-nicopel-gray-text">{row.email}</td>
                  <td className="px-4 py-3 tabular-nums">{row.age}</td>
                  <td className="px-4 py-3">
                    {row.raffleConsent ? (
                      <span className="rounded-full bg-nicopel-green-soft px-2 py-0.5 text-xs font-bold text-nicopel-green-deep">
                        SIM
                      </span>
                    ) : (
                      <span className="text-xs text-nicopel-gray-mid">não</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.resultRole ? (
                      <>
                        {results[row.resultRole as RoleId]?.name ?? row.resultRole}
                        <span className="block text-xs text-nicopel-gray-mid">
                          Grupo {row.resultGroup}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-nicopel-gray-mid">não concluiu</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-nicopel-gray-text tabular-nums">
                    {formatDateTime(row.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <DeleteEntryButton id={row.id} name={row.fullName} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {summary.total > PAGE_SIZE && (
          <p className="mt-3 text-xs text-nicopel-gray-text">
            Mostrando os {PAGE_SIZE} cadastros mais recentes. Use a busca ou exporte a planilha para
            ver todos.
          </p>
        )}
      </section>

      <p className="mt-8 rounded-xl border-2 border-dashed border-nicopel-gray p-4 text-xs leading-relaxed text-nicopel-gray-text">
        O sorteio é feito fora do sistema, a partir da lista exportada, seguindo as regras oficiais
        aprovadas pela Nicopel. Exclua os dados após cumprida a finalidade — o procedimento está no
        README.
      </p>
    </Shell>
  );
}

function FilterLink({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-current={active ? 'true' : undefined}
      className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
        active ? 'bg-nicopel-black text-white' : 'text-nicopel-gray-text hover:bg-nicopel-gray/40'
      }`}
    >
      {children}
    </a>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main id="conteudo" className="min-h-dvh bg-nicopel-gray/25">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">{children}</div>
    </main>
  );
}

function Header({ activeTab = 'quiz' }: { activeTab?: 'quiz' | 'curriculos' }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel Administrativo</h1>
        <div className="mt-4 flex gap-4 border-b border-nicopel-gray pb-2">
          <a
            href="/admin"
            className={`text-sm font-semibold ${activeTab === 'quiz' ? 'text-nicopel-black border-b-2 border-nicopel-black pb-2 -mb-[9px]' : 'text-nicopel-gray-text hover:text-nicopel-black'}`}
          >
            Participantes Quiz
          </a>
          <a
            href="/admin/curriculos"
            className={`text-sm font-semibold ${activeTab === 'curriculos' ? 'text-nicopel-black border-b-2 border-nicopel-black pb-2 -mb-[9px]' : 'text-nicopel-gray-text hover:text-nicopel-black'}`}
          >
            Currículos Recebidos
          </a>
        </div>
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="rounded-xl border-2 border-nicopel-gray px-4 py-2 text-sm font-semibold hover:border-nicopel-black"
        >
          Sair
        </button>
      </form>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  highlight = false,
}: {
  label: string;
  value: number;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight ? 'border-nicopel-green-deep/30 bg-nicopel-green-soft' : 'border-nicopel-gray bg-white'
      }`}
    >
      <p className="text-2xl font-bold tabular-nums">
        {value}
        {suffix && <span className="ml-1 text-xs font-medium text-nicopel-gray-mid">{suffix}</span>}
      </p>
      <p className="mt-0.5 text-xs leading-snug text-nicopel-gray-text">{label}</p>
    </div>
  );
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(value);
}
