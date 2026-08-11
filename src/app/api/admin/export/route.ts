import { and, asc, eq, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { results } from '@/content/results';
import { event } from '@/content/site-content';
import type { RoleId } from '@/content/types';
import { isAuthenticated } from '@/lib/admin-auth';
import { getDb } from '@/lib/db';
import { adminAuditLog, participants } from '@/lib/schema';
import { logServerEvent } from '@/lib/security';
import { formatPhone } from '@/lib/validation';

/**
 * `GET /api/admin/export` — planilha CSV dos participantes.
 *
 * Sai em UTF-8 com BOM para o Excel em português abrir os acentos corretamente,
 * e com `;` como separador, que é o padrão do Excel em pt-BR.
 *
 * `?sorteio=1` limita a exportação a quem marcou a participação no sorteio —
 * é essa lista que vira a base do sorteio.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SEPARATOR = ';';
const COLUMNS = [
  'nome_completo',
  'whatsapp',
  'email',
  'idade',
  'quer_sorteio',
  'area',
  'cargo',
  'concluiu_quiz',
  'versao_consentimento',
  'cadastrado_em',
  'concluido_em',
] as const;

/**
 * Escapa um campo CSV. O prefixo com aspas em valores iniciados por `=`, `+`,
 * `-` ou `@` evita injeção de fórmula quando o arquivo abre no Excel.
 */
function csvCell(value: string | number | boolean | Date | null): string {
  if (value === null) return '';
  if (typeof value === 'boolean') return value ? 'sim' : 'nao';
  if (typeof value === 'number') return String(value);
  if (value instanceof Date) return formatDateTime(value);

  const text = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${text.replace(/"/g, '""')}"`;
}

export function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'America/Sao_Paulo',
  }).format(value);
}

export async function GET(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ ok: false, message: 'Banco indisponível.' }, { status: 503 });
  }

  const onlyRaffle = new URL(request.url).searchParams.get('sorteio') === '1';

  const filters = [eq(participants.eventCode, event.code), isNull(participants.deletedAt)];
  if (onlyRaffle) filters.push(eq(participants.raffleConsent, true));

  const rows = await db
    .select()
    .from(participants)
    .where(and(...filters))
    .orderBy(asc(participants.createdAt));

  const lines = [COLUMNS.join(SEPARATOR)];
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.fullName),
        csvCell(formatPhone(row.phone)),
        csvCell(row.email),
        csvCell(row.age),
        csvCell(row.raffleConsent),
        csvCell(row.resultGroup),
        csvCell(row.resultRole ? (results[row.resultRole as RoleId]?.name ?? row.resultRole) : null),
        csvCell(row.completedAt !== null),
        csvCell(row.consentVersion),
        csvCell(row.createdAt),
        csvCell(row.completedAt),
      ].join(SEPARATOR),
    );
  }

  try {
    await db.insert(adminAuditLog).values({
      action: 'export_csv',
      detail: `linhas=${rows.length}${onlyRaffle ? ' filtro=sorteio' : ''}`,
    });
  } catch {
    // A auditoria não pode impedir a exportação.
  }

  logServerEvent('admin_export_csv', { rows: rows.length, raffle: onlyRaffle });

  // BOM UTF-8 para o Excel reconhecer a codificação.
  const body = `﻿${lines.join('\r\n')}\r\n`;
  const suffix = onlyRaffle ? '-sorteio' : '';
  const filename = `participantes${suffix}-${event.code}-${new Date().toISOString().slice(0, 10)}.csv`;

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
