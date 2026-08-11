import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Participantes do quiz.
 *
 * O cadastro acontece ANTES das perguntas, então cada linha nasce quando a
 * pessoa se identifica e é completada quando ela termina o quiz
 * (`result_group`, `result_role` e `completed_at`).
 *
 * `raffle_consent` marca quem aceitou participar do sorteio da visita técnica —
 * é o recorte que o painel usa para separar “fez o quiz” de “quer concorrer”.
 *
 * Contém dados pessoais. `deleted_at` implementa exclusão lógica para atender
 * pedidos de remoção; a exclusão física acontece no expurgo (ver README).
 */
export const participants = pgTable(
  'participants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Identifica o evento. Permite reusar o quiz em outras feiras. */
    eventCode: text('event_code').notNull(),

    // --- Cadastro (coletado antes das perguntas) ---
    fullName: text('full_name').notNull(),
    /** Normalizado como +55DDNNNNNNNNN no servidor. */
    phone: text('phone').notNull(),
    /** Normalizado em minúsculas no servidor. */
    email: text('email').notNull(),
    age: integer('age').notNull(),

    // --- Sorteio ---
    raffleConsent: boolean('raffle_consent').notNull().default(false),
    /** Versão do texto de consentimento aceito, para prova documental. */
    consentVersion: text('consent_version').notNull(),

    // --- Resultado (preenchido ao terminar o quiz) ---
    resultGroup: text('result_group'),
    resultRole: text('result_role'),
    completedAt: timestamp('completed_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    // Um mesmo contato não se cadastra duas vezes no mesmo evento.
    // Os índices ignoram registros excluídos, permitindo recadastro após remoção.
    uniqueIndex('participants_event_email_uq')
      .on(table.eventCode, table.email)
      .where(sql`${table.deletedAt} is null`),
    uniqueIndex('participants_event_phone_uq')
      .on(table.eventCode, table.phone)
      .where(sql`${table.deletedAt} is null`),
    index('participants_event_created_idx').on(table.eventCode, table.createdAt),
    index('participants_raffle_idx').on(table.eventCode, table.raffleConsent),
  ],
);

export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;

/**
 * Trilha de auditoria das ações administrativas (exportação e exclusão).
 * Nunca guarda o conteúdo exportado, apenas o que foi feito e quando.
 */
export const adminAuditLog = pgTable('admin_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  action: text('action').notNull(),
  /** Detalhe sem PII. Ex.: "export_csv", "delete_entry". */
  detail: text('detail'),
  /** Id do participante afetado, quando a ação for individual. */
  targetId: uuid('target_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type AdminAuditEntry = typeof adminAuditLog.$inferSelect;

/**
 * Currículos enviados através da rota /curriculo.
 */
export const resumes = pgTable('resumes', {
  id: uuid('id').primaryKey().defaultRandom(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  age: integer('age'),
  address: text('address'),
  interests: text('interests').notNull(), // json array stringified
  /** Cargo indicado pelo quiz, quando a pessoa veio pela página de resultado. */
  quizResult: text('quiz_result'),
  fileName: text('file_name'),
  fileType: text('file_type'),
  fileBase64: text('file_base64'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Resume = typeof resumes.$inferSelect;
export type NewResume = typeof resumes.$inferInsert;
