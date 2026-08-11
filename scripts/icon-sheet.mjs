/**
 * Gera uma folha de contato com todos os ícones, para inspeção visual.
 *
 *   node scripts/icon-sheet.mjs
 *
 * Extrai os paths de `src/components/ui/Icon.tsx`, monta um SVG único e
 * rasteriza em PNG. Serve para revisar o traço dos ícones sem precisar abrir a
 * aplicação inteira. O arquivo gerado não é versionado.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const OUT = process.argv[2] ?? 'icons.png';

const source = readFileSync('src/components/ui/Icon.tsx', 'utf8');
const body = source.slice(source.indexOf('const paths'), source.indexOf('export interface IconProps'));

const entryPattern = /^ {2}('?[a-z-]+'?):\s*\(\s*<>([\s\S]*?)<\/>\s*\),/gm;
const icons = [];
let match;
while ((match = entryPattern.exec(body)) !== null) {
  icons.push({ name: match[1].replace(/'/g, ''), paths: match[2].trim() });
}

const COLS = 6;
const CELL = 120;
const PAD = 14;
const ICON = CELL - PAD * 2;
const rows = Math.ceil(icons.length / COLS);

const cells = icons
  .map((icon, index) => {
    const x = (index % COLS) * CELL + PAD;
    const y = Math.floor(index / COLS) * CELL + PAD;
    return [
      `<g transform="translate(${x},${y})">`,
      `<rect x="-6" y="-6" width="${ICON + 12}" height="${ICON + 12}" fill="none" stroke="#e6e7e8"/>`,
      `<g transform="scale(${ICON / 24})" fill="none" stroke="#141410" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${icon.paths}</g>`,
      `<text x="-6" y="${ICON + 20}" font-family="sans-serif" font-size="10" fill="#56585a">${icon.name}</text>`,
      `</g>`,
    ].join('');
  })
  .join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${COLS * CELL}" height="${rows * CELL + 10}"><rect width="100%" height="100%" fill="#ffffff"/>${cells}</svg>`;

writeFileSync(OUT.replace(/\.png$/, '.svg'), svg);
const info = await sharp(Buffer.from(svg), { density: 200 }).png().toFile(OUT);
console.log(`${icons.length} ícones → ${OUT} (${info.width}x${info.height})`);
