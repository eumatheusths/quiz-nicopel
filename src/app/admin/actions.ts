'use server';

import { eq, isNull, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';
import {
  ADMIN_COOKIE,
  checkAdminPassword,
  createSessionToken,
  isAdminConfigured,
  isAuthenticated,
  sessionCookieOptions,
} from '@/lib/admin-auth';
import { getDb } from '@/lib/db';
import { adminAuditLog, raffleEntries } from '@/lib/schema';
import { clientKey, logServerEvent, rateLimit } from '@/lib/security';

/**
 * Ações do painel administrativo. Tudo roda no servidor: o segredo de
 * administração nunca chega ao cliente.
 */

export interface ActionState {
  error?: string;
  success?: string;
}

const LOGIN_RATE_LIMIT = { limit: 6, windowMs: 5 * 60_000 };

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isAdminConfigured()) {
    return {
      error:
        'Painel não configurado. Defina ADMIN_PASSWORD_HASH e ADMIN_SESSION_SECRET no ambiente.',
    };
  }

  const requestHeaders = await headers();
  const limit = rateLimit(clientKey(requestHeaders, 'admin-login'), LOGIN_RATE_LIMIT);
  if (!limit.allowed) {
    logServerEvent('admin_login_rate_limited');
    return { error: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' };
  }

  const password = formData.get('password');
  if (typeof password !== 'string' || password.length === 0) {
    return { error: 'Informe a senha.' };
  }

  if (!checkAdminPassword(password)) {
    logServerEvent('admin_login_failed');
    // Mensagem genérica de propósito: não revela se a senha existe.
    return { error: 'Senha incorreta.' };
  }

  const token = createSessionToken();
  if (!token) return { error: 'Sessão indisponível. Verifique ADMIN_SESSION_SECRET.' };

  const store = await cookies();
  store.set(ADMIN_COOKIE, token, sessionCookieOptions);
  logServerEvent('admin_login_ok');
  revalidatePath('/admin');
  return { success: 'Sessão iniciada.' };
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  revalidatePath('/admin');
}

/** Exclusão lógica de uma inscrição, a pedido do titular dos dados. */
export async function deleteEntry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await isAuthenticated())) return { error: 'Sessão expirada. Entre novamente.' };

  const id = formData.get('id');
  if (typeof id !== 'string' || id.length === 0) return { error: 'Inscrição inválida.' };

  const db = getDb();
  if (!db) return { error: 'Banco de dados indisponível.' };

  try {
    const removed = await db
      .update(raffleEntries)
      .set({ deletedAt: new Date() })
      .where(and(eq(raffleEntries.id, id), isNull(raffleEntries.deletedAt)))
      .returning({ id: raffleEntries.id });

    if (removed.length === 0) return { error: 'Inscrição não encontrada.' };

    await db.insert(adminAuditLog).values({
      action: 'delete_entry',
      detail: 'exclusao_individual',
      targetId: id,
    });

    logServerEvent('admin_entry_deleted');
    revalidatePath('/admin');
    return { success: 'Inscrição excluída.' };
  } catch {
    logServerEvent('admin_entry_delete_failed');
    return { error: 'Não foi possível excluir agora.' };
  }
}
