import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Utilidades de segurança do endpoint público de inscrição.
 *
 * O rate limit é em memória e, portanto, por instância. Para um evento de
 * algumas horas em um estande isso é suficiente e evita dependências externas.
 * Para volumes maiores, trocar por um store compartilhado (ver README).
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Requisições permitidas dentro da janela. */
  limit: number;
  /** Tamanho da janela em milissegundos. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Segundos até a janela reiniciar — vai no header `Retry-After`. */
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
  now: number = Date.now(),
): RateLimitResult {
  // Limpeza oportunista para a memória não crescer indefinidamente.
  if (buckets.size > 5_000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: allowed ? 0 : Math.ceil((existing.resetAt - now) / 1000),
  };
}

/** Somente para testes: zera o estado do rate limit. */
export function resetRateLimit(): void {
  buckets.clear();
}

/**
 * Identificador do cliente para o rate limit.
 *
 * O IP é usado apenas em memória e nunca gravado: por isso é reduzido a um
 * hash curto antes de virar chave, e nunca aparece em log algum.
 */
export function clientKey(headers: Headers, scope: string): string {
  const forwarded = headers.get('x-forwarded-for') ?? '';
  const ip = forwarded.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown';
  const digest = createHash('sha256').update(ip).digest('hex').slice(0, 16);
  return `${scope}:${digest}`;
}

/** Comparação de strings resistente a ataques de tempo. */
export function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');
  if (bufferA.length !== bufferB.length) {
    // Compara mesmo assim, com um buffer do mesmo tamanho, para não vazar o
    // comprimento pelo tempo de resposta.
    timingSafeEqual(bufferA, bufferA);
    return false;
  }
  return timingSafeEqual(bufferA, bufferB);
}

/**
 * Detecta preenchimento do campo honeypot. Bots costumam preencher todos os
 * inputs do formulário; pessoas nunca veem este campo.
 */
export function isHoneypotFilled(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Log de servidor livre de PII. Só aceita chaves e valores curtos e não
 * sensíveis — use para diagnosticar sem nunca registrar dados de participantes.
 */
export function logServerEvent(event: string, context: Record<string, string | number | boolean> = {}): void {
  const safeContext = Object.fromEntries(
    Object.entries(context).map(([key, value]) => [key, String(value).slice(0, 64)]),
  );
  console.info(JSON.stringify({ event, ...safeContext }));
}
