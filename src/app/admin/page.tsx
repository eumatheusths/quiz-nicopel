import { and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import type { Metadata } from 'next';
import { groups } from '@/content/quiz';
import { results } from '@/content/results';
import { event } from '@/content/site-content';
import { GROUP_IDS, type GroupId, type RoleId } from '@/content/types';
import { isAdminConfigured, isAuthenticated } from '@/lib/admin-auth';
import { getDb, isDatabaseConfigured } from '@/lib/db';
import { raffleEntries } from '@/lib/schema';
import { DeleteEntryButton } from './DeleteEntryButton';
import { LoginForm } from './LoginForm';
import { logout } from './actions';

/**
 * Painel administrativo mínimo.
 *
 * Protegido no servidor, `noindex` e sem nenhum segredo enviado ao cliente.
 * O CSV exportado aqui é a fonte oficial para o sorteio — não existe sorteio
 * automatizado no sistema enquanto as regras oficiais não forem definidas.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Painel',
  robots: { index: false, follow: false, nocache: true },
};

const PAGE_SIZE = 100;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!(await isAuthenticated())) {
    return (
      <Shell>
        <div className="mx-auto w-full max-w-sm">
          <h1 className="text-2xl font-bold">Painel do sorteio</h1>
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
          para ver as inscrições.
        </p>
      </Shell>
    );
  }

  const db = getDb();
  if (!db) return null;

  const { q } = await searchParams;
  const query = q?.trim() ?? '';

  const activeFilter = and(eq(raffleEntries.eventCode, event.code), isNull(raffleEntries.deletedAt));

  const searchFilter =
    query.length > 0
      ? and(
          activeFilter,
          or(
            ilike(raffleEntries.fullName, `%${query}%`),
            ilike(raffleEntries.email, `%${query}%`),
            ilike(raffleEntries.phone, `%${query}%`),
            ilike(raffleEntries.course, `%${query}%`),
          ),
        )
      : activeFilter;

  const [totals, byRole, entries] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        opportunities: sql<number>`count(*) filter (where ${raffleEntries.opportunitiesConsent})::int`,
      })
      .from(raffleEntries)
      .where(activeFilter),
    db
      .select({
        group: raffleEntries.resultGroup,
        role: raffleEntries.resultRole,
        count: sql<number>`count(*)::int`,
      })
      .from(raffleEntries)
      .where(activeFilter)
      .groupBy(raffleEntries.resultGroup, raffleEntries.resultRole),
    db
      .select()
      .from(raffleEntries)
      .where(searchFilter)
      .orderBy(desc(raffleEntries.createdAt))
      .limit(PAGE_SIZE),
  ]);

  const summary = totals[0] ?? { total: 0, opportunities: 0 };

  const groupTotals = new Map<string, number>();
  for (const row of byRole) {
    groupTotals.set(row.group, (groupTotals.get(row.group) ?? 0) + row.count);
  }

  return (
    <Shell>
      <Header />

      {/* ------------------------------------------------------------ Totais */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Inscrições confirmadas" value={summary.total} />
        <Stat label="Aceitaram receber vagas" value={summary.opportunities} />
        <Stat label="Grupos com inscrição" value={groupTotals.size} />
        <Stat label="Exibindo" value={entries.length} suffix={`de ${summary.total}`} />
      </div>

      {/* -------------------------------------------------------- Distribuição */}
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

      {/* ---------------------------------------------------------- Busca/lista */}
      <section className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <form method="get" className="flex w-full max-w-sm items-end gap-2">
            <div className="flex-1">
              <label htmlFor="q" className="block text-xs font-semibold text-nicopel-gray-text">
                Buscar por nome, contato ou curso
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

          <a
            href="/api/admin/export"
            className="inline-flex items-center justify-center rounded-xl border-2 border-nicopel-black px-4 py-2.5 text-sm font-semibold text-nicopel-ink hover:bg-nicopel-gray/40"
            download
          >
            Exportar CSV (UTF-8)
          </a>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-nicopel-gray bg-white">
          <table className="w-full min-w-[860px] text-left text-sm">
            <caption className="sr-only">
              Inscrições confirmadas no sorteio da visita técnica
            </caption>
            <thead className="border-b border-nicopel-gray bg-nicopel-gray/40 text-xs uppercase tracking-wide text-nicopel-gray-text">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Nome</th>
                <th scope="col" className="px-4 py-3 font-semibold">Contato</th>
                <th scope="col" className="px-4 py-3 font-semibold">Curso / Instituição</th>
                <th scope="col" className="px-4 py-3 font-semibold">Resultado</th>
                <th scope="col" className="px-4 py-3 font-semibold">Vagas?</th>
                <th scope="col" className="px-4 py-3 font-semibold">Inscrição</th>
                <th scope="col" className="px-4 py-3 font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-nicopel-gray-text">
                    {query ? 'Nenhuma inscrição encontrada para essa busca.' : 'Nenhuma inscrição ainda.'}
                  </td>
                </tr>
              )}
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-nicopel-gray/60 last:border-0">
                  <td className="px-4 py-3 font-medium">{entry.fullName}</td>
                  <td className="px-4 py-3 text-nicopel-gray-text">
                    {entry.phone && <span className="block">{entry.phone}</span>}
                    {entry.email && <span className="block">{entry.email}</span>}
                  </td>
                  <td className="px-4 py-3 text-nicopel-gray-text">
                    {entry.course && <span className="block">{entry.course}</span>}
                    {entry.institution && <span className="block text-xs">{entry.institution}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {results[entry.resultRole as RoleId]?.name ?? entry.resultRole}
                    <span className="block text-xs text-nicopel-gray-mid">
                      Grupo {entry.resultGroup}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {entry.opportunitiesConsent ? (
                      <span className="rounded-full bg-nicopel-green-soft px-2 py-0.5 text-xs font-semibold text-nicopel-green-deep">
                        Sim
                      </span>
                    ) : (
                      <span className="text-xs text-nicopel-gray-mid">Não</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-nicopel-gray-text tabular-nums">
                    {formatDateTime(entry.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <DeleteEntryButton id={entry.id} name={entry.fullName} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {summary.total > PAGE_SIZE && (
          <p className="mt-3 text-xs text-nicopel-gray-text">
            Mostrando as {PAGE_SIZE} inscrições mais recentes. Use a busca ou exporte o CSV para ver
            todas.
          </p>
        )}
      </section>

      <p className="mt-8 rounded-xl border-2 border-dashed border-nicopel-gray p-4 text-xs leading-relaxed text-nicopel-gray-text">
        O sorteio é feito fora do sistema, a partir do CSV exportado, seguindo as regras oficiais
        aprovadas pela Nicopel. Exclua os dados após cumprida a finalidade — o procedimento está no
        README.
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main id="conteudo" className="min-h-dvh bg-nicopel-gray/25">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">{children}</div>
    </main>
  );
}

function Header() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel do sorteio</h1>
        <p className="mt-1 text-sm text-nicopel-gray-text">
          {event.name} • {event.dateLabel} • código <code className="font-mono">{event.code}</code>
        </p>
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

function Stat({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-xl border border-nicopel-gray bg-white p-4">
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
