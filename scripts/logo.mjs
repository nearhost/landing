// Renders the Nearhost mark as square logo files for avatars and app icons.
// Colours mirror src/styles/tokens.css; geometry mirrors src/components/Mark.astro.
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const out = fileURLToPath(new URL('../brand/', import.meta.url));
const ground = '#0F1210';
const beacon = '#D6F26B';
const text = '#ECEFE8';

// The mark on a 64 unit grid. Its painted box is 47 by 53 units, centred on (32, 35).
const mark = (arch, dot) =>
  `<path d="M14 56V32a18 18 0 0 1 36 0v24" fill="none" stroke="${arch}" stroke-width="11" stroke-linecap="round"/>` +
  `<circle cx="32" cy="48" r="6" fill="${dot}"/>`;

// A full-bleed square. GitHub and most app stores round the corners themselves.
function square(size, background, arch, dot) {
  const scale = (size * 0.56) / 53;
  const x = size / 2 - 32 * scale;
  const y = size / 2 - 35 * scale;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<rect width="${size}" height="${size}" fill="${background}"/>` +
    `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(4)})">${mark(arch, dot)}</g>` +
    `</svg>`
  );
}

const files = {
  'nearhost-logo-dark': square(1024, ground, beacon, text),
  'nearhost-logo-beacon': square(1024, beacon, ground, ground),
};

await mkdir(out, { recursive: true });
for (const [name, svg] of Object.entries(files)) {
  await writeFile(`${out}${name}.svg`, svg + '\n');
  await sharp(Buffer.from(svg)).png().toFile(`${out}${name}.png`);
  await sharp(Buffer.from(svg)).resize(500, 500).png().toFile(`${out}${name}-500.png`);
}

// The bare mark on a transparent background, for use on your own surfaces.
const bare = (arch, dot) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${mark(arch, dot)}</svg>\n`;
await writeFile(`${out}nearhost-mark-on-dark.svg`, bare(beacon, text));
await writeFile(`${out}nearhost-mark-on-light.svg`, bare('#1B1F1C', beacon));

console.log(`wrote logo files to ${out}`);
