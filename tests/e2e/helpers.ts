import { expect, type Page } from '@playwright/test';

/**
 * Utilidades compartilhadas pelos testes de fluxo.
 *
 * As alternativas são embaralhadas visualmente a cada sessão, então os helpers
 * escolhem por posição na tela — nunca por texto de uma opção específica.
 */

export const TOTAL_QUESTIONS = 10;

/** Abre o quiz e passa da tela de introdução. */
export async function startQuiz(page: Page): Promise<void> {
  await page.goto('/quiz');
  await page.getByRole('button', { name: 'Vamos lá' }).click();
  await expect(page.getByText('Pergunta 1 de 10')).toBeVisible();
}

/** Seleciona a alternativa na posição `index` da pergunta atual. */
export async function chooseOption(page: Page, index = 0): Promise<void> {
  await page.locator('fieldset label').nth(index).click();
}

/** Avança uma pergunta. Na décima, o botão é “Ver meu resultado”. */
export async function goNext(page: Page, isLast = false): Promise<void> {
  const name = isLast ? 'Ver meu resultado' : 'Avançar';
  await page.getByRole('button', { name, exact: true }).click();
}

/** Responde as 10 perguntas escolhendo sempre a alternativa da posição `index`. */
export async function answerAll(page: Page, index = 0): Promise<void> {
  for (let question = 1; question <= TOTAL_QUESTIONS; question += 1) {
    await expect(page.getByText(`Pergunta ${question} de 10`)).toBeVisible();
    await chooseOption(page, index);
    await goNext(page, question === TOTAL_QUESTIONS);
  }
}

/** Espera o convite do sorteio aparecer depois da tela de processamento. */
export async function waitForRaffleInvite(page: Page): Promise<void> {
  await expect(
    page.getByRole('heading', { name: /Sua próxima descoberta pode acontecer/i }),
  ).toBeVisible({ timeout: 10_000 });
}

/**
 * O modal. Escopar as buscas por aqui evita ambiguidade com os botões do quiz
 * que continuam no DOM (inertes) atrás dele.
 */
export function raffleDialog(page: Page) {
  return page.getByRole('dialog');
}

/** Confirma que a pessoa chegou a uma página de resultado válida. */
export async function expectResultPage(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/resultado\/[a-z-]+$/, { timeout: 10_000 });
  await expect(page.getByText('Seu perfil mostrou afinidade com')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}
