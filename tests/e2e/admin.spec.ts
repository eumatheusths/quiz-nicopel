import { expect, test } from '@playwright/test';

/**
 * Proteção do painel administrativo.
 *
 * Os testes que dependem de sessão autenticada só rodam quando o ambiente
 * tem ADMIN_PASSWORD_HASH, ADMIN_SESSION_SECRET e DATABASE_URL definidos —
 * ver a seção “Rodar os testes” do README.
 */

const hasAdmin = Boolean(process.env.ADMIN_PASSWORD_HASH && process.env.ADMIN_SESSION_SECRET);
const hasDatabase = Boolean(process.env.DATABASE_URL);
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? '';

test.describe('painel administrativo', () => {
  test('sem autenticação, o painel mostra apenas o login', async ({ page }) => {
    await page.goto('/admin');

    await expect(page.getByRole('heading', { name: 'Painel do sorteio' })).toBeVisible();
    // Nenhum dado de participante é exposto.
    await expect(page.getByRole('table')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Exportar CSV (UTF-8)' })).toHaveCount(0);
  });

  test('a exportação exige autenticação', async ({ request }) => {
    const response = await request.get('/api/admin/export');
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.ok).toBe(false);
    // A resposta não vaza nada além da negativa.
    expect(JSON.stringify(body)).not.toMatch(/@|\+55/);
  });

  test('o painel não é indexável', async ({ request }) => {
    const response = await request.get('/admin');
    expect(response.headers()['x-robots-tag']).toContain('noindex');
  });

  test('o robots.txt bloqueia painel e APIs', async ({ request }) => {
    const body = await (await request.get('/robots.txt')).text();
    expect(body).toContain('/admin');
    expect(body).toContain('/api/');
  });

  test('uma senha errada não abre sessão', async ({ page }) => {
    test.skip(!hasAdmin, 'ADMIN_PASSWORD_HASH/ADMIN_SESSION_SECRET não configurados');

    await page.goto('/admin');
    await page.getByLabel('Senha do painel').fill('senha-obviamente-errada');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByText('Senha incorreta.')).toBeVisible();
    await expect(page.getByRole('table')).toHaveCount(0);
  });

  test('com a senha correta, o CSV é exportado em UTF-8', async ({ page }) => {
    test.skip(!hasAdmin || !hasDatabase || !adminPassword, 'ambiente de admin/banco não configurado');

    await page.goto('/admin');
    await page.getByLabel('Senha do painel').fill(adminPassword);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('table')).toBeVisible();

    const download = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: 'Exportar CSV (UTF-8)' }).click(),
    ]).then(([event]) => event);

    expect(download.suggestedFilename()).toMatch(/^sorteio-unopar-2026-08-13-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});

test.describe('rota de verificação técnica', () => {
  test('/status responde em desenvolvimento e não expõe segredos', async ({ request }) => {
    const response = await request.get('/status');
    // Em produção sem token a rota some (404); em dev responde 200 ou 503.
    expect([200, 401, 404, 503]).toContain(response.status());

    if (response.status() === 200 || response.status() === 503) {
      const body = JSON.stringify(await response.json());
      expect(body).not.toContain('postgres://');
      expect(body).not.toContain('scrypt$');
    }
  });
});
