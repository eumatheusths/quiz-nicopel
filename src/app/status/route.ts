import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb, isDatabaseConfigured } from '@/lib/db';
import { isAdminConfigured } from '@/lib/admin-auth';
import { safeEqual } from '@/lib/security';

/**
 * `GET /status` — verificação técnica rápida para o dia do evento.
 *
 * Em desenvolvimento responde livremente. Em produção só responde com o token
 * correto em `?token=` ou no header `x-status-token`; sem `STATUS_PAGE_TOKEN`
 * definido, a rota fica desativada. Nunca expõe segredos nem dados de
 * participantes — apenas se cada peça está de pé.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const isDev = process.env.NODE_ENV !== 'production';
  const expected = process.env.STATUS_PAGE_TOKEN?.trim();

  if (!isDev) {
    if (!expected) {
      return NextResponse.json({ ok: false, message: 'Rota desativada.' }, { status: 404 });
    }
    const url = new URL(request.url);
    const provided = url.searchParams.get('token') ?? request.headers.get('x-status-token') ?? '';
    if (!safeEqual(provided, expected)) {
      return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401 });
    }
  }

  let database: 'ok' | 'erro' | 'nao-configurado' = 'nao-configurado';
  if (isDatabaseConfigured()) {
    try {
      const db = getDb();
      await db?.execute(sql`select 1`);
      database = 'ok';
    } catch {
      database = 'erro';
    }
  }

  const checks = {
    aplicacao: 'ok' as const,
    banco: database,
    admin: isAdminConfigured() ? ('configurado' as const) : ('nao-configurado' as const),
    siteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim()),
    retencaoDefinida: Boolean(process.env.DATA_RETENTION_DATE?.trim()),
  };

  const healthy = checks.banco !== 'erro';

  return NextResponse.json(
    { ok: healthy, checks, verificadoEm: new Date().toISOString() },
    {
      status: healthy ? 200 : 503,
      headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
    },
  );
}
