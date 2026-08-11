import { and, eq, isNull, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { CONSENT_VERSION, event } from '@/content/site-content';
import { getDb, isDatabaseConfigured } from '@/lib/db';
import { participants } from '@/lib/schema';
import { clientKey, isHoneypotFilled, logServerEvent, rateLimit } from '@/lib/security';
import {
  fieldErrors,
  normalizeRegistration,
  registrationSchema,
  resultUpdateSchema,
} from '@/lib/validation';

/**
 * Cadastro do participante e gravação do resultado.
 *
 * `POST`  — cria o participante antes das perguntas começarem.
 * `PATCH` — grava o cargo obtido quando o quiz termina.
 *
 * Toda a validação é refeita aqui: o cliente nunca é fonte da verdade.
 * As mensagens devolvidas são amigáveis e não contêm nenhum dado enviado.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RATE_LIMIT = { limit: 10, windowMs: 60_000 };

function jsonError(status: number, message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, message, ...extra }, { status });
}

export async function POST(request: Request) {
  // 1. Freio contra envio automatizado e repetição em rajada.
  const limit = rateLimit(clientKey(request.headers, 'registration'), RATE_LIMIT);
  if (!limit.allowed) {
    logServerEvent('registration_rate_limited');
    return NextResponse.json(
      { ok: false, message: 'Muitas tentativas em pouco tempo. Aguarde alguns segundos.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError(400, 'Não conseguimos ler os dados enviados.');
  }

  // 2. Honeypot: robô preenche, pessoa não vê.
  if (
    typeof payload === 'object' &&
    payload !== null &&
    isHoneypotFilled((payload as Record<string, unknown>).website)
  ) {
    logServerEvent('registration_honeypot_triggered');
    return jsonError(400, 'Envio inválido.');
  }

  // 3. Validação server-side.
  const parsed = registrationSchema.safeParse(payload);
  if (!parsed.success) {
    logServerEvent('registration_validation_failed', { issues: parsed.error.issues.length });
    return jsonError(400, 'Confira os campos destacados.', { errors: fieldErrors(parsed.error) });
  }

  const entry = normalizeRegistration(parsed.data);

  if (!isDatabaseConfigured()) {
    logServerEvent('registration_db_not_configured');
    return jsonError(503, 'O cadastro está indisponível no momento.');
  }

  const db = getDb();
  if (!db) return jsonError(503, 'O cadastro está indisponível no momento.');

  try {
    // 4. Já cadastrado neste evento? Devolve o mesmo registro em vez de duplicar.
    const existing = await db
      .select({ id: participants.id })
      .from(participants)
      .where(
        and(
          eq(participants.eventCode, event.code),
          isNull(participants.deletedAt),
          or(eq(participants.email, entry.email), eq(participants.phone, entry.phone)),
        ),
      )
      .limit(1);

    const found = existing[0];
    if (found) {
      // Atualiza o consentimento do sorteio: a pessoa pode ter mudado de ideia.
      await db
        .update(participants)
        .set({ raffleConsent: entry.raffleConsent })
        .where(eq(participants.id, found.id));

      logServerEvent('registration_duplicate');
      return NextResponse.json({ ok: true, participantId: found.id, duplicate: true });
    }

    const inserted = await db
      .insert(participants)
      .values({
        eventCode: event.code,
        fullName: entry.fullName,
        email: entry.email,
        phone: entry.phone,
        age: entry.age,
        raffleConsent: entry.raffleConsent,
        consentVersion: CONSENT_VERSION,
      })
      .returning({ id: participants.id });

    const created = inserted[0];
    if (!created) return jsonError(500, 'Não conseguimos salvar seu cadastro agora.');

    logServerEvent('registration_created', { raffle: entry.raffleConsent });
    return NextResponse.json({ ok: true, participantId: created.id, duplicate: false }, { status: 201 });
  } catch (error) {
    // Corrida entre dois envios simultâneos: o índice único resolve.
    const message = error instanceof Error ? error.message : '';
    if (message.includes('duplicate key') || message.includes('_uq')) {
      logServerEvent('registration_duplicate_race');
      return jsonError(409, 'Este contato já está cadastrado neste evento.');
    }

    logServerEvent('registration_insert_failed');
    return jsonError(500, 'Não conseguimos salvar seu cadastro agora.');
  }
}

/** Grava o resultado do quiz no participante já cadastrado. */
export async function PATCH(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError(400, 'Não conseguimos ler os dados enviados.');
  }

  const parsed = resultUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonError(400, 'Dados de resultado inválidos.', { errors: fieldErrors(parsed.error) });
  }

  const db = getDb();
  if (!db) return jsonError(503, 'Indisponível no momento.');

  try {
    const updated = await db
      .update(participants)
      .set({
        resultGroup: parsed.data.resultGroup,
        resultRole: parsed.data.resultRole,
        completedAt: new Date(),
      })
      .where(and(eq(participants.id, parsed.data.participantId), isNull(participants.deletedAt)))
      .returning({ id: participants.id });

    if (updated.length === 0) return jsonError(404, 'Participante não encontrado.');

    logServerEvent('result_saved', { role: parsed.data.resultRole });
    return NextResponse.json({ ok: true });
  } catch {
    logServerEvent('result_save_failed');
    return jsonError(500, 'Não conseguimos salvar o resultado agora.');
  }
}
