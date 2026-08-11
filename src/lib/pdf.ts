import type { PDFFont } from 'pdf-lib';

/**
 * Utilidades compartilhadas pelos PDFs do projeto.
 */

/**
 * Deixa o texto seguro para a codificação WinAnsi das fontes padrão.
 *
 * Os acentos do português (á é í ó ú ã õ ç) estão todos em Latin-1 e passam
 * intactos. Trocamos apenas a pontuação tipográfica que fica fora da faixa — e
 * que apareceria como "?" — e descartamos o que sobrar (um emoji em um nome,
 * por exemplo), para o PDF nunca quebrar por um caractere inesperado.
 */
export function winAnsi(text: string): string {
  return text
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/•/g, '·')
    .replace(/…/g, '...')
    .replace(/[^ -ÿ]/g, '');
}

/** Corta o texto para caber na largura disponível, com reticências. */
export function fitText(text: string, font: PDFFont, size: number, maxWidth: number): string {
  const safe = winAnsi(text);
  if (font.widthOfTextAtSize(safe, size) <= maxWidth) return safe;

  let cut = safe;
  while (cut.length > 1 && font.widthOfTextAtSize(`${cut}...`, size) > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return `${cut}...`;
}

/** Quebra o texto em linhas que cabem na largura, respeitando as palavras. */
export function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const words = winAnsi(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }
  if (current) lines.push(current);

  return lines;
}

export function formatDateTimeBR(value: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(value);
}
