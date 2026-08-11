import { z } from 'zod';
import { GROUP_IDS, ROLE_IDS, type GroupId, type RoleId } from '@/content/types';

/**
 * Normalização e validação do cadastro do participante.
 *
 * A validação roda no servidor (fonte da verdade) e também no cliente, para
 * dar feedback imediato. A normalização acontece antes da gravação e é o que
 * permite detectar cadastros duplicados pelo mesmo contato.
 */

export const MIN_AGE = 14;
export const MAX_AGE = 99;

/** Minúsculas e sem espaços nas pontas. Retorna `null` para vazio. */
export function normalizeEmail(input: string | null | undefined): string | null {
  if (!input) return null;
  const value = input.trim().toLowerCase();
  return value.length > 0 ? value : null;
}

/**
 * Telefone brasileiro em formato canônico `+55DDNNNNNNNNN`.
 *
 * Aceita entradas com máscara, espaços, parênteses, `+55` e `0` de operadora.
 * Retorna `null` quando não sobra um número plausível — a validação Zod é quem
 * transforma isso em mensagem de erro.
 */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;

  let digits = input.replace(/\D/g, '');
  if (digits.length === 0) return null;

  // Prefixo internacional do Brasil e zero de operadora antes do DDD.
  // Um "0" à frente de 11 dígitos NÃO é removido: seria um DDD inválido
  // disfarçado, como (09) 99999-8888.
  if (digits.length > 11 && digits.startsWith('55')) digits = digits.slice(2);
  if (digits.length === 12 && digits.startsWith('0')) digits = digits.slice(1);

  if (digits.length !== 10 && digits.length !== 11) return null;

  const ddd = Number(digits.slice(0, 2));
  if (ddd < 11 || ddd > 99) return null;

  // Celular com 9 dígitos precisa começar com 9; fixo com 8 não pode começar com 0 ou 1.
  const subscriber = digits.slice(2);
  if (subscriber.length === 9 && !subscriber.startsWith('9')) return null;
  if (subscriber.length === 8 && /^[01]/.test(subscriber)) return null;

  return `+55${digits}`;
}

/** Espaços colapsados. Usado em nome. */
export function normalizeText(input: string | null | undefined): string | null {
  if (!input) return null;
  const value = input.replace(/\s+/g, ' ').trim();
  return value.length > 0 ? value : null;
}

/** Formata `+5543999998888` como `(43) 99999-8888` para leitura humana. */
export function formatPhone(stored: string | null): string {
  if (!stored) return '';
  const digits = stored.replace(/\D/g, '').replace(/^55/, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return stored;
}

/** Schema do cadastro enviado em `POST /api/participants`. */
export const registrationSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, 'Informe seu nome completo.')
      .max(120, 'Use no máximo 120 caracteres.')
      .refine((value) => value.split(/\s+/).length >= 2, 'Informe nome e sobrenome.'),
    email: z.string().trim().min(1, 'Informe seu e-mail.').max(160, 'Use no máximo 160 caracteres.'),
    phone: z.string().trim().min(1, 'Informe seu WhatsApp.').max(30, 'Use no máximo 30 caracteres.'),
    age: z
      .number({ message: 'Informe sua idade.' })
      .int('Informe a idade em anos inteiros.')
      .min(MIN_AGE, `A idade mínima é ${MIN_AGE} anos.`)
      .max(MAX_AGE, `A idade máxima é ${MAX_AGE} anos.`),
    /** Checkbox “quero participar do sorteio”. Opcional e desmarcado por padrão. */
    raffleConsent: z.boolean().optional(),
    /** Campo honeypot: precisa chegar vazio. Humanos não o veem. */
    website: z.string().max(0, 'Envio inválido.').optional().or(z.literal('')),
    /** Chave de idempotência gerada no cliente, para resistir a duplo clique. */
    submissionId: z.uuid('Identificação de envio inválida.'),
  })
  .superRefine((data, ctx) => {
    const email = normalizeEmail(data.email);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      ctx.addIssue({ code: 'custom', path: ['email'], message: 'E-mail inválido.' });
    }

    if (!normalizePhone(data.phone)) {
      ctx.addIssue({
        code: 'custom',
        path: ['phone'],
        message: 'WhatsApp inválido. Use DDD + número.',
      });
    }
  });

export type RegistrationInput = z.infer<typeof registrationSchema>;

export interface NormalizedRegistration {
  fullName: string;
  email: string;
  phone: string;
  age: number;
  raffleConsent: boolean;
  submissionId: string;
}

/** Aplica a normalização depois que o schema já aprovou o payload. */
export function normalizeRegistration(input: RegistrationInput): NormalizedRegistration {
  return {
    fullName: normalizeText(input.fullName) ?? '',
    email: normalizeEmail(input.email) ?? '',
    phone: normalizePhone(input.phone) ?? '',
    age: input.age,
    raffleConsent: input.raffleConsent === true,
    submissionId: input.submissionId,
  };
}

/** Schema do `PATCH /api/participants` que grava o resultado do quiz. */
export const resultUpdateSchema = z.object({
  participantId: z.uuid('Identificação de participante inválida.'),
  resultGroup: z.enum(GROUP_IDS as unknown as [GroupId, ...GroupId[]]),
  resultRole: z.enum(ROLE_IDS as unknown as [RoleId, ...RoleId[]]),
});

export type ResultUpdateInput = z.infer<typeof resultUpdateSchema>;

/**
 * Achata os erros do Zod em `{ campo: mensagem }`, pronto para a interface.
 * Nunca inclui os valores enviados — as mensagens não podem vazar PII.
 */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const output: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : 'form';
    if (!(key in output)) output[key] = issue.message;
  }
  return output;
}
