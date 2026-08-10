import { z } from 'zod';
import { GROUP_IDS, ROLE_IDS, type GroupId, type RoleId } from '@/content/types';

/**
 * Normalização e validação dos dados do sorteio.
 *
 * A validação roda no servidor (fonte da verdade) e também no cliente, para
 * dar feedback imediato. A normalização acontece antes da gravação e é o que
 * permite detectar inscrições duplicadas pelo mesmo contato.
 */

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

/** Espaços colapsados. Usado em nome, curso e instituição. */
export function normalizeText(input: string | null | undefined): string | null {
  if (!input) return null;
  const value = input.replace(/\s+/g, ' ').trim();
  return value.length > 0 ? value : null;
}

const optionalText = (max: number) =>
  z.string().trim().max(max, `Use no máximo ${max} caracteres.`).optional().or(z.literal(''));

/** Schema do payload recebido em `POST /api/raffle`. */
export const raffleInputSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, 'Informe seu nome completo.')
      .max(120, 'Use no máximo 120 caracteres.')
      .refine((value) => value.split(/\s+/).length >= 2, 'Informe nome e sobrenome.'),
    email: z.string().trim().max(160, 'Use no máximo 160 caracteres.').optional().or(z.literal('')),
    phone: z.string().trim().max(30, 'Use no máximo 30 caracteres.').optional().or(z.literal('')),
    course: optionalText(120),
    institution: optionalText(120),
    resultGroup: z.enum(GROUP_IDS as unknown as [GroupId, ...GroupId[]]),
    resultRole: z.enum(ROLE_IDS as unknown as [RoleId, ...RoleId[]]),
    // Validado no `superRefine`, e não com `z.literal(true)`, de propósito:
    // uma falha aqui no schema base abortaria o parse e impediria os demais
    // erros de aparecerem — a pessoa veria um problema de cada vez.
    raffleConsent: z.boolean().optional(),
    opportunitiesConsent: z.boolean().optional(),
    /** Campo honeypot: precisa chegar vazio. Humanos não o veem. */
    website: z.string().max(0, 'Envio inválido.').optional().or(z.literal('')),
    /** Chave de idempotência gerada no cliente, para resistir a duplo clique. */
    submissionId: z.uuid('Identificação de envio inválida.'),
  })
  .superRefine((data, ctx) => {
    if (data.raffleConsent !== true) {
      ctx.addIssue({
        code: 'custom',
        path: ['raffleConsent'],
        message: 'É preciso aceitar o uso dos dados para participar do sorteio.',
      });
    }

    const rawEmail = data.email?.trim() ?? '';
    const rawPhone = data.phone?.trim() ?? '';

    // Nenhum contato preenchido. O erro é ancorado em `phone` — o primeiro
    // campo do par — porque um caminho inventado como `contact` não
    // corresponderia a nenhum input e a mensagem não teria onde aparecer.
    if (rawEmail === '' && rawPhone === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['phone'],
        message: 'Informe pelo menos um contato: WhatsApp ou e-mail.',
      });
      return;
    }

    // Campo preenchido mas inválido: o erro aponta para o campo certo, que é
    // muito mais útil que “informe um contato”.
    if (rawEmail !== '') {
      const email = normalizeEmail(rawEmail);
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        ctx.addIssue({ code: 'custom', path: ['email'], message: 'E-mail inválido.' });
      }
    }

    if (rawPhone !== '' && !normalizePhone(rawPhone)) {
      ctx.addIssue({
        code: 'custom',
        path: ['phone'],
        message: 'WhatsApp inválido. Use DDD + número.',
      });
    }
  });

export type RaffleInput = z.infer<typeof raffleInputSchema>;

export interface NormalizedRaffleEntry {
  fullName: string;
  email: string | null;
  phone: string | null;
  course: string | null;
  institution: string | null;
  resultGroup: GroupId;
  resultRole: RoleId;
  raffleConsent: true;
  opportunitiesConsent: boolean;
  submissionId: string;
}

/** Aplica a normalização depois que o schema já aprovou o payload. */
export function normalizeRaffleInput(input: RaffleInput): NormalizedRaffleEntry {
  return {
    fullName: normalizeText(input.fullName) ?? '',
    email: normalizeEmail(input.email),
    phone: normalizePhone(input.phone),
    course: normalizeText(input.course),
    institution: normalizeText(input.institution),
    resultGroup: input.resultGroup,
    resultRole: input.resultRole,
    // O schema já garantiu que veio `true`.
    raffleConsent: true,
    opportunitiesConsent: input.opportunitiesConsent === true,
    submissionId: input.submissionId,
  };
}

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
