/**
 * Gera o valor de ADMIN_PASSWORD_HASH.
 *
 *   npm run admin:hash -- "sua-senha-forte"
 *
 * Copie a linha impressa para o .env.local e para as variáveis de ambiente da
 * Vercel. A senha em texto puro nunca é gravada em lugar nenhum.
 */
import { hashPassword } from '../src/lib/admin-auth';

const password = process.argv[2];

if (!password) {
  console.error('Uso: npm run admin:hash -- "sua-senha-forte"');
  process.exit(1);
}

if (password.length < 12) {
  console.error('Use uma senha com pelo menos 12 caracteres.');
  process.exit(1);
}

console.log('\nADMIN_PASSWORD_HASH=' + hashPassword(password) + '\n');
