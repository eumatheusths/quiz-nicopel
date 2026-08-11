import { describe, expect, it } from 'vitest';
import {
  MAX_AGE,
  MIN_AGE,
  fieldErrors,
  formatPhone,
  normalizeEmail,
  normalizePhone,
  normalizeRegistration,
  normalizeText,
  registrationSchema,
  resultUpdateSchema,
} from '@/lib/validation';

const validPayload = {
  fullName: 'Maria Silva',
  email: 'maria@email.com',
  phone: '(43) 99999-8888',
  age: 21,
  raffleConsent: false,
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
    expect(new Set(forms.map((form) => normalizePhone(form))).size).toBe(1);
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

describe('formatação de telefone para leitura', () => {
  it('formata celular e fixo', () => {
    expect(formatPhone('+5543999998888')).toBe('(43) 99999-8888');
    expect(formatPhone('+554333334444')).toBe('(43) 3333-4444');
  });

  it('não quebra com valor vazio ou inesperado', () => {
    expect(formatPhone(null)).toBe('');
    expect(formatPhone('')).toBe('');
    expect(formatPhone('xyz')).toBe('xyz');
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

describe('schema do cadastro', () => {
  it('aceita um cadastro completo', () => {
    expect(registrationSchema.safeParse(validPayload).success).toBe(true);
  });

  it('exige nome e sobrenome', () => {
    const parsed = registrationSchema.safeParse({ ...validPayload, fullName: 'Maria' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(fieldErrors(parsed.error)).toHaveProperty('fullName');
  });

  it('exige e-mail válido', () => {
    for (const email of ['', 'maria@@email', 'maria', 'maria@email']) {
      const parsed = registrationSchema.safeParse({ ...validPayload, email });
      expect(parsed.success, `deveria rejeitar "${email}"`).toBe(false);
      if (!parsed.success) expect(fieldErrors(parsed.error)).toHaveProperty('email');
    }
  });

  it('exige WhatsApp válido', () => {
    for (const phone of ['', '999', '(09) 99999-8888']) {
      const parsed = registrationSchema.safeParse({ ...validPayload, phone });
      expect(parsed.success, `deveria rejeitar "${phone}"`).toBe(false);
      if (!parsed.success) expect(fieldErrors(parsed.error)).toHaveProperty('phone');
    }
  });

  it('reporta todos os campos com problema de uma vez', () => {
    const parsed = registrationSchema.safeParse({
      ...validPayload,
      fullName: 'X',
      email: 'nao-e-email',
      phone: '1',
      age: 5,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const errors = fieldErrors(parsed.error);
      // Nenhum erro pode esconder os outros: a pessoa corrige tudo numa passada.
      expect(Object.keys(errors).sort()).toEqual(['age', 'email', 'fullName', 'phone']);
    }
  });

  describe('idade', () => {
    it.each([MIN_AGE, 18, 25, 60, MAX_AGE])('aceita %i anos', (age) => {
      expect(registrationSchema.safeParse({ ...validPayload, age }).success).toBe(true);
    });

    it.each([MIN_AGE - 1, 0, -3, MAX_AGE + 1, 150])('rejeita %i anos', (age) => {
      const parsed = registrationSchema.safeParse({ ...validPayload, age });
      expect(parsed.success).toBe(false);
      if (!parsed.success) expect(fieldErrors(parsed.error)).toHaveProperty('age');
    });

    it('rejeita idade fracionada, ausente ou não numérica', () => {
      for (const age of [20.5, Number.NaN, undefined, '21']) {
        const parsed = registrationSchema.safeParse({ ...validPayload, age });
        expect(parsed.success, `deveria rejeitar ${String(age)}`).toBe(false);
      }
    });
  });

  it('trata o sorteio como opcional e desmarcado por padrão', () => {
    const semCampo = registrationSchema.safeParse({ ...validPayload, raffleConsent: undefined });
    expect(semCampo.success).toBe(true);
    if (semCampo.success) {
      expect(normalizeRegistration(semCampo.data).raffleConsent).toBe(false);
    }

    const marcado = registrationSchema.parse({ ...validPayload, raffleConsent: true });
    expect(normalizeRegistration(marcado).raffleConsent).toBe(true);
  });

  it('rejeita o honeypot preenchido', () => {
    expect(
      registrationSchema.safeParse({ ...validPayload, website: 'http://spam.example' }).success,
    ).toBe(false);
  });

  it('rejeita id de envio que não seja UUID', () => {
    expect(registrationSchema.safeParse({ ...validPayload, submissionId: 'abc' }).success).toBe(
      false,
    );
  });

  it('as mensagens de erro não repetem os valores enviados', () => {
    const parsed = registrationSchema.safeParse({
      ...validPayload,
      fullName: 'Sobrenomelongo',
      email: 'segredo@exemplo',
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const messages = Object.values(fieldErrors(parsed.error)).join(' ');
      expect(messages).not.toContain('segredo@exemplo');
      expect(messages).not.toContain('Sobrenomelongo');
    }
  });
});

describe('normalização do cadastro aprovado', () => {
  it('devolve os campos prontos para gravação', () => {
    const parsed = registrationSchema.parse({
      ...validPayload,
      fullName: '  Maria   Silva  ',
      email: ' MARIA@Email.com ',
    });
    expect(normalizeRegistration(parsed)).toMatchObject({
      fullName: 'Maria Silva',
      email: 'maria@email.com',
      phone: '+5543999998888',
      age: 21,
      raffleConsent: false,
    });
  });
});

describe('deduplicação por contato e evento', () => {
  /** Reproduz as chaves de unicidade usadas pelos índices do banco. */
  function dedupeKeys(eventCode: string, email: string, phone: string): string[] {
    return [`${eventCode}|email|${email}`, `${eventCode}|phone|${phone}`];
  }

  it('duas grafias do mesmo contato colidem no mesmo evento', () => {
    const first = normalizeRegistration(registrationSchema.parse(validPayload));
    const second = normalizeRegistration(
      registrationSchema.parse({
        ...validPayload,
        phone: '+55 43 99999 8888',
        email: 'MARIA@email.com',
        fullName: 'Maria S Silva',
      }),
    );

    const keysA = dedupeKeys('unopar-2026-08-13', first.email, first.phone);
    const keysB = dedupeKeys('unopar-2026-08-13', second.email, second.phone);
    expect(keysA.some((key) => keysB.includes(key))).toBe(true);
  });

  it('o mesmo contato em eventos diferentes não colide', () => {
    const entry = normalizeRegistration(registrationSchema.parse(validPayload));
    const keysA = dedupeKeys('unopar-2026-08-13', entry.email, entry.phone);
    const keysB = dedupeKeys('outro-evento-2027', entry.email, entry.phone);
    expect(keysA.some((key) => keysB.includes(key))).toBe(false);
  });

  it('contatos diferentes não colidem', () => {
    const first = normalizeRegistration(registrationSchema.parse(validPayload));
    const second = normalizeRegistration(
      registrationSchema.parse({
        ...validPayload,
        phone: '(43) 98888-7777',
        email: 'outra@email.com',
      }),
    );
    const keysA = dedupeKeys('unopar-2026-08-13', first.email, first.phone);
    const keysB = dedupeKeys('unopar-2026-08-13', second.email, second.phone);
    expect(keysA.some((key) => keysB.includes(key))).toBe(false);
  });
});

describe('gravação do resultado', () => {
  const base = {
    participantId: '3f1c2b7a-9d4e-4c1f-8a2b-7e5d6c4b3a21',
    resultGroup: 'A',
    resultRole: 'comercial',
  };

  it('aceita grupo e cargo válidos', () => {
    expect(resultUpdateSchema.safeParse(base).success).toBe(true);
  });

  it('rejeita cargo inexistente', () => {
    expect(resultUpdateSchema.safeParse({ ...base, resultRole: 'presidente' }).success).toBe(false);
  });

  it('rejeita grupo inexistente', () => {
    expect(resultUpdateSchema.safeParse({ ...base, resultGroup: 'Z' }).success).toBe(false);
  });

  it('rejeita id de participante inválido', () => {
    expect(resultUpdateSchema.safeParse({ ...base, participantId: '123' }).success).toBe(false);
  });
});
