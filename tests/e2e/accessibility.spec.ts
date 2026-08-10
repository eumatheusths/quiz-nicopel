import { expect, test } from '@playwright/test';
import { answerAll, expectResultPage, startQuiz, waitForRaffleInvite } from './helpers';

test.describe('acessibilidade e resiliência', () => {
  test('é possível responder o quiz inteiro apenas com o teclado', async ({ page }) => {
    await page.goto('/quiz');

    // Chega ao botão de início navegando por Tab e ativa com Enter.
    await page.keyboard.press('Tab'); // pular para o conteúdo
    await page.keyboard.press('Tab'); // logo
    await page.keyboard.press('Tab'); // "Vamos lá"
    await expect(page.getByRole('button', { name: 'Vamos lá' })).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page.getByText('Pergunta 1 de 10')).toBeVisible();

    for (let question = 1; question <= 10; question += 1) {
      // O primeiro radio do grupo recebe foco e as setas navegam entre eles.
      await page.locator('fieldset input[type=radio]').first().focus();
      await page.keyboard.press('ArrowDown');
      await expect(page.locator('fieldset input[type=radio]:checked')).toHaveCount(1);

      const label = question === 10 ? 'Ver meu resultado' : 'Avançar';
      await page.getByRole('button', { name: label, exact: true }).focus();
      await page.keyboard.press('Enter');
    }

    await waitForRaffleInvite(page);

    // O foco entra no modal e o Escape sai revelando o resultado.
    await page.keyboard.press('Escape');
    await expectResultPage(page);
  });

  test('o foco fica preso dentro do modal do sorteio', async ({ page }) => {
    await startQuiz(page);
    await answerAll(page);
    await waitForRaffleInvite(page);

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Vinte tabulações seguidas continuam dentro do diálogo.
    for (let i = 0; i < 20; i += 1) {
      await page.keyboard.press('Tab');
      const inside = await dialog.evaluate((element) => element.contains(document.activeElement));
      expect(inside).toBe(true);
    }
  });

  test('respeita prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await startQuiz(page);
    await answerAll(page);
    await waitForRaffleInvite(page);
    await page.getByRole('button', { name: 'Pular e ver meu resultado' }).click();
    await expectResultPage(page);

    // A regra global zera as durações de animação (o Chrome serializa
    // 0.001ms como "1e-06s", por isso comparamos o valor numérico).
    const duration = await page
      .locator('h1')
      .evaluate((element) => getComputedStyle(element).animationDuration);
    expect(Number.parseFloat(duration)).toBeLessThan(0.01);
  });

  test('não há rolagem horizontal a partir de 320 px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });

    for (const path of ['/', '/quiz', '/privacidade', '/resultado/comercial']) {
      await page.goto(path);
      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(overflows, `rolagem horizontal em ${path}`).toBe(false);
    }
  });

  test('os alvos de toque têm pelo menos 44 px de altura', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await startQuiz(page);

    const targets = page.locator('fieldset label, button:visible');
    const count = await targets.count();
    expect(count).toBeGreaterThan(5);

    for (let i = 0; i < count; i += 1) {
      const target = targets.nth(i);
      const box = await target.boundingBox();
      if (!box || box.height === 0) continue;
      const text = (await target.textContent())?.trim().slice(0, 40);
      expect(box.height, `alvo "${text}" pequeno demais`).toBeGreaterThanOrEqual(44);
    }
  });

  test('cada página tem exatamente um h1 e um marco principal', async ({ page }) => {
    for (const path of ['/', '/privacidade', '/resultado/marketing']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 }), path).toHaveCount(1);
      await expect(page.getByRole('main'), path).toHaveCount(1);
    }
  });

  test('a barra de progresso é anunciada corretamente', async ({ page }) => {
    await startQuiz(page);
    const progress = page.getByRole('progressbar');
    await expect(progress).toHaveAttribute('aria-valuenow', '1');
    await expect(progress).toHaveAttribute('aria-valuemax', '10');
    await expect(progress).toHaveAttribute('aria-valuetext', 'Pergunta 1 de 10');
  });

  test('o quiz funciona sem nenhuma chamada de rede externa', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (!['localhost', '127.0.0.1'].includes(url.hostname)) external.push(request.url());
    });

    await startQuiz(page);
    await answerAll(page);
    await waitForRaffleInvite(page);
    await page.getByRole('button', { name: 'Pular e ver meu resultado' }).click();
    await expectResultPage(page);

    expect(external).toEqual([]);
  });
});
