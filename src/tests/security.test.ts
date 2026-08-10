import { beforeEach, describe, expect, it } from 'vitest';
import {
  createSessionToken,
  hashPassword,
  verifyPassword,
  verifySessionToken,
} from '@/lib/admin-auth';
import { clientKey, isHoneypotFilled, rateLimit, resetRateLimit, safeEqual } from '@/lib/security';

describe('rate limit', () => {
  beforeEach(() => resetRateLimit());

  it('libera até o limite e bloqueia depois', () => {
    const options = { limit: 3, windowMs: 60_000 };
    expect(rateLimit('teste', options, 0).allowed).toBe(true);
    expect(rateLimit('teste', options, 0).allowed).toBe(true);
    expect(rateLimit('teste', options, 0).allowed).toBe(true);

    const blocked = rateLimit('teste', options, 0);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(60);
  });

  it('reabre a janela depois do tempo', () => {
    const options = { limit: 1, windowMs: 1_000 };
    expect(rateLimit('janela', options, 0).allowed).toBe(true);
    expect(rateLimit('janela', options, 500).allowed).toBe(false);
    expect(rateLimit('janela', options, 1_500).allowed).toBe(true);
  });

  it('conta cada chave separadamente', () => {
    const options = { limit: 1, windowMs: 60_000 };
    expect(rateLimit('a', options, 0).allowed).toBe(true);
    expect(rateLimit('b', options, 0).allowed).toBe(true);
    expect(rateLimit('a', options, 0).allowed).toBe(false);
  });
});

describe('chave do cliente', () => {
  it('não expõe o IP em texto claro', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.7, 70.41.3.18' });
    const key = clientKey(headers, 'raffle');
    expect(key.startsWith('raffle:')).toBe(true);
    expect(key).not.toContain('203.0.113.7');
  });

  it('é estável para o mesmo IP e diferente entre IPs', () => {
    const a = clientKey(new Headers({ 'x-forwarded-for': '203.0.113.7' }), 'raffle');
    const b = clientKey(new Headers({ 'x-forwarded-for': '203.0.113.7' }), 'raffle');
    const c = clientKey(new Headers({ 'x-forwarded-for': '203.0.113.8' }), 'raffle');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});

describe('honeypot', () => {
  it('detecta preenchimento e ignora vazio', () => {
    expect(isHoneypotFilled('spam')).toBe(true);
    expect(isHoneypotFilled('')).toBe(false);
    expect(isHoneypotFilled('   ')).toBe(false);
    expect(isHoneypotFilled(undefined)).toBe(false);
  });
});

describe('comparação segura', () => {
  it('compara conteúdos iguais e diferentes', () => {
    expect(safeEqual('abc123', 'abc123')).toBe(true);
    expect(safeEqual('abc123', 'abc124')).toBe(false);
    expect(safeEqual('abc', 'abcdef')).toBe(false);
    expect(safeEqual('', '')).toBe(true);
  });
});

describe('senha do administrador', () => {
  it('gera hash verificável no formato esperado', () => {
    const hash = hashPassword('senha-muito-forte-2026');
    expect(hash.startsWith('scrypt$')).toBe(true);
    expect(hash.split('$')).toHaveLength(3);
    expect(verifyPassword('senha-muito-forte-2026', hash)).toBe(true);
  });

  it('rejeita senha errada', () => {
    const hash = hashPassword('senha-muito-forte-2026');
    expect(verifyPassword('senha-errada', hash)).toBe(false);
  });

  it('gera hashes diferentes para a mesma senha (salt aleatório)', () => {
    expect(hashPassword('mesma-senha-1234')).not.toBe(hashPassword('mesma-senha-1234'));
  });

  it('rejeita hash malformado sem lançar erro', () => {
    expect(verifyPassword('x', 'nao-e-um-hash')).toBe(false);
    expect(verifyPassword('x', 'scrypt$zz$zz')).toBe(false);
    expect(verifyPassword('x', '')).toBe(false);
  });
});

describe('sessão do administrador', () => {
  const SECRET = 'secreto-de-teste-com-mais-de-32-caracteres';

  function withSecret<T>(secret: string | undefined, run: () => T): T {
    const previous = process.env.ADMIN_SESSION_SECRET;
    if (secret === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = secret;
    try {
      return run();
    } finally {
      if (previous === undefined) delete process.env.ADMIN_SESSION_SECRET;
      else process.env.ADMIN_SESSION_SECRET = previous;
    }
  }

  it('cria e valida um token', () => {
    withSecret(SECRET, () => {
      const token = createSessionToken(0);
      expect(token).toBeTruthy();
      expect(verifySessionToken(token as string, 0)).toBe(true);
    });
  });

  it('recusa token expirado', () => {
    withSecret(SECRET, () => {
      const token = createSessionToken(0) as string;
      const nineHours = 9 * 60 * 60 * 1000;
      expect(verifySessionToken(token, nineHours)).toBe(false);
    });
  });

  it('recusa token adulterado', () => {
    withSecret(SECRET, () => {
      const token = createSessionToken(0) as string;
      const [payload] = token.split('.');
      expect(verifySessionToken(`${payload}.assinatura-falsa`, 0)).toBe(false);
      expect(verifySessionToken(`999999999999.${token.split('.')[1]}`, 0)).toBe(false);
    });
  });

  it('recusa token assinado com outro segredo', () => {
    const token = withSecret(SECRET, () => createSessionToken(0) as string);
    withSecret('outro-segredo-com-mais-de-32-caracteres!!', () => {
      expect(verifySessionToken(token, 0)).toBe(false);
    });
  });

  it('não emite sessão sem segredo configurado', () => {
    withSecret(undefined, () => {
      expect(createSessionToken(0)).toBeNull();
      expect(verifySessionToken('qualquer.coisa', 0)).toBe(false);
    });
  });

  it('não emite sessão com segredo curto demais', () => {
    withSecret('curto', () => {
      expect(createSessionToken(0)).toBeNull();
    });
  });
});
