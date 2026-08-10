import { and, asc, eq, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { results } from '@/content/results';
import { event } from '@/content/site-content';
import type { RoleId } from '@/content/types';
import { isAuthenticated } from '@/lib/admin-auth';
import { getDb } from '@/lib/db';
import { adminAuditLog, raffleEntries } from '@/lib/schema';
import { logServerEvent } from '@/lib/security';

/**
 * `GET /api/admin/export` — CSV das inscrições confirmadas.
 *
 * É a fonte oficial do sorteio. Sai em UTF-8 com BOM para o Excel em português
 * abrir os acentos corretamente, e com `;` como separador, que é o padrão do
 * Excel em pt-BR.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SEPARATOR = ';';
const COLUMNS = [
  'nome_completo',
  'whatsapp',
  'email',
  'curso',
  'instituicao',
  'area',
  'cargo',
  'consentimento_sorteio',
  'consentimento_oportunidades',
  'versao_consentimento',
  'consentido_em',
  'inscrito_em',
] as const;

/**
 * Escapa um campo CSV. O prefixo com aspas em valores iniciados por `=`, `+`,
 * `-` ou `@` evita injeção de fórmula quando o arquivo abre no Excel.
 */
function csvCell(value: string | boolean | Date | null): string {
  if (value === null) return '';
  if (typeof value === 'boolean') return value ? 'sim' : 'nao';
  if (value instanceof Date) {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'medium',
      timeZone: 'America/Sao_Paulo',
    }).format(value);
  }

  const text = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ ok: false, message: 'Banco indisponível.' }, { status: 503 });
  }

  const rows = await db
    .select()
    .from(raffleEntries)
    .where(and(eq(raffleEntries.eventCode, event.code), isNull(raffleEntries.deletedAt)))
    .orderBy(asc(raffleEntries.createdAt));

  const lines = [COLUMNS.join(SEPARATOR)];
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.fullName),
        csvCell(row.phone),
        csvCell(row.email),
        csvCell(row.course),
        csvCell(row.institution),
        csvCell(row.resultGroup),
        csvCell(results[row.resultRole as RoleId]?.name ?? row.resultRole),
        csvCell(row.raffleConsent),
        csvCell(row.opportunitiesConsent),
        csvCell(row.consentVersion),
        csvCell(row.consentedAt),
        csvCell(row.createdAt),
      ].join(SEPARATOR),
    );
  }

  try {
    await db.insert(adminAuditLog).values({
      action: 'export_csv',
      detail: `linhas=${rows.length}`,
    });
  } catch {
    // A auditoria não pode impedir a exportação.
  }

  logServerEvent('admin_export', { rows: rows.length });

  // BOM UTF-8 para o Excel reconhecer a codificação.
  const body = `﻿${lines.join('\r\n')}\r\n`;
  const filename = `sorteio-${event.code}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store, max-age=0',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
