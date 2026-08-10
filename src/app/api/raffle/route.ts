import { and, eq, isNull, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { CONSENT_VERSION, event } from '@/content/site-content';
import { getDb, isDatabaseConfigured } from '@/lib/db';
import { raffleEntries } from '@/lib/schema';
import { clientKey, isHoneypotFilled, logServerEvent, rateLimit } from '@/lib/security';
import { fieldErrors, normalizeRaffleInput, raffleInputSchema } from '@/lib/validation';

/**
 * `POST /api/raffle` — inscrição no sorteio da visita técnica.
 *
 * Só é chamado por quem escolheu participar e marcou o consentimento. Toda a
 * validação é refeita aqui: o cliente nunca é fonte da verdade.
 *
 * As mensagens devolvidas são amigáveis e não contêm nenhum dado enviado; os
 * detalhes ficam apenas no log do servidor, também sem PII.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RATE_LIMIT = { limit: 8, windowMs: 60_000 };

function jsonError(status: number, message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, message, ...extra }, { status });
}

export async function POST(request: Request) {
  // 1. Freio de mão contra envio automatizado e repetição em rajada.
  const limit = rateLimit(clientKey(request.headers, 'raffle'), RATE_LIMIT);
  if (!limit.allowed) {
    logServerEvent('raffle_rate_limited');
    return NextResponse.json(
      { ok: false, message: 'Muitas tentativas em pouco tempo. Aguarde alguns segundos.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  // 2. Corpo da requisição.
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError(400, 'Não conseguimos ler os dados enviados.');
  }

  // 3. Honeypot: robô preenche, pessoa não vê. Responde 200 para não dar pista.
  if (typeof payload === 'object' && payload !== null && isHoneypotFilled((payload as Record<string, unknown>).website)) {
    logServerEvent('raffle_honeypot_triggered');
    return NextResponse.json({ ok: true, duplicate: false }, { status: 200 });
  }

  // 4. Validação server-side.
  const parsed = raffleInputSchema.safeParse(payload);
  if (!parsed.success) {
    logServerEvent('raffle_validation_failed', { issues: parsed.error.issues.length });
    return jsonError(400, 'Confira os campos destacados.', { errors: fieldErrors(parsed.error) });
  }

  const entry = normalizeRaffleInput(parsed.data);

  // 5. Sem banco configurado o quiz continua inteiro — só a inscrição falha,
  //    e dizemos isso com clareza em vez de fingir sucesso.
  if (!isDatabaseConfigured()) {
    logServerEvent('raffle_db_not_configured');
    return jsonError(503, 'O cadastro está indisponível no momento.');
  }

  const db = getDb();
  if (!db) {
    return jsonError(503, 'O cadastro está indisponível no momento.');
  }

  try {
    // 6. Deduplicação por contato dentro do mesmo evento.
    const contactFilters = [
      entry.email ? eq(raffleEntries.email, entry.email) : null,
      entry.phone ? eq(raffleEntries.phone, entry.phone) : null,
    ].filter((filter): filter is NonNullable<typeof filter> => filter !== null);

    const existing = await db
      .select({ id: raffleEntries.id })
      .from(raffleEntries)
      .where(
        and(
          eq(raffleEntries.eventCode, event.code),
          isNull(raffleEntries.deletedAt),
          contactFilters.length === 1 ? contactFilters[0] : or(...contactFilters),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      logServerEvent('raffle_duplicate', { role: entry.resultRole });
      return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
    }

    await db.insert(raffleEntries).values({
      eventCode: event.code,
      fullName: entry.fullName,
      email: entry.email,
      phone: entry.phone,
      course: entry.course,
      institution: entry.institution,
      resultGroup: entry.resultGroup,
      resultRole: entry.resultRole,
      raffleConsent: true,
      opportunitiesConsent: entry.opportunitiesConsent,
      consentVersion: CONSENT_VERSION,
    });

    logServerEvent('raffle_created', { group: entry.resultGroup, role: entry.resultRole });
    return NextResponse.json({ ok: true, duplicate: false }, { status: 201 });
  } catch (error) {
    // Corrida entre dois envios simultâneos: o índice único resolve, e o
    // resultado para a pessoa é o mesmo — participação garantida.
    const message = error instanceof Error ? error.message : '';
    if (message.includes('duplicate key') || message.includes('_uq')) {
      logServerEvent('raffle_duplicate_race');
      return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
    }

    logServerEvent('raffle_insert_failed');
    return jsonError(500, 'Não conseguimos confirmar sua participação agora.');
  }
}
