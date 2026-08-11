import { desc } from 'drizzle-orm';
import type { Metadata } from 'next';
import { isAuthenticated, isAdminConfigured } from '@/lib/admin-auth';
import { getDb, isDatabaseConfigured } from '@/lib/db';
import { resumes } from '@/lib/schema';
import { formatPhone } from '@/lib/validation';
import { LoginForm } from '../LoginForm';
import { logout } from '../actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Currículos - Painel',
  robots: { index: false, follow: false, nocache: true },
};

export default async function CurriculosPage() {
  if (!(await isAuthenticated())) {
    return (
      <Shell>
        <div className="mx-auto w-full max-w-sm">
          <h1 className="text-2xl font-bold">Painel Administrativo</h1>
          {isAdminConfigured() ? (
            <LoginForm />
          ) : (
            <p className="rounded-xl border-2 border-dashed border-nicopel-gray p-4 text-sm text-nicopel-gray-text">
              Painel não configurado.
            </p>
          )}
        </div>
      </Shell>
    );
  }

  if (!isDatabaseConfigured()) {
    return (
      <Shell>
        <Header activeTab="curriculos" />
        <p className="mt-6 rounded-xl border-2 border-dashed border-nicopel-gray p-4 text-sm text-nicopel-gray-text">
          Banco de dados não configurado.
        </p>
      </Shell>
    );
  }

  const db = getDb();
  if (!db) return null;

  const rows = await db.select().from(resumes).orderBy(desc(resumes.createdAt));

  return (
    <Shell>
      <Header activeTab="curriculos" />

      <section className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-lg font-bold">Currículos Recebidos ({rows.length})</h2>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-nicopel-gray bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-nicopel-gray bg-nicopel-gray/40 text-xs uppercase tracking-wide text-nicopel-gray-text">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Nome</th>
                <th scope="col" className="px-4 py-3 font-semibold">Contato</th>
                <th scope="col" className="px-4 py-3 font-semibold">Idade / Local</th>
                <th scope="col" className="px-4 py-3 font-semibold">Interesses</th>
                <th scope="col" className="px-4 py-3 font-semibold">Data</th>
                <th scope="col" className="px-4 py-3 font-semibold text-right">Arquivo</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-nicopel-gray-text">
                    Nenhum currículo recebido ainda.
                  </td>
                </tr>
              )}
              {rows.map((row) => {
                const areas = JSON.parse(row.interests || '[]');
                return (
                  <tr key={row.id} className="border-b border-nicopel-gray/60 last:border-0">
                    <td className="px-4 py-3 font-medium">{row.fullName}</td>
                    <td className="px-4 py-3 text-nicopel-gray-text text-xs">
                      {row.email}<br/>
                      {formatPhone(row.phone)}
                    </td>
                    <td className="px-4 py-3 text-nicopel-gray-text text-xs">
                      {row.age ? `${row.age} anos` : 'N/A'}<br/>
                      {row.address || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {areas.map((area: string) => (
                          <span key={area} className="bg-nicopel-gray/30 px-2 py-0.5 rounded text-xs">
                            {area}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-nicopel-gray-text tabular-nums">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.fileBase64 ? (
                        <a 
                          href={`/api/admin/curriculos/${row.id}`}
                          target="_blank"
                          className="inline-flex items-center justify-center rounded-lg bg-nicopel-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-nicopel-ink transition-colors"
                        >
                          Baixar CV
                        </a>
                      ) : (
                        <span className="text-xs text-nicopel-gray-mid">Sem anexo</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
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

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(value);
}
