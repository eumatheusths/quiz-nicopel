import { describe, expect, it } from 'vitest';
import {
  fieldErrors,
  normalizeEmail,
  normalizePhone,
  normalizeRaffleInput,
  normalizeText,
  raffleInputSchema,
} from '@/lib/validation';

const validPayload = {
  fullName: 'Maria Silva',
  email: '',
  phone: '(43) 99999-8888',
  course: 'Administração',
  institution: 'UNOPAR',
  resultGroup: 'A' as const,
  resultRole: 'comercial' as const,
  raffleConsent: true as const,
  opportunitiesConsent: false,
  website: '',
  submissionId: '3f1c2b7a-9d4e-4c1f-8a2b-7e5d6c4b3a21',
};

describe('normalização de e-mail', () => {
  it('remove espaços e passa para minúsculas', () => {
    expect(normalizeEmail('  Maria.Silva@Email.COM  ')).toBe('maria.silva@email.com');
  });

  it('devolve null para vazio', () => {
    expect(normalizeEmail('')).toBeNull();
    expect(normalizeEmail('   ')).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
    expect(normalizeEmail(undefined)).toBeNull();
  });
});

describe('normalização de telefone', () => {
  it.each([
    ['(43) 99999-8888', '+5543999998888'],
    ['43999998888', '+5543999998888'],
    ['+55 43 99999-8888', '+5543999998888'],
    ['55 (43) 99999 8888', '+5543999998888'],
    ['043 99999-8888', '+5543999998888'],
    ['4333334444', '+554333334444'],
  ])('normaliza %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it('reconhece variações do mesmo número como iguais — base da deduplicação', () => {
    const forms = ['(43) 99999-8888', '43 99999 8888', '+55 43 999998888', '5543999998888'];
    const normalized = new Set(forms.map((form) => normalizePhone(form)));
    expect(normalized.size).toBe(1);
  });

  it.each([
    ['123', 'curto demais'],
    ['4399999888888888', 'longo demais'],
    ['(09) 99999-8888', 'DDD inválido'],
    ['(43) 89999-8888', 'celular de 9 dígitos sem começar com 9'],
    ['(43) 0999-8888', 'fixo começando com 0'],
    ['abcdefghij', 'sem dígitos'],
  ])('rejeita %s (%s)', (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});

describe('normalização de texto', () => {
  it('colapsa espaços', () => {
    expect(normalizeText('  Maria   da  Silva ')).toBe('Maria da Silva');
  });

  it('devolve null para vazio', () => {
    expect(normalizeText('   ')).toBeNull();
  });
});

describe('schema do formulário do sorteio', () => {
  it('aceita um cadastro válido só com WhatsApp', () => {
    expect(raffleInputSchema.safeParse(validPayload).success).toBe(true);
  });

  it('aceita um cadastro válido só com e-mail', () => {
    const parsed = raffleInputSchema.safeParse({
      ...validPayload,
      phone: '',
      email: 'maria@email.com',
    });
    expect(parsed.success).toBe(true);
  });

  it('exige pelo menos um contato, ancorando o erro em um campo real', () => {
    const parsed = raffleInputSchema.safeParse({ ...validPayload, phone: '', email: '' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const errors = fieldErrors(parsed.error);
      expect(errors.phone).toBe('Informe pelo menos um contato: WhatsApp ou e-mail.');
    }
  });

  it('exige nome e sobrenome', () => {
    const parsed = raffleInputSchema.safeParse({ ...validPayload, fullName: 'Maria' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(fieldErrors(parsed.error)).toHaveProperty('fullName');
  });

  it('exige o consentimento do sorteio', () => {
    const parsed = raffleInputSchema.safeParse({ ...validPayload, raffleConsent: false });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(fieldErrors(parsed.error)).toHaveProperty('raffleConsent');
  });

  it('não exige o consentimento de oportunidades', () => {
    expect(raffleInputSchema.safeParse({ ...validPayload, opportunitiesConsent: false }).success).toBe(
      true,
    );
    expect(raffleInputSchema.safeParse({ ...validPayload, opportunitiesConsent: true }).success).toBe(
      true,
    );
  });

  it('rejeita o honeypot preenchido', () => {
    const parsed = raffleInputSchema.safeParse({ ...validPayload, website: 'http://spam.example' });
    expect(parsed.success).toBe(false);
  });

  it('rejeita e-mail malformado', () => {
    const parsed = raffleInputSchema.safeParse({
      ...validPayload,
      phone: '',
      email: 'maria@@email',
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(fieldErrors(parsed.error)).toHaveProperty('email');
  });

  it('rejeita telefone malformado', () => {
    const parsed = raffleInputSchema.safeParse({ ...validPayload, phone: '999' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(fieldErrors(parsed.error)).toHaveProperty('phone');
  });

  it('rejeita cargo inexistente', () => {
    const parsed = raffleInputSchema.safeParse({ ...validPayload, resultRole: 'presidente' });
    expect(parsed.success).toBe(false);
  });

  it('rejeita id de envio que não seja UUID', () => {
    const parsed = raffleInputSchema.safeParse({ ...validPayload, submissionId: 'abc' });
    expect(parsed.success).toBe(false);
  });

  it('as mensagens de erro não repetem os valores enviados', () => {
    const parsed = raffleInputSchema.safeParse({
      ...validPayload,
      fullName: 'Sobrenomelongo',
      email: 'segredo@exemplo.com',
      phone: '',
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const messages = Object.values(fieldErrors(parsed.error)).join(' ');
      expect(messages).not.toContain('segredo@exemplo.com');
      expect(messages).not.toContain('Sobrenomelongo');
    }
  });
});

describe('normalização do payload aprovado', () => {
  it('devolve os campos prontos para gravação', () => {
    const parsed = raffleInputSchema.parse({
      ...validPayload,
      fullName: '  Maria   Silva  ',
      email: ' MARIA@Email.com ',
      course: '  Administração ',
    });
    const entry = normalizeRaffleInput(parsed);

    expect(entry).toMatchObject({
      fullName: 'Maria Silva',
      email: 'maria@email.com',
      phone: '+5543999998888',
      course: 'Administração',
      institution: 'UNOPAR',
      resultGroup: 'A',
      resultRole: 'comercial',
      raffleConsent: true,
      opportunitiesConsent: false,
    });
  });

  it('transforma campos opcionais vazios em null', () => {
    const parsed = raffleInputSchema.parse({ ...validPayload, course: '', institution: '' });
    const entry = normalizeRaffleInput(parsed);
    expect(entry.course).toBeNull();
    expect(entry.institution).toBeNull();
  });
});

describe('deduplicação por contato e evento', () => {
  /** Reproduz a chave de unicidade usada pelo índice do banco. */
  function dedupeKeys(eventCode: string, email: string | null, phone: string | null): string[] {
    return [email && `${eventCode}|email|${email}`, phone && `${eventCode}|phone|${phone}`].filter(
      (key): key is string => Boolean(key),
    );
  }

  it('duas grafias do mesmo contato colidem no mesmo evento', () => {
    const first = normalizeRaffleInput(
      raffleInputSchema.parse({ ...validPayload, phone: '(43) 99999-8888' }),
    );
    const second = normalizeRaffleInput(
      raffleInputSchema.parse({ ...validPayload, phone: '+55 43 99999 8888', fullName: 'Maria S Silva' }),
    );

    const keysA = dedupeKeys('unopar-2026-08-13', first.email, first.phone);
    const keysB = dedupeKeys('unopar-2026-08-13', second.email, second.phone);
    expect(keysA.some((key) => keysB.includes(key))).toBe(true);
  });

  it('o mesmo contato em eventos diferentes não colide', () => {
    const entry = normalizeRaffleInput(raffleInputSchema.parse(validPayload));
    const keysA = dedupeKeys('unopar-2026-08-13', entry.email, entry.phone);
    const keysB = dedupeKeys('outro-evento-2027', entry.email, entry.phone);
    expect(keysA.some((key) => keysB.includes(key))).toBe(false);
  });

  it('contatos diferentes não colidem', () => {
    const first = normalizeRaffleInput(raffleInputSchema.parse(validPayload));
    const second = normalizeRaffleInput(
      raffleInputSchema.parse({ ...validPayload, phone: '(43) 98888-7777' }),
    );
    const keysA = dedupeKeys('unopar-2026-08-13', first.email, first.phone);
    const keysB = dedupeKeys('unopar-2026-08-13', second.email, second.phone);
    expect(keysA.some((key) => keysB.includes(key))).toBe(false);
  });
});
