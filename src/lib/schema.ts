import { sql } from 'drizzle-orm';
import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

/**
 * Inscrições no sorteio da visita técnica.
 *
 * Contém dados pessoais: só é escrita quando a pessoa marca o consentimento
 * específico do sorteio. `deleted_at` implementa exclusão lógica para atender
 * pedidos de remoção sem quebrar a trilha de auditoria; a exclusão física
 * acontece no expurgo da retenção (ver README).
 */
export const raffleEntries = pgTable(
  'raffle_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Identifica o evento. Permite reusar o quiz em outras feiras. */
    eventCode: text('event_code').notNull(),
    fullName: text('full_name').notNull(),
    /** Normalizado em minúsculas no servidor. */
    email: text('email'),
    /** Normalizado como +55DDNNNNNNNNN no servidor. */
    phone: text('phone'),
    course: text('course'),
    institution: text('institution'),
    resultGroup: text('result_group').notNull(),
    resultRole: text('result_role').notNull(),
    raffleConsent: boolean('raffle_consent').notNull(),
    opportunitiesConsent: boolean('opportunities_consent').notNull().default(false),
    /** Versão do texto de consentimento aceito, para prova documental. */
    consentVersion: text('consent_version').notNull(),
    consentedAt: timestamp('consented_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    // Um mesmo contato não se inscreve duas vezes no mesmo evento.
    // O índice ignora registros excluídos, permitindo reinscrição após remoção.
    uniqueIndex('raffle_entries_event_email_uq')
      .on(table.eventCode, table.email)
      .where(sql`${table.email} is not null and ${table.deletedAt} is null`),
    uniqueIndex('raffle_entries_event_phone_uq')
      .on(table.eventCode, table.phone)
      .where(sql`${table.phone} is not null and ${table.deletedAt} is null`),
    index('raffle_entries_event_created_idx').on(table.eventCode, table.createdAt),
    index('raffle_entries_result_idx').on(table.eventCode, table.resultRole),
  ],
);

export type RaffleEntry = typeof raffleEntries.$inferSelect;
export type NewRaffleEntry = typeof raffleEntries.$inferInsert;

/**
 * Trilha de auditoria das ações administrativas (exportação e exclusão).
 * Nunca guarda o conteúdo exportado, apenas o que foi feito e quando.
 */
export const adminAuditLog = pgTable('admin_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  action: text('action').notNull(),
  /** Detalhe sem PII. Ex.: "export_csv", "delete_entry". */
  detail: text('detail'),
  /** Id da inscrição afetada, quando a ação for individual. */
  targetId: uuid('target_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type AdminAuditEntry = typeof adminAuditLog.$inferSelect;
