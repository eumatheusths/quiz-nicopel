import { expect, test } from '@playwright/test';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Envio de currículo, com foco no limite de tamanho do anexo.
 *
 * O anexo passa por uma Server Action, e estourar o `bodySizeLimit` devolve
 * 500 antes do nosso código rodar — o que derrubava a página inteira. Estes
 * testes travam esse comportamento: acima do limite, o envio nem sai.
 */

const MAX_LABEL = '3 MB';

/** PDF mínimo válido, inflado até o tamanho pedido. */
function makePdf(megabytes: number): string {
  const dir = mkdtempSync(join(tmpdir(), 'cv-'));
  const path = join(dir, `cv-${megabytes}mb.pdf`);
  const head = Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n% ',
  );
  const padding = Buffer.alloc(Math.round(megabytes * 1024 * 1024) - head.length, 0x20);
  writeFileSync(path, Buffer.concat([head, padding]));
  return path;
}

async function fillBasics(page: import('@playwright/test').Page, tag: string) {
  await page.goto('/curriculo');
  await page.getByLabel('Nome completo').fill('Teste Automatizado');
  await page.getByLabel('WhatsApp').fill('43999998888');
  await page.getByLabel('E-mail').fill(`e2e.${tag}.${Date.now()}@example.invalid`);
}

test.describe('envio de currículo', () => {
  test('anexo acima do limite é barrado antes de sair do navegador', async ({ page }) => {
    let quebrou = false;
    page.on('pageerror', () => (quebrou = true));

    await fillBasics(page, 'grande');
    await page.locator('input[type=file]').setInputFiles(makePdf(3.5));

    const aviso = page.locator('#cvFile-error');
    await expect(aviso).toBeVisible();
    await expect(aviso).toContainText(MAX_LABEL);

    // O envio fica bloqueado e a página continua de pé.
    await expect(page.getByRole('button', { name: 'Enviar currículo' })).toBeDisabled();
    expect(quebrou, 'a página não pode quebrar').toBe(false);
  });

  test('trocar por um anexo válido libera o envio de novo', async ({ page }) => {
    await fillBasics(page, 'troca');
    const input = page.locator('input[type=file]');
    const botao = page.getByRole('button', { name: 'Enviar currículo' });

    await input.setInputFiles(makePdf(3.5));
    await expect(botao).toBeDisabled();

    await input.setInputFiles(makePdf(0.4));
    await expect(botao).toBeEnabled();
    await expect(page.locator('#cvFile-error')).toHaveCount(0);
  });

  test('o limite exibido é o mesmo que o código aplica', async ({ page }) => {
    await page.goto('/curriculo');
    await expect(page.getByText(`PDF, DOC ou DOCX, até ${MAX_LABEL}`)).toBeVisible();
  });
});
