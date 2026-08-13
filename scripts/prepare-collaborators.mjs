/**
 * Otimiza as fotos dos colaboradores.
 *
 *   node scripts/prepare-collaborators.mjs
 *
 * Lê os originais de `assets-originais/collaborators/` e gera, em
 * `public/collaborators/`, um par WebP + AVIF em retrato 3:4 para cada pessoa.
 * O nome do arquivo de saída é o `id` usado em `src/content/collaborators.ts`.
 *
 * Os originais ficam fora de `public/` e fora do git: são pesados (~1,7 MB
 * cada) e não precisam ser servidos nem versionados.
 */
import { readdir, stat } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import sharp from 'sharp';

const SOURCE = 'assets-originais/collaborators';
const DEST = 'public/collaborators';

/** Retrato 3:4, o mesmo formato do card de resultado. */
const WIDTH = 600;
const HEIGHT = 800;

function kb(bytes) {
  return `${Math.round(bytes / 1024)} KB`;
}

async function main() {
  const files = (await readdir(SOURCE)).filter((file) =>
    /\.(png|jpe?g|webp)$/i.test(file),
  );

  if (files.length === 0) {
    console.log(`Nenhuma foto encontrada em ${SOURCE}.`);
    return;
  }

  for (const file of files) {
    const id = basename(file, extname(file)).toLowerCase();
    const source = join(SOURCE, file);
    const original = await stat(source);

    // `position: 'top'` mantém a cabeça: nas fotos quadradas o corte é na
    // largura (e fica centralizado); nas mais altas, corta o rodapé.
    const base = sharp(source).rotate().resize({
      width: WIDTH,
      height: HEIGHT,
      fit: 'cover',
      position: 'top',
    });

    const webpPath = join(DEST, `${id}.webp`);
    const avifPath = join(DEST, `${id}.avif`);

    await base.clone().webp({ quality: 82, effort: 5 }).toFile(webpPath);
    await base.clone().avif({ quality: 58, effort: 5 }).toFile(avifPath);

    const [webp, avif] = await Promise.all([stat(webpPath), stat(avifPath)]);
    console.log(
      `${file.padEnd(16)} ${kb(original.size).padStart(8)} → ${id}.webp ${kb(webp.size).padStart(7)} · ${id}.avif ${kb(avif.size).padStart(7)}`,
    );
  }

  console.log('\nPronto.');
}

main().catch((error) => {
  console.error('Falha ao preparar as fotos:', error.message);
  process.exit(1);
});
