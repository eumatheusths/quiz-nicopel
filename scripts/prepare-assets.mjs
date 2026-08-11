/**
 * Otimiza as imagens originais da Nicopel para o quiz.
 *
 *   node scripts/prepare-assets.mjs
 *
 * Lê os arquivos originais do site institucional e gera versões WebP e AVIF em
 * tamanhos adequados para celular. Só precisa ser rodado de novo quando alguma
 * foto original mudar — os resultados ficam versionados em `public/`.
 */
import { mkdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const SOURCE_ROOT = resolve(
  process.env.NICOPEL_ASSETS ?? 'C:/Users/Nicopel-Marketing/Desktop/nicopel-site-main',
);

/** origem → destino (sem extensão) + largura máxima. */
const IMAGES = [
  { from: 'src/assets/fachada-nicopel.jpg', to: 'public/factory/fachada', width: 1600 },
  { from: 'src/assets/equipe.jpg', to: 'public/factory/equipe', width: 1600 },
  { from: 'src/assets/embalagens-todas.png', to: 'public/factory/produtos', width: 1600 },
  { from: 'src/assets/historia-2000.jpg', to: 'public/factory/historia-2000', width: 900 },
];

/** Logos: mantidos em PNG para preservar transparência e nitidez. */
const LOGOS = [
  { from: 'src/assets/logo nicopel preto.png', to: 'public/brand/nicopel-logo.png' },
  { from: 'src/assets/logo-nicopel.png', to: 'public/brand/nicopel-logo-branca.png' },
];

function kb(bytes) {
  return `${Math.round(bytes / 1024)} KB`;
}

async function ensureDir(path) {
  await mkdir(dirname(path), { recursive: true });
}

async function convertImage({ from, to, width }) {
  const source = resolve(SOURCE_ROOT, from);
  const original = await stat(source);
  await ensureDir(resolve(to));

  const base = sharp(source).rotate().resize({ width, withoutEnlargement: true });

  const webpPath = `${to}.webp`;
  const avifPath = `${to}.avif`;

  await base.clone().webp({ quality: 80, effort: 5 }).toFile(webpPath);
  await base.clone().avif({ quality: 55, effort: 5 }).toFile(avifPath);

  const [webp, avif] = await Promise.all([stat(webpPath), stat(avifPath)]);
  console.log(
    `${from}\n  original ${kb(original.size)} → webp ${kb(webp.size)} · avif ${kb(avif.size)}`,
  );
}

async function copyLogo({ from, to }) {
  const source = resolve(SOURCE_ROOT, from);
  await ensureDir(resolve(to));
  // `trim` remove a margem transparente para o logo encostar na baseline do texto.
  await sharp(source).trim().png({ compressionLevel: 9 }).toFile(to);
  const output = await stat(to);
  console.log(`${from}\n  → ${to} (${kb(output.size)})`);
}

async function main() {
  console.log(`Origem: ${SOURCE_ROOT}\n`);
  for (const image of IMAGES) await convertImage(image);
  for (const logo of LOGOS) await copyLogo(logo);
  console.log('\nPronto.');
}

main().catch((error) => {
  console.error('Falha ao preparar assets:', error.message);
  process.exit(1);
});
