import { expect, type Page } from '@playwright/test';

/**
 * Utilidades compartilhadas pelos testes de fluxo.
 *
 * As alternativas são embaralhadas visualmente a cada sessão, então os helpers
 * escolhem por posição na tela — nunca por texto de uma opção específica.
 */

export const TOTAL_QUESTIONS = 10;

const FAKE_PARTICIPANT_ID = '3f1c2b7a-9d4e-4c1f-8a2b-7e5d6c4b3a21';

/**
 * Intercepta o cadastro para os testes não gravarem no banco real.
 * Devolve a lista de payloads enviados, para inspeção.
 */
export async function mockRegistration(page: Page): Promise<Record<string, unknown>[]> {
  const sent: Record<string, unknown>[] = [];

  // Remove um mock anterior antes de registrar o novo: sem isso, dois
  // handlers concorrem e o array inspecionado pode não ser o que recebe.
  await page.unroute('**/api/participants');

  await page.route('**/api/participants', async (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      sent.push(request.postDataJSON() as Record<string, unknown>);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, participantId: FAKE_PARTICIPANT_ID, duplicate: false }),
      });
      return;
    }
    // PATCH do resultado
    sent.push(request.postDataJSON() as Record<string, unknown>);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });

  return sent;
}

export interface RegistrationData {
  fullName?: string;
  phone?: string;
  email?: string;
  age?: string;
  raffle?: boolean;
}

/** Preenche o cadastro que abre o quiz. */
export async function fillRegistration(page: Page, data: RegistrationData = {}): Promise<void> {
  const {
    fullName = 'Maria Silva',
    phone = '43999998888',
    email = 'maria.silva@example.com',
    age = '21',
    raffle = false,
  } = data;

  await page.getByLabel('Nome completo').fill(fullName);
  await page.getByLabel('WhatsApp').fill(phone);
  await page.getByLabel('E-mail').fill(email);
  await page.getByRole('spinbutton').fill(age);

  if (raffle) await page.locator('input[type=checkbox]').check();
}

/** Abre o quiz, preenche o cadastro e chega na primeira pergunta. */
export async function startQuiz(page: Page, data: RegistrationData = {}): Promise<void> {
  await page.goto('/quiz');
  await expect(page.getByRole('heading', { name: 'Antes de começar, se apresente' })).toBeVisible();
  await fillRegistration(page, data);
  await page.getByRole('button', { name: 'Começar o quiz' }).click();
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

/** Confirma que a pessoa chegou a uma página de resultado válida. */
export async function expectResultPage(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/resultado\/[a-z-]+$/, { timeout: 15_000 });
  await expect(page.getByText('Seu perfil mostrou afinidade com')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

/** Percorre a jornada inteira até o resultado. */
export async function completeQuiz(page: Page, data: RegistrationData = {}): Promise<void> {
  await startQuiz(page, data);
  await answerAll(page);
  await expectResultPage(page);
}
