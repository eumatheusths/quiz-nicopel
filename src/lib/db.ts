import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Conexão com o Postgres.
 *
 * O banco é opcional por design: sem `DATABASE_URL` o quiz funciona inteiro e
 * apenas a inscrição no sorteio fica indisponível. Isso é o que garante o
 * requisito de resiliência do evento — o resultado nunca depende do banco.
 */

type Database = ReturnType<typeof drizzle<typeof schema>>;

let client: ReturnType<typeof postgres> | null = null;
let database: Database | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getDb(): Database | null {
  if (!isDatabaseConfigured()) return null;
  if (database) return database;

  client = postgres(process.env.DATABASE_URL as string, {
    // Serverless: poucas conexões por instância e desligamento rápido.
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    onnotice: () => {},
  });
  database = drizzle(client, { schema });
  return database;
}

/** Fecha a conexão. Usado em scripts, não em requisições. */
export async function closeDb(): Promise<void> {
  if (client) {
    await client.end({ timeout: 5 });
    client = null;
    database = null;
  }
}

export { schema };
