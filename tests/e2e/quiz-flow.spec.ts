import { expect, test } from '@playwright/test';
import {
  answerAll,
  chooseOption,
  completeQuiz,
  expectResultPage,
  fillRegistration,
  goNext,
  mockRegistration,
  startQuiz,
} from './helpers';

test.beforeEach(async ({ page }) => {
  await mockRegistration(page);
});

test.describe('cadastro antes do quiz', () => {
  test('pede exatamente nome, WhatsApp, e-mail e idade — e nada sensível', async ({ page }) => {
    await page.goto('/quiz');

    await expect(page.getByLabel('Nome completo')).toBeVisible();
    await expect(page.getByLabel('WhatsApp')).toBeVisible();
    await expect(page.getByLabel('E-mail')).toBeVisible();
    await expect(page.getByRole('spinbutton')).toBeVisible();

    const names = await page
      .locator('form input')
      .evaluateAll((inputs) => inputs.map((input) => input.getAttribute('name') ?? input.id));
    const joined = names.join(' ').toLowerCase();
    for (const forbidden of ['cpf', 'nascimento', 'endereco', 'endereço', 'rg']) {
      expect(joined, `campo sensível "${forbidden}"`).not.toContain(forbidden);
    }
  });

  test('não deixa começar sem os dados obrigatórios', async ({ page }) => {
    await page.goto('/quiz');
    await page.getByRole('button', { name: 'Começar o quiz' }).click();

    await expect(page.getByText('Informe seu nome completo.')).toBeVisible();
    await expect(page.getByText('Informe sua idade.')).toBeVisible();
    // Continua no cadastro.
    await expect(page.getByText('Pergunta 1 de 10')).toHaveCount(0);
  });

  test('valida e-mail e WhatsApp', async ({ page }) => {
    await page.goto('/quiz');
    await fillRegistration(page, { email: 'nao-e-email', phone: '999' });
    await page.getByRole('button', { name: 'Começar o quiz' }).click();

    await expect(page.getByText('E-mail inválido.')).toBeVisible();
    await expect(page.getByText('WhatsApp inválido. Use DDD + número.')).toBeVisible();
  });

  test('o seletor de idade responde aos botões e ao slider', async ({ page }) => {
    await page.goto('/quiz');
    const age = page.getByRole('spinbutton');

    await page.getByRole('button', { name: 'Aumentar idade' }).click();
    await expect(age).toHaveValue('14');

    await page.getByRole('button', { name: 'Aumentar idade' }).click();
    await expect(age).toHaveValue('15');

    await page.getByRole('button', { name: 'Diminuir idade' }).click();
    await expect(age).toHaveValue('14');

    // Não desce abaixo do mínimo.
    await page.getByRole('button', { name: 'Diminuir idade' }).click();
    await expect(age).toHaveValue('14');

    await age.fill('30');
    await expect(page.locator('input[type=range]')).toHaveValue('30');
  });

  test('o sorteio é opcional e começa desmarcado', async ({ page }) => {
    await page.goto('/quiz');
    const checkbox = page.locator('input[type=checkbox]');
    await expect(checkbox).toHaveCount(1);
    await expect(checkbox).not.toBeChecked();
  });

  test('marcar o sorteio envia o consentimento como true', async ({ page }) => {
    const sent = await mockRegistration(page);
    await startQuiz(page, { raffle: true });
    expect(sent[0]).toMatchObject({ raffleConsent: true, age: 21 });
  });

  test('sem marcar o sorteio o consentimento vai como false', async ({ page }) => {
    const sent = await mockRegistration(page);
    await startQuiz(page, { raffle: false });
    expect(sent[0]).toMatchObject({ raffleConsent: false });
  });

  test('falha no cadastro não trava a pessoa no estande', async ({ page }) => {
    await page.unroute('**/api/participants');
    // Sem `message`, o cliente precisa cair no texto amigável padrão.
    await page.route('**/api/participants', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false }),
      }),
    );

    await page.goto('/quiz');
    await fillRegistration(page);
    await page.getByRole('button', { name: 'Começar o quiz' }).click();

    await expect(page.getByText(/Não conseguimos salvar seu cadastro agora/)).toBeVisible();
    await page.getByRole('button', { name: 'Continuar sem salvar' }).click();
    await expect(page.getByText('Pergunta 1 de 10')).toBeVisible();
  });

  test('o cadastro não vai pela URL', async ({ page }) => {
    const urls: string[] = [];
    page.on('request', (request) => urls.push(request.url()));

    await startQuiz(page, { fullName: 'Joana Segredo', email: 'joana.segredo@example.com' });

    for (const url of urls) {
      expect(url).not.toContain('joana.segredo');
      expect(url).not.toContain('Joana');
    }
  });
});

test.describe('jornada do quiz', () => {
  test('responder as 10 perguntas leva a um resultado válido', async ({ page }) => {
    await completeQuiz(page);
  });

  test('o botão de avançar exige uma escolha e explica o que falta', async ({ page }) => {
    await startQuiz(page);

    await goNext(page);
    await expect(
      page.getByText('Escolha a opção que mais combina com você para continuar.'),
    ).toBeVisible();
    await expect(page.getByText('Pergunta 1 de 10')).toBeVisible();

    await chooseOption(page, 0);
    await goNext(page);
    await expect(page.getByText('Pergunta 2 de 10')).toBeVisible();
  });

  test('voltar preserva a resposta e permite trocá-la', async ({ page }) => {
    await startQuiz(page);

    await chooseOption(page, 1);
    const first = await page.locator('fieldset input[type=radio]:checked').getAttribute('value');
    await goNext(page);

    await expect(page.getByText('Pergunta 2 de 10')).toBeVisible();
    await page.getByRole('button', { name: 'Voltar' }).click();

    await expect(page.getByText('Pergunta 1 de 10')).toBeVisible();
    await expect(page.locator('fieldset input[type=radio]:checked')).toHaveValue(first as string);

    await chooseOption(page, 3);
    const changed = await page.locator('fieldset input[type=radio]:checked').getAttribute('value');
    expect(changed).not.toBe(first);
  });

  test('na primeira pergunta não há para onde voltar', async ({ page }) => {
    await startQuiz(page);
    await expect(page.getByRole('button', { name: 'Voltar' })).toBeDisabled();
  });

  test('recarregar a página recupera o progresso não sensível', async ({ page }) => {
    await startQuiz(page);
    await chooseOption(page, 0);
    await goNext(page);
    await chooseOption(page, 0);
    await goNext(page);
    await expect(page.getByText('Pergunta 3 de 10')).toBeVisible();

    await page.reload();
    await expect(page.getByText('Pergunta 3 de 10')).toBeVisible({ timeout: 10_000 });
  });

  test('recomeçar limpa o progresso e volta ao cadastro', async ({ page }) => {
    await startQuiz(page);
    await chooseOption(page, 0);
    await goNext(page);

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Recomeçar' }).click();

    await expect(
      page.getByRole('heading', { name: 'Antes de começar, se apresente' }),
    ).toBeVisible();
  });

  test('o resultado é anexado ao cadastro no final', async ({ page }) => {
    const sent = await mockRegistration(page);
    await startQuiz(page);
    await answerAll(page);
    await expectResultPage(page);

    const patch = sent.find((payload) => 'resultRole' in payload);
    expect(patch).toBeDefined();
    expect(patch).toMatchObject({ participantId: expect.any(String) });
  });
});

test.describe('página de resultado', () => {
  test('mostra todos os blocos obrigatórios', async ({ page }) => {
    await completeQuiz(page);

    await expect(page.getByText('Na prática, você pode...')).toBeVisible();
    await expect(page.getByText('Formações correlacionadas')).toBeVisible();
    await expect(page.getByText('Talentos diferentes constroem a mesma história')).toBeVisible();
    await expect(
      page.getByText(/Este quiz é uma experiência de descoberta profissional/),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /Refazer o quiz/ })).toBeVisible();
    await expect(
      page.getByText('Rod. Carlos João Strass, 780 — Jardim Tropical').first(),
    ).toBeVisible();
  });

  test('mostra o porquê do resultado e as 10 respostas', async ({ page }) => {
    await completeQuiz(page);

    await expect(page.getByRole('heading', { name: 'Por que esse resultado' })).toBeVisible();
    await expect(page.getByText('Suas 10 respostas')).toBeVisible();

    // Uma linha por pergunta respondida.
    const items = page.locator('#resumo-respostas-titulo ~ * ol > li, ol li');
    await expect(page.getByText(/\d\/8/).first()).toBeVisible();

    // O ranking mostra as cinco áreas.
    for (const area of [
      'Negócios & Logística',
      'Comunicação & Tecnologia',
      'Pessoas, Saúde & Administração',
      'Engenharia, Qualidade & Planejamento',
      'Produção & Operação',
    ]) {
      await expect(page.getByText(area, { exact: true }).first()).toBeVisible();
    }

    expect(await items.count()).toBeGreaterThan(0);
  });

  test('o PDF baixado inclui o resumo das respostas', async ({ page }) => {
    await completeQuiz(page);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: /Baixar meu resultado em PDF/ }).click(),
    ]);

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const body = Buffer.concat(chunks);

    expect(body.subarray(0, 5).toString()).toBe('%PDF-');
    // A versão com respostas é sensivelmente maior que a simples.
    expect(body.length).toBeGreaterThan(11_000);
  });

  test('o banco de talentos leva para o envio de currículo, com o cargo junto', async ({
    page,
  }) => {
    await completeQuiz(page);

    const cta = page.getByRole('link', { name: /Enviar meu currículo/ });
    await expect(cta).toBeVisible();

    const href = await cta.getAttribute('href');
    expect(href).toMatch(/^\/curriculo\?de=[a-z-]+$/);

    await cta.click();

    await expect(page).toHaveURL(/\/curriculo\?de=[a-z-]+$/);
    await expect(page.getByRole('heading', { name: 'Deixe seu currículo com a gente' })).toBeVisible();
    await expect(page.getByText(/Seu resultado no quiz foi/)).toBeVisible();

    // O cargo viaja num campo oculto e uma área de interesse vem pré-marcada.
    await expect(page.locator('input[name="quizResult"]')).toHaveCount(1);
    await expect(page.locator('input[name="interests"]:checked')).toHaveCount(1);

    // Os campos essenciais do CV estão lá.
    await expect(page.getByLabel('Nome completo')).toBeVisible();
    await expect(page.getByLabel('E-mail')).toBeVisible();
    await expect(page.locator('input[type=file]')).toBeVisible();
  });

  test('a página de currículo funciona sem vir do quiz', async ({ page }) => {
    await page.goto('/curriculo');

    await expect(page.getByRole('heading', { name: 'Deixe seu currículo com a gente' })).toBeVisible();
    await expect(page.getByText(/Seu resultado no quiz foi/)).toHaveCount(0);
    await expect(page.locator('input[name="quizResult"]')).toHaveCount(0);
    await expect(page.locator('input[name="interests"]:checked')).toHaveCount(0);
  });

  test('permite baixar o resultado em PDF', async ({ page }) => {
    await completeQuiz(page);

    const link = page.getByRole('link', { name: 'Baixar meu resultado em PDF' });
    await expect(link).toBeVisible();

    const download = await Promise.all([page.waitForEvent('download'), link.click()]).then(
      ([event]) => event,
    );
    expect(download.suggestedFilename()).toMatch(/^meu-resultado-nicopel-[a-z-]+\.pdf$/);
  });

  test('o PDF do resultado é um PDF de verdade', async ({ request }) => {
    const response = await request.get('/api/resultado/marketing/pdf');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/pdf');

    const body = await response.body();
    expect(body.subarray(0, 5).toString()).toBe('%PDF-');
    expect(body.length).toBeGreaterThan(3000);
  });

  test('cargo inexistente no PDF devolve 404', async ({ request }) => {
    expect((await request.get('/api/resultado/nao-existe/pdf')).status()).toBe(404);
  });

  test('refazer o quiz volta ao cadastro', async ({ page }) => {
    await completeQuiz(page);
    await page.getByRole('button', { name: 'Refazer o quiz' }).click();
    await expect(
      page.getByRole('heading', { name: 'Antes de começar, se apresente' }),
    ).toBeVisible();
  });
});
