import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { safeEqual } from './security';

/**
 * Autenticação do painel administrativo.
 *
 * A senha nunca é guardada: o ambiente recebe apenas um hash scrypt. A sessão
 * é um cookie httpOnly assinado com HMAC — nenhum segredo chega ao cliente.
 */

export const ADMIN_COOKIE = 'nicopel_admin';
const SESSION_TTL_SECONDS = 60 * 60 * 8; // uma jornada de estande

const SCRYPT_KEYLEN = 64;

/** Gera o valor de `ADMIN_PASSWORD_HASH`. Usado por `npm run admin:hash`. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;

  const [, saltHex, hashHex] = parts;
  if (!saltHex || !hashHex) return false;

  try {
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    if (expected.length !== SCRYPT_KEYLEN) return false;
    const derived = scryptSync(password, salt, SCRYPT_KEYLEN);
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/**
 * Segredo que assina o cookie de sessão.
 *
 * Não existe valor padrão de propósito. Um segredo embutido no código ficaria
 * visível no repositório, e quem o lesse conseguiria forjar um cookie válido e
 * entrar no painel sem senha nenhuma. Sem a variável, o painel fecha.
 */
function sessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) return null;
  return secret;
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD_HASH?.trim()) && sessionSecret() !== null;
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

/** Token no formato `<expiraEm>.<assinatura>`. Não carrega nenhum dado pessoal. */
export function createSessionToken(now: number = Date.now()): string | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const expiresAt = Math.floor(now / 1000) + SESSION_TTL_SECONDS;
  const payload = String(expiresAt);
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(token: string | undefined, now: number = Date.now()): boolean {
  if (!token) return false;
  const secret = sessionSecret();
  if (!secret) return false;

  const separator = token.lastIndexOf('.');
  if (separator <= 0) return false;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!safeEqual(signature, sign(payload, secret))) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt)) return false;
  return expiresAt * 1000 > now;
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
};

/** `true` se a requisição atual tem uma sessão de administrador válida. */
export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

/**
 * Confere a senha enviada no login. Retorna `false` quando o admin não está
 * configurado — nunca deixa o painel aberto por falta de variável de ambiente.
 */
export function checkAdminPassword(password: string): boolean {
  // A senha em si nunca fica no código: comparamos com o hash do ambiente.
  const stored = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!stored || !sessionSecret()) return false;
  return verifyPassword(password, stored);
}
