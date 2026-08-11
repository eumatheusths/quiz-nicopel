import { and, asc, eq, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { results } from '@/content/results';
import { event } from '@/content/site-content';
import type { RoleId } from '@/content/types';
import { isAuthenticated } from '@/lib/admin-auth';
import { getDb } from '@/lib/db';
import { adminAuditLog, participants } from '@/lib/schema';
import { logServerEvent } from '@/lib/security';
import { winAnsi } from '@/lib/pdf';
import { formatPhone } from '@/lib/validation';

/**
 * `GET /api/admin/export/pdf` — relatório em PDF dos participantes.
 *
 * Gerado com pdf-lib (JavaScript puro, sem dependência nativa, roda em
 * serverless). Usa Helvetica/WinAnsi, que cobre todos os acentos do português.
 *
 * `?sorteio=1` limita a quem marcou a participação no sorteio.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAGE = { width: 842, height: 595 }; // A4 paisagem
const MARGIN = 36;
const ROW_HEIGHT = 18;
const HEADER_HEIGHT = 22;

const COLUMNS = [
  { label: '#', width: 26 },
  { label: 'Nome completo', width: 168 },
  { label: 'WhatsApp', width: 104 },
  { label: 'E-mail', width: 172 },
  { label: 'Idade', width: 40 },
  { label: 'Sorteio', width: 50 },
  { label: 'Cargo indicado', width: 140 },
  { label: 'Cadastro', width: 70 },
];

const NICOPEL_GREEN = rgb(0.706, 0.827, 0.204);
const INK = rgb(0.08, 0.08, 0.06);
const MUTED = rgb(0.34, 0.35, 0.35);
const LINE = rgb(0.85, 0.86, 0.86);

/** Corta o texto para caber na largura da coluna, com reticências. */
function fit(text: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && font.widthOfTextAtSize(`${cut}...`, size) > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return `${cut}...`;
}

function formatDate(value: Date | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(value);
}

interface HeaderContext {
  bold: PDFFont;
  regular: PDFFont;
  title: string;
  subtitle: string;
  generatedAt: string;
}

function drawPageChrome(page: PDFPage, context: HeaderContext, pageNumber: number): number {
  const { bold, regular, title, subtitle, generatedAt } = context;

  // Faixa superior da marca.
  page.drawRectangle({
    x: 0,
    y: PAGE.height - 8,
    width: PAGE.width,
    height: 8,
    color: NICOPEL_GREEN,
  });

  let y = PAGE.height - MARGIN;

  page.drawText(winAnsi(title), { x: MARGIN, y: y - 12, size: 15, font: bold, color: INK });
  y -= 30;

  page.drawText(winAnsi(subtitle), { x: MARGIN, y: y - 6, size: 9, font: regular, color: MUTED });
  page.drawText(winAnsi(`Gerado em ${generatedAt}  •  página ${pageNumber}`), {
    x: PAGE.width - MARGIN - 200,
    y: y - 6,
    size: 9,
    font: regular,
    color: MUTED,
  });
  y -= 22;

  // Cabeçalho da tabela.
  page.drawRectangle({
    x: MARGIN,
    y: y - HEADER_HEIGHT + 6,
    width: PAGE.width - MARGIN * 2,
    height: HEADER_HEIGHT,
    color: rgb(0.95, 0.96, 0.96),
  });

  let x = MARGIN + 6;
  for (const column of COLUMNS) {
    page.drawText(winAnsi(column.label), {
      x,
      y: y - HEADER_HEIGHT + 13,
      size: 8.5,
      font: bold,
      color: INK,
    });
    x += column.width;
  }

  return y - HEADER_HEIGHT;
}

export async function GET(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ ok: false, message: 'Banco indisponível.' }, { status: 503 });
  }

  const onlyRaffle = new URL(request.url).searchParams.get('sorteio') === '1';

  const filters = [eq(participants.eventCode, event.code), isNull(participants.deletedAt)];
  if (onlyRaffle) filters.push(eq(participants.raffleConsent, true));

  const rows = await db
    .select()
    .from(participants)
    .where(and(...filters))
    .orderBy(asc(participants.createdAt));

  const pdf = await PDFDocument.create();
  pdf.setTitle(`Participantes — ${event.name}`);
  pdf.setAuthor('Nicopel Embalagens');
  pdf.setSubject('Lista de participantes do quiz de carreiras');

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const raffleCount = rows.filter((row) => row.raffleConsent).length;
  const completedCount = rows.filter((row) => row.completedAt !== null).length;

  const context: HeaderContext = {
    bold,
    regular,
    title: onlyRaffle
      ? 'Inscritos no sorteio da visita técnica'
      : 'Participantes do quiz de carreiras',
    subtitle: `${event.name} • ${event.dateLabel} • ${rows.length} pessoa(s) • ${raffleCount} no sorteio • ${completedCount} concluíram o quiz`,
    generatedAt: formatDate(new Date()),
  };

  let pageNumber = 1;
  let page = pdf.addPage([PAGE.width, PAGE.height]);
  let y = drawPageChrome(page, context, pageNumber);

  rows.forEach((row, index) => {
    if (y - ROW_HEIGHT < MARGIN) {
      pageNumber += 1;
      page = pdf.addPage([PAGE.width, PAGE.height]);
      y = drawPageChrome(page, context, pageNumber);
    }

    // Zebra para facilitar a leitura em linhas longas.
    if (index % 2 === 1) {
      page.drawRectangle({
        x: MARGIN,
        y: y - ROW_HEIGHT + 5,
        width: PAGE.width - MARGIN * 2,
        height: ROW_HEIGHT,
        color: rgb(0.975, 0.977, 0.977),
      });
    }

    const roleName = row.resultRole
      ? (results[row.resultRole as RoleId]?.name ?? row.resultRole)
      : '— não concluiu —';

    const cells = [
      String(index + 1),
      row.fullName,
      formatPhone(row.phone),
      row.email,
      String(row.age),
      row.raffleConsent ? 'SIM' : 'não',
      roleName,
      formatDate(row.createdAt),
    ];

    let x = MARGIN + 6;
    cells.forEach((cell, cellIndex) => {
      const column = COLUMNS[cellIndex];
      if (!column) return;
      page.drawText(fit(winAnsi(cell), regular, 8.5, column.width - 8), {
        x,
        y: y - ROW_HEIGHT + 11,
        size: 8.5,
        font: cellIndex === 1 ? bold : regular,
        color: cellIndex === 5 && row.raffleConsent ? rgb(0.36, 0.5, 0.02) : INK,
      });
      x += column.width;
    });

    page.drawLine({
      start: { x: MARGIN, y: y - ROW_HEIGHT + 3 },
      end: { x: PAGE.width - MARGIN, y: y - ROW_HEIGHT + 3 },
      thickness: 0.5,
      color: LINE,
    });

    y -= ROW_HEIGHT;
  });

  if (rows.length === 0) {
    page.drawText(winAnsi('Nenhum participante registrado até agora.'), {
      x: MARGIN + 6,
      y: y - 20,
      size: 10,
      font: regular,
      color: MUTED,
    });
  }

  try {
    await db.insert(adminAuditLog).values({
      action: 'export_pdf',
      detail: `linhas=${rows.length}${onlyRaffle ? ' filtro=sorteio' : ''}`,
    });
  } catch {
    // A auditoria não pode impedir a exportação.
  }

  logServerEvent('admin_export_pdf', { rows: rows.length, raffle: onlyRaffle });

  const bytes = await pdf.save();
  const suffix = onlyRaffle ? '-sorteio' : '';
  const filename = `participantes${suffix}-${event.code}-${new Date().toISOString().slice(0, 10)}.pdf`;

  return new NextResponse(bytes as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store, max-age=0',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
