import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { groups } from '@/content/quiz';
import { results } from '@/content/results';
import { company, event, resultUi } from '@/content/site-content';
import { ROLE_IDS, type RoleId } from '@/content/types';
import { tryExplainResult, type ResultExplanation } from '@/lib/explain';
import { fitText, winAnsi, wrapText } from '@/lib/pdf';
import type { AnswerMap } from '@/lib/scoring';

/**
 * `GET /api/resultado/[cargo]/pdf` — lembrança do resultado, para a pessoa
 * salvar ou imprimir.
 *
 * Gerado no servidor de propósito: o pdf-lib no navegador acrescentaria
 * centenas de KB ao bundle de um quiz que precisa abrir rápido em rede de
 * evento. O PDF depende só do cargo (que já está na URL pública) — nenhum dado
 * pessoal entra aqui, então a resposta pode até ser cacheada.
 */

export const runtime = 'nodejs';

export function generateStaticParams() {
  return ROLE_IDS.map((role) => ({ role }));
}

const PAGE = { width: 595.28, height: 841.89 }; // A4 retrato
const MARGIN = 48;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;

const GREEN = rgb(0.706, 0.827, 0.204);
const GREEN_DEEP = rgb(0.49, 0.58, 0.06);
const GREEN_SOFT = rgb(0.949, 0.973, 0.867);
const BLACK = rgb(0, 0, 0);
const INK = rgb(0.078, 0.078, 0.059);
const MUTED = rgb(0.337, 0.345, 0.353);
const HAIRLINE = rgb(0.878, 0.882, 0.886);

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
}

/** Desenha um chip arredondado com o texto centralizado e devolve sua largura. */
function drawChip(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size = 8.5,
): number {
  const label = winAnsi(text);
  const paddingX = 8;
  const width = font.widthOfTextAtSize(label, size) + paddingX * 2;
  const height = 18;

  page.drawRectangle({
    x,
    y: y - height + 5,
    width,
    height,
    color: GREEN_SOFT,
    borderColor: GREEN_DEEP,
    borderWidth: 0.5,
    // `pdf-lib` desenha o raio como um retângulo comum; o visual fica sóbrio.
  });
  page.drawText(label, { x: x + paddingX, y: y - height + 11, size, font, color: GREEN_DEEP });

  return width;
}

/**
 * `POST` do mesmo caminho: aceita `{ answers }` e acrescenta a página com o
 * resumo das respostas. Vai no corpo, e não na URL, para as respostas não
 * ficarem em histórico de navegação nem em log de servidor.
 */
export async function POST(request: Request, context: { params: Promise<{ role: string }> }) {
  let answers: AnswerMap = {};
  try {
    const body = (await request.json()) as { answers?: AnswerMap };
    if (body.answers && typeof body.answers === 'object') answers = body.answers;
  } catch {
    // Corpo inválido: devolve o PDF sem o resumo das respostas.
  }
  return buildResponse(context, answers);
}

export async function GET(_request: Request, context: { params: Promise<{ role: string }> }) {
  return buildResponse(context, null);
}

async function buildResponse(
  context: { params: Promise<{ role: string }> },
  answers: AnswerMap | null,
) {
  const { role } = await context.params;

  if (!ROLE_IDS.includes(role as RoleId)) {
    return NextResponse.json({ ok: false, message: 'Resultado não encontrado.' }, { status: 404 });
  }

  // Só usamos a explicação se ela bater com o cargo pedido.
  const explanation = answers ? tryExplainResult(answers) : null;
  const validExplanation = explanation && explanation.role === role ? explanation : null;

  const result = results[role as RoleId];
  const group = groups[result.group];

  const pdf = await PDFDocument.create();
  pdf.setTitle(`Meu resultado: ${result.name} — Nicopel`);
  pdf.setAuthor('Nicopel Embalagens');
  pdf.setSubject('Quiz de carreiras da Nicopel Embalagens');

  const fonts: Fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  };

  const page = pdf.addPage([PAGE.width, PAGE.height]);

  // ---------------------------------------------------------------- Cabeçalho
  const HEADER_HEIGHT = 150;
  page.drawRectangle({
    x: 0,
    y: PAGE.height - HEADER_HEIGHT,
    width: PAGE.width,
    height: HEADER_HEIGHT,
    color: BLACK,
  });
  page.drawRectangle({
    x: 0,
    y: PAGE.height - HEADER_HEIGHT - 5,
    width: PAGE.width,
    height: 5,
    color: GREEN,
  });

  // Logo branca oficial, sem redesenhar nada.
  try {
    const logoBytes = await readFile(join(process.cwd(), 'public/brand/nicopel-logo-branca.png'));
    const logo = await pdf.embedPng(logoBytes);
    const logoWidth = 108;
    page.drawImage(logo, {
      x: MARGIN,
      y: PAGE.height - 46,
      width: logoWidth,
      height: (logoWidth * logo.height) / logo.width,
    });
  } catch {
    // Sem o arquivo, o PDF sai sem logo em vez de falhar.
  }

  let y = PAGE.height - 78;

  page.drawText(winAnsi(resultUi.eyebrow.toUpperCase()), {
    x: MARGIN,
    y,
    size: 8,
    font: fonts.bold,
    color: GREEN,
  });
  y -= 26;

  page.drawText(fitText(result.name, fonts.bold, 24, CONTENT_WIDTH), {
    x: MARGIN,
    y,
    size: 24,
    font: fonts.bold,
    color: rgb(1, 1, 1),
  });
  y -= 18;

  page.drawText(fitText(result.headline, fonts.regular, 11, CONTENT_WIDTH), {
    x: MARGIN,
    y,
    size: 11,
    font: fonts.regular,
    color: rgb(1, 1, 1),
  });

  // ------------------------------------------------------------------- Corpo
  y = PAGE.height - HEADER_HEIGHT - 34;

  page.drawText(winAnsi(group.name.toUpperCase()), {
    x: MARGIN,
    y,
    size: 8,
    font: fonts.bold,
    color: GREEN_DEEP,
  });
  y -= 20;

  for (const line of wrapText(result.summary, fonts.regular, 10.5, CONTENT_WIDTH)) {
    page.drawText(line, { x: MARGIN, y, size: 10.5, font: fonts.regular, color: INK });
    y -= 15;
  }
  y -= 14;

  // Habilidades em chips, quebrando linha quando necessário.
  page.drawText(winAnsi(resultUi.skillsTitle.toUpperCase()), {
    x: MARGIN,
    y,
    size: 8,
    font: fonts.bold,
    color: MUTED,
  });
  y -= 22;

  let chipX = MARGIN;
  for (const skill of result.skills) {
    const width = fonts.regular.widthOfTextAtSize(winAnsi(skill), 8.5) + 16;
    if (chipX + width > MARGIN + CONTENT_WIDTH) {
      chipX = MARGIN;
      y -= 24;
    }
    chipX += drawChip(page, skill, chipX, y, fonts.regular) + 6;
  }
  y -= 34;

  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: MARGIN + CONTENT_WIDTH, y },
    thickness: 0.75,
    color: HAIRLINE,
  });
  y -= 26;

  // Na prática
  page.drawText(winAnsi(resultUi.inPracticeTitle), {
    x: MARGIN,
    y,
    size: 12,
    font: fonts.bold,
    color: INK,
  });
  y -= 20;

  for (const item of result.inPractice) {
    page.drawText('·', { x: MARGIN + 2, y, size: 11, font: fonts.bold, color: GREEN_DEEP });
    const lines = wrapText(item, fonts.regular, 10, CONTENT_WIDTH - 16);
    for (const [index, line] of lines.entries()) {
      page.drawText(line, {
        x: MARGIN + 14,
        y: y - index * 13,
        size: 10,
        font: fonts.regular,
        color: INK,
      });
    }
    y -= lines.length * 13 + 6;
  }
  y -= 14;

  // Formações
  page.drawText(winAnsi(resultUi.educationTitle.toUpperCase()), {
    x: MARGIN,
    y,
    size: 8,
    font: fonts.bold,
    color: MUTED,
  });
  y -= 16;

  for (const line of wrapText(result.education.join(' · '), fonts.regular, 10, CONTENT_WIDTH)) {
    page.drawText(line, { x: MARGIN, y, size: 10, font: fonts.regular, color: MUTED });
    y -= 14;
  }

  // -------------------------------------------------------------------- Aviso
  const noticeLines = wrapText(resultUi.disclaimer, fonts.regular, 8.5, CONTENT_WIDTH - 24);
  const noticeHeight = noticeLines.length * 12 + 20;
  const noticeY = MARGIN + 92;

  page.drawRectangle({
    x: MARGIN,
    y: noticeY - noticeHeight + 12,
    width: CONTENT_WIDTH,
    height: noticeHeight,
    color: rgb(0.965, 0.969, 0.969),
  });
  noticeLines.forEach((line, index) => {
    page.drawText(line, {
      x: MARGIN + 12,
      y: noticeY - index * 12,
      size: 8.5,
      font: fonts.regular,
      color: MUTED,
    });
  });

  // -------------------------------------------------------------------- Rodapé
  page.drawLine({
    start: { x: MARGIN, y: MARGIN + 58 },
    end: { x: MARGIN + CONTENT_WIDTH, y: MARGIN + 58 },
    thickness: 0.75,
    color: HAIRLINE,
  });

  page.drawText(winAnsi(company.name), {
    x: MARGIN,
    y: MARGIN + 40,
    size: 9,
    font: fonts.bold,
    color: INK,
  });
  page.drawText(winAnsi(company.address.full), {
    x: MARGIN,
    y: MARGIN + 27,
    size: 8.5,
    font: fonts.regular,
    color: MUTED,
  });
  page.drawText(winAnsi(`${company.site}  ·  ${event.shortLabel}`), {
    x: MARGIN,
    y: MARGIN + 14,
    size: 8.5,
    font: fonts.regular,
    color: MUTED,
  });

  page.drawRectangle({ x: 0, y: 0, width: PAGE.width, height: 6, color: GREEN });

  // ------------------------------------------- Página 2: por que esse resultado
  if (validExplanation) {
    drawAnswersPage(pdf, fonts, validExplanation);
  }

  const bytes = await pdf.save();

  return new NextResponse(bytes as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="meu-resultado-nicopel-${role}.pdf"`,
      // Sem respostas, o PDF depende só do cargo e pode ser cacheado. Com
      // respostas, ele é individual e não pode ficar em cache nenhum.
      'Cache-Control': validExplanation
        ? 'no-store, max-age=0'
        : 'public, max-age=3600, s-maxage=86400',
    },
  });
}

/**
 * Segunda página: o "porquê" do cargo e o mapa das 10 respostas.
 *
 * Quebra em novas páginas sozinha quando o conteúdo passa do rodapé, então
 * respostas longas nunca são cortadas.
 */
function drawAnswersPage(
  pdf: PDFDocument,
  fonts: Fonts,
  explanation: ResultExplanation,
): void {
  let page = pdf.addPage([PAGE.width, PAGE.height]);
  page.drawRectangle({ x: 0, y: PAGE.height - 5, width: PAGE.width, height: 5, color: GREEN });

  let y = PAGE.height - MARGIN - 10;

  page.drawText(winAnsi('Por que esse resultado'), {
    x: MARGIN,
    y,
    size: 16,
    font: fonts.bold,
    color: INK,
  });
  y -= 24;

  for (const line of wrapText(explanation.reason, fonts.regular, 10, CONTENT_WIDTH)) {
    page.drawText(line, { x: MARGIN, y, size: 10, font: fonts.regular, color: INK });
    y -= 14;
  }
  y -= 16;

  // Ranking das áreas, com barra proporcional.
  page.drawText(winAnsi('SUAS ESCOLHAS POR AREA'), {
    x: MARGIN,
    y,
    size: 8,
    font: fonts.bold,
    color: MUTED,
  });
  y -= 18;

  const maxScore = Math.max(...explanation.ranking.map((entry) => entry.score), 1);
  const barX = MARGIN + 190;
  const barWidth = CONTENT_WIDTH - 190 - 34;

  for (const entry of explanation.ranking) {
    const isWinner = entry.group === explanation.group;

    page.drawText(fitText(entry.name, isWinner ? fonts.bold : fonts.regular, 9, 180), {
      x: MARGIN,
      y,
      size: 9,
      font: isWinner ? fonts.bold : fonts.regular,
      color: isWinner ? INK : MUTED,
    });

    page.drawRectangle({
      x: barX,
      y: y - 1,
      width: barWidth,
      height: 8,
      color: rgb(0.902, 0.906, 0.909),
    });
    if (entry.score > 0) {
      page.drawRectangle({
        x: barX,
        y: y - 1,
        width: (barWidth * entry.score) / maxScore,
        height: 8,
        color: isWinner ? GREEN : rgb(0.72, 0.73, 0.74),
      });
    }

    page.drawText(`${entry.score}/8`, {
      x: barX + barWidth + 8,
      y,
      size: 8.5,
      font: isWinner ? fonts.bold : fonts.regular,
      color: isWinner ? GREEN_DEEP : MUTED,
    });

    y -= 17;
  }

  y -= 14;
  page.drawText(winAnsi('SUAS 10 RESPOSTAS'), {
    x: MARGIN,
    y,
    size: 8,
    font: fonts.bold,
    color: MUTED,
  });
  y -= 20;

  for (const step of explanation.steps) {
    const promptLines = wrapText(step.prompt, fonts.regular, 8, CONTENT_WIDTH - 26);
    const answerLines = wrapText(step.answer, fonts.bold, 9.5, CONTENT_WIDTH - 26);
    const blockHeight = promptLines.length * 10 + answerLines.length * 12 + 14;

    if (y - blockHeight < MARGIN + 20) {
      page = pdf.addPage([PAGE.width, PAGE.height]);
      page.drawRectangle({ x: 0, y: PAGE.height - 5, width: PAGE.width, height: 5, color: GREEN });
      y = PAGE.height - MARGIN - 10;
    }

    // Número da pergunta em um selo escuro.
    page.drawRectangle({ x: MARGIN, y: y - 9, width: 18, height: 18, color: BLACK });
    const numberLabel = String(step.number);
    page.drawText(numberLabel, {
      x: MARGIN + 9 - fonts.bold.widthOfTextAtSize(numberLabel, 8) / 2,
      y: y - 3,
      size: 8,
      font: fonts.bold,
      color: GREEN,
    });

    let blockY = y;
    for (const line of promptLines) {
      page.drawText(line, { x: MARGIN + 26, y: blockY, size: 8, font: fonts.regular, color: MUTED });
      blockY -= 10;
    }
    for (const line of answerLines) {
      page.drawText(line, { x: MARGIN + 26, y: blockY, size: 9.5, font: fonts.bold, color: INK });
      blockY -= 12;
    }

    page.drawText(winAnsi(`${step.insight}  ->  ${step.target}`), {
      x: MARGIN + 26,
      y: blockY,
      size: 8,
      font: fonts.regular,
      color: GREEN_DEEP,
    });

    y = blockY - 16;
  }

  // Aviso final, no pé da última página.
  const noticeLines = wrapText(resultUi.disclaimer, fonts.regular, 7.5, CONTENT_WIDTH);
  let noticeY = Math.max(y - 6, MARGIN + noticeLines.length * 10);
  for (const line of noticeLines) {
    page.drawText(line, { x: MARGIN, y: noticeY, size: 7.5, font: fonts.regular, color: MUTED });
    noticeY -= 10;
  }
}
