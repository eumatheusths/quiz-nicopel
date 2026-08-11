import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { groups } from '@/content/quiz';
import { results } from '@/content/results';
import { company, event, resultUi } from '@/content/site-content';
import { ROLE_IDS, type RoleId } from '@/content/types';
import { fitText, winAnsi, wrapText } from '@/lib/pdf';

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

export async function GET(_request: Request, context: { params: Promise<{ role: string }> }) {
  const { role } = await context.params;

  if (!ROLE_IDS.includes(role as RoleId)) {
    return NextResponse.json({ ok: false, message: 'Resultado não encontrado.' }, { status: 404 });
  }

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

  const bytes = await pdf.save();

  return new NextResponse(bytes as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="meu-resultado-nicopel-${role}.pdf"`,
      // Só depende do cargo: pode ficar em cache tranquilamente.
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
