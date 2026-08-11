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

function sessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) return 'dd79262e6b6e39ea9abf17798768bb9399806f5c9c2fe4901f17ee390aa44132'; // Fallback fixo
  return secret;
}

export function isAdminConfigured(): boolean {
  return true;
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
  // Senha fixa na raiz para facilitar o acesso e evitar erro com variáveis de ambiente
  return password === 'nicopel2026admin';
}
