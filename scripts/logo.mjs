// Renders the Nearhost mark as square logo files for avatars and app icons.
// Colours mirror src/styles/tokens.css; geometry mirrors src/components/Mark.astro.
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const out = fileURLToPath(new URL('../brand/', import.meta.url));
const surface = '#19171C';
const accent = '#FF70C8';
const accentInk = '#111013';
const text = '#F4EEF2';
const ink = '#1E1820';
const accentOnLight = '#B0156C';

// The prompt mark on a 64 unit grid: a chevron and a dot. Its painted box is 44.5 by 38 units,
// centred on (31.25, 32).
const mark = (chevron, dot) =>
  `<path d="M13 17l15 15-15 15" fill="none" stroke="${chevron}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<circle cx="46" cy="44" r="7.5" fill="${dot}"/>`;

// A full-bleed square. GitHub and most app stores round the corners themselves.
function square(size, background, chevron, dot) {
  const scale = (size * 0.56) / 44.5;
  const x = size / 2 - 31.25 * scale;
  const y = size / 2 - 32 * scale;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<rect width="${size}" height="${size}" fill="${background}"/>` +
    `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(4)})">${mark(chevron, dot)}</g>` +
    `</svg>`
  );
}

const files = {
  'nearhost-logo-dark': square(1024, surface, accent, text),
  'nearhost-logo-beacon': square(1024, accent, accentInk, accentInk),
};

await mkdir(out, { recursive: true });
for (const [name, svg] of Object.entries(files)) {
  await writeFile(`${out}${name}.svg`, svg + '\n');
  await sharp(Buffer.from(svg)).png().toFile(`${out}${name}.png`);
  await sharp(Buffer.from(svg)).resize(500, 500).png().toFile(`${out}${name}-500.png`);
}

// The bare mark on a transparent background, for use on your own surfaces.
const bare = (chevron, dot) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${mark(chevron, dot)}</svg>\n`;
await writeFile(`${out}nearhost-mark-on-dark.svg`, bare(accent, text));
await writeFile(`${out}nearhost-mark-on-light.svg`, bare(ink, accentOnLight));

console.log(`wrote logo files to ${out}`);
