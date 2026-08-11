/**
 * Aplica as migrations do Drizzle no banco apontado por DATABASE_URL.
 *
 *   npm run db:generate   # gera o SQL a partir de src/lib/schema.ts
 *   npm run db:migrate    # aplica no banco
 *
 * Roda de forma segura: usa uma conexão dedicada e a fecha ao final.
 */
// `.env.local` primeiro: é o arquivo que o Next usa e o que o .gitignore protege.
import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error('DATABASE_URL não definida. Configure o .env.local antes de migrar.');
    process.exit(1);
  }

  const client = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(client), { migrationsFolder: './drizzle' });
    console.log('Migrations aplicadas com sucesso.');
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  console.error('Falha ao aplicar migrations:', error instanceof Error ? error.message : error);
  process.exit(1);
});
