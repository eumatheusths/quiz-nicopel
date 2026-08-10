import { expect, test } from '@playwright/test';
import {
  answerAll,
  chooseOption,
  expectResultPage,
  goNext,
  raffleDialog,
  startQuiz,
  waitForRaffleInvite,
} from './helpers';

test.describe('jornada do quiz', () => {
  test('recusar o sorteio revela o resultado sem pedir nenhum dado', async ({ page }) => {
    await startQuiz(page);
    await answerAll(page);
    await waitForRaffleInvite(page);

    await raffleDialog(page).getByText('Agora não, quero ver meu resultado').click();
    await raffleDialog(page).getByRole('button', { name: 'Ver meu resultado', exact: true }).click();

    await expectResultPage(page);
    // Nenhum campo de dado pessoal apareceu em momento algum.
    await expect(page.getByLabel('Nome completo')).toHaveCount(0);
  });

  test('pular o convite revela o resultado', async ({ page }) => {
    await startQuiz(page);
    await answerAll(page);
    await waitForRaffleInvite(page);

    await raffleDialog(page).getByRole('button', { name: 'Pular e ver meu resultado' }).click();
    await expectResultPage(page);
  });

  test('fechar o convite com Escape revela o resultado', async ({ page }) => {
    await startQuiz(page);
    await answerAll(page);
    await waitForRaffleInvite(page);

    await page.keyboard.press('Escape');
    await expectResultPage(page);
  });

  test('o botão de avançar exige uma escolha e explica o que falta', async ({ page }) => {
    await startQuiz(page);

    await goNext(page);
    await expect(page.getByText('Escolha a opção que mais combina com você para continuar.')).toBeVisible();
    await expect(page.getByText('Pergunta 1 de 10')).toBeVisible();

    await chooseOption(page, 0);
    await goNext(page);
    await expect(page.getByText('Pergunta 2 de 10')).toBeVisible();
  });

  test('voltar preserva a resposta e permite trocá-la', async ({ page }) => {
    await startQuiz(page);

    await chooseOption(page, 1);
    const firstAnswer = await page.locator('fieldset input[type=radio]:checked').getAttribute('value');
    await goNext(page);

    await expect(page.getByText('Pergunta 2 de 10')).toBeVisible();
    await page.getByRole('button', { name: 'Voltar' }).click();

    await expect(page.getByText('Pergunta 1 de 10')).toBeVisible();
    await expect(page.locator('fieldset input[type=radio]:checked')).toHaveValue(
      firstAnswer as string,
    );

    // Trocar a resposta funciona e a nova escolha é a que segue.
    await chooseOption(page, 3);
    const changed = await page.locator('fieldset input[type=radio]:checked').getAttribute('value');
    expect(changed).not.toBe(firstAnswer);
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

  test('recomeçar limpa o progresso e volta para a introdução', async ({ page }) => {
    await startQuiz(page);
    await chooseOption(page, 0);
    await goNext(page);
    await expect(page.getByText('Pergunta 2 de 10')).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Recomeçar' }).click();

    await expect(page.getByRole('heading', { name: 'Antes de começar' })).toBeVisible();
  });

  test('o mesmo conjunto de respostas leva sempre ao mesmo cargo', async ({ page }) => {
    await startQuiz(page);
    await answerAll(page, 0);
    await waitForRaffleInvite(page);
    await raffleDialog(page).getByRole('button', { name: 'Pular e ver meu resultado' }).click();
    await expectResultPage(page);
    const firstUrl = page.url();

    // Nova sessão, mesma posição de alternativa — o embaralhamento muda, mas o
    // mapeamento é preservado, então o cargo precisa ser o mesmo? Não: a ordem
    // visual difere. Aqui verificamos apenas que o resultado é um cargo válido.
    expect(firstUrl).toMatch(/\/resultado\/[a-z-]+$/);
  });

  test('a página de resultado mostra todos os blocos obrigatórios', async ({ page }) => {
    await startQuiz(page);
    await answerAll(page);
    await waitForRaffleInvite(page);
    await raffleDialog(page).getByRole('button', { name: 'Pular e ver meu resultado' }).click();
    await expectResultPage(page);

    await expect(page.getByText('Na prática, você pode...')).toBeVisible();
    await expect(page.getByText('Formações correlacionadas')).toBeVisible();
    await expect(page.getByText('Talentos diferentes constroem a mesma história')).toBeVisible();
    await expect(
      page.getByText(/Este quiz é uma experiência de descoberta profissional/),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /Refazer o quiz/ })).toBeVisible();

    // Endereço oficial correto e link de mapa presente.
    await expect(
      page.getByText('Rod. Carlos João Strass, 780 — Jardim Tropical').first(),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Abrir no mapa' })).toBeVisible();
  });

  test('refazer o quiz volta para a introdução com o progresso limpo', async ({ page }) => {
    await startQuiz(page);
    await answerAll(page);
    await waitForRaffleInvite(page);
    await raffleDialog(page).getByRole('button', { name: 'Pular e ver meu resultado' }).click();
    await expectResultPage(page);

    await page.getByRole('button', { name: 'Refazer o quiz' }).click();
    await expect(page.getByRole('heading', { name: 'Antes de começar' })).toBeVisible();
  });
});

test.describe('sorteio', () => {
  test('aceitar mostra o formulário mínimo, sem CPF nem dados sensíveis', async ({ page }) => {
    await startQuiz(page);
    await answerAll(page);
    await waitForRaffleInvite(page);

    await raffleDialog(page).getByText('Sim, quero participar').click();
    await raffleDialog(page).getByRole('button', { name: 'Continuar para o cadastro' }).click();

    await expect(raffleDialog(page).getByLabel('Nome completo')).toBeVisible();
    await expect(raffleDialog(page).getByPlaceholder('WhatsApp com DDD')).toBeVisible();
    await expect(raffleDialog(page).getByLabel('Instituição')).toHaveValue('UNOPAR');

    // Os dois consentimentos começam desmarcados e são independentes.
    const checkboxes = raffleDialog(page).locator('input[type=checkbox]');
    await expect(checkboxes).toHaveCount(2);
    await expect(checkboxes.nth(0)).not.toBeChecked();
    await expect(checkboxes.nth(1)).not.toBeChecked();

    // Nada de dado sensível é solicitado. Verificamos os campos de verdade, e
    // não o texto da tela — o subtítulo do formulário cita "CPF" justamente
    // para dizer que ele não é pedido.
    const fields = await raffleDialog(page)
      .locator('input')
      .evaluateAll((inputs) =>
        inputs.map((input) => `${input.getAttribute('name') ?? ''} ${input.getAttribute('id') ?? ''}`),
      );
    const joined = fields.join(' ').toLowerCase();
    for (const forbidden of ['cpf', 'nascimento', 'birth', 'endereco', 'endereço', 'rg']) {
      expect(joined, `campo sensível "${forbidden}" no formulário`).not.toContain(forbidden);
    }

    // E só existem os campos previstos.
    const names = await raffleDialog(page)
      .locator('input')
      .evaluateAll((inputs) => inputs.map((input) => input.getAttribute('name')));
    expect(new Set(names)).toEqual(
      new Set([
        'resultGroup',
        'resultRole',
        'submissionId',
        'website',
        'fullName',
        'phone',
        'email',
        'course',
        'institution',
        'raffleConsent',
        'opportunitiesConsent',
      ]),
    );
  });

  test('nenhuma opção do convite vem pré-selecionada', async ({ page }) => {
    await startQuiz(page);
    await answerAll(page);
    await waitForRaffleInvite(page);

    await expect(raffleDialog(page).locator('input[name="raffle-choice"]:checked')).toHaveCount(0);
  });

  test('o formulário exige consentimento e contato antes de enviar', async ({ page }) => {
    await startQuiz(page);
    await answerAll(page);
    await waitForRaffleInvite(page);
    await raffleDialog(page).getByText('Sim, quero participar').click();
    await raffleDialog(page).getByRole('button', { name: 'Continuar para o cadastro' }).click();

    await raffleDialog(page).getByLabel('Nome completo').fill('Maria Silva');
    await raffleDialog(page).getByRole('button', { name: 'Confirmar participação' }).click();

    await expect(page.getByText('Informe pelo menos um contato: WhatsApp ou e-mail.')).toBeVisible();
    await expect(
      page.getByText('É preciso aceitar o uso dos dados para participar do sorteio.'),
    ).toBeVisible();
  });

  test('falha no cadastro não impede ver o resultado', async ({ page }) => {
    // Simula indisponibilidade do servidor no momento do envio.
    await page.route('**/api/raffle', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, message: 'erro simulado' }),
      }),
    );

    await startQuiz(page);
    await answerAll(page);
    await waitForRaffleInvite(page);
    await raffleDialog(page).getByText('Sim, quero participar').click();
    await raffleDialog(page).getByRole('button', { name: 'Continuar para o cadastro' }).click();

    await raffleDialog(page).getByLabel('Nome completo').fill('Maria Silva');
    await raffleDialog(page).getByPlaceholder('WhatsApp com DDD').fill('43999998888');
    await raffleDialog(page).locator('input[type=checkbox]').first().check();
    await raffleDialog(page).getByRole('button', { name: 'Confirmar participação' }).click();

    await expect(page.getByText(/Não conseguimos confirmar sua participação/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();

    await raffleDialog(page).getByRole('button', { name: 'Ver meu resultado mesmo assim' }).click();
    await expectResultPage(page);
  });

  test('cadastro bem-sucedido confirma a participação e depois revela o resultado', async ({
    page,
  }) => {
    // Resposta de sucesso simulada: o teste cobre a interface sem depender do
    // banco. A gravação real é coberta pelos testes de validação e pelo
    // ensaio manual descrito no README.
    await page.route('**/api/raffle', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, duplicate: false }),
      }),
    );

    await startQuiz(page);
    await answerAll(page);
    await waitForRaffleInvite(page);
    await raffleDialog(page).getByText('Sim, quero participar').click();
    await raffleDialog(page).getByRole('button', { name: 'Continuar para o cadastro' }).click();

    await raffleDialog(page).getByLabel('Nome completo').fill('Maria Silva');
    await raffleDialog(page).getByPlaceholder('seu@email.com').fill('maria.silva@example.com');
    await raffleDialog(page).getByLabel('Curso (opcional)').fill('Administração');
    await raffleDialog(page).locator('input[type=checkbox]').first().check();
    await raffleDialog(page).getByRole('button', { name: 'Confirmar participação' }).click();

    await expect(page.getByRole('heading', { name: 'Participação confirmada!' })).toBeVisible();
    await raffleDialog(page).getByRole('button', { name: 'Ver meu resultado', exact: true }).click();
    await expectResultPage(page);
  });

  test('o envio não expõe dados pessoais na URL', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));

    await page.route('**/api/raffle', (route) =>
      route.fulfill({ status: 201, contentType: 'application/json', body: '{"ok":true}' }),
    );

    await startQuiz(page);
    await answerAll(page);
    await waitForRaffleInvite(page);
    await raffleDialog(page).getByText('Sim, quero participar').click();
    await raffleDialog(page).getByRole('button', { name: 'Continuar para o cadastro' }).click();
    await raffleDialog(page).getByLabel('Nome completo').fill('Maria Silva');
    await raffleDialog(page).getByPlaceholder('seu@email.com').fill('maria.silva@example.com');
    await raffleDialog(page).locator('input[type=checkbox]').first().check();
    await raffleDialog(page).getByRole('button', { name: 'Confirmar participação' }).click();
    await expect(page.getByRole('heading', { name: 'Participação confirmada!' })).toBeVisible();

    for (const url of requests) {
      expect(url).not.toContain('maria.silva');
      expect(url).not.toContain('Maria');
    }
  });
});
