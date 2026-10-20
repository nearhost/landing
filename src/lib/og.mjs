// Draws the 1200×630 social card for each page at build time: satori lays the card out as
// SVG and resvg turns it into a PNG. Both are pure JS and WASM, so the build needs no
// native binaries.
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
import satori from 'satori';

const require = createRequire(import.meta.url);

// Hex values mirror src/styles/tokens.css; this module runs in Node and cannot read CSS tokens.
const ground = '#0F1210';
// Between the ground and the line colour, so the backdrop arch stays behind the text.
const shade = '#181C19';
const text = '#ECEFE8';
const muted = '#A4ADA5';
const accent = '#D6F26B';

export const width = 1200;
export const height = 630;

/**
 * Where a page's card is served, from its content entry id: `index` for the landing page,
 * `docs/concepts/discovery` for a docs page.
 * @param {string} id
 */
export const ogPath = (id) => `/og/${id}.png`;

/**
 * The sidebar section a docs page sits in, from its entry id.
 * @param {string} id
 */
export function section(id) {
  const dir = id.split('/')[1] ?? '';
  const words = dir.replaceAll('-', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** @type {Promise<import('satori').SatoriOptions['fonts']> | undefined} */
let fonts;
/** @type {Promise<unknown> | undefined} */
let wasm;

function loadFonts() {
  /** @param {string} file */
  const font = (file) => readFile(require.resolve(`@fontsource/${file}`));
  fonts ??= Promise.all([
    font('space-grotesk/files/space-grotesk-latin-600-normal.woff'),
    font('space-grotesk/files/space-grotesk-latin-700-normal.woff'),
    font('dm-sans/files/dm-sans-latin-400-normal.woff'),
    font('ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff'),
  ]).then(([grotesk600, grotesk700, sans, mono]) => [
    { name: 'Space Grotesk', data: grotesk600, weight: 600, style: 'normal' },
    { name: 'Space Grotesk', data: grotesk700, weight: 700, style: 'normal' },
    { name: 'DM Sans', data: sans, weight: 400, style: 'normal' },
    { name: 'IBM Plex Mono', data: mono, weight: 400, style: 'normal' },
  ]);
  return fonts;
}

function loadWasm() {
  wasm ??= readFile(require.resolve('@resvg/resvg-wasm/index_bg.wasm')).then(initWasm);
  return wasm;
}

// satori takes a React-shaped element tree; building it by hand avoids a JSX transform.
/**
 * @param {string} type
 * @param {Record<string, unknown>} style
 * @param {unknown} [children]
 * @param {Record<string, unknown>} [props]
 */
const el = (type, style, children, props = {}) => ({
  type,
  props: { ...props, style, children },
});

/**
 * The tunnel-arch mark from src/components/Mark.astro, as an image satori can draw.
 * @param {number} size
 * @param {string} arch
 * @param {string} dot
 */
function mark(size, arch, dot) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">` +
    `<path d="M14 56V32a18 18 0 0 1 36 0v24" fill="none" stroke="${arch}" stroke-width="11" stroke-linecap="round"/>` +
    `<circle cx="32" cy="48" r="6" fill="${dot}"/></svg>`;
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  return el('img', {}, undefined, { src, width: size, height: size });
}

/** @param {unknown} [aside] */
const brand = (aside) =>
  el('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, [
    el('div', { display: 'flex', alignItems: 'center', gap: '16px' }, [
      mark(48, accent, text),
      el(
        'span',
        { fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: '38px', letterSpacing: '-1px' },
        'nearhost',
      ),
    ]),
    aside ?? el('span', {}, ''),
  ]);

/**
 * @param {unknown[]} children
 * @param {Record<string, unknown>} [style]
 */
const frame = (children, style = {}) =>
  el(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: `${width}px`,
      height: `${height}px`,
      padding: '72px',
      backgroundColor: ground,
      color: text,
      fontFamily: 'DM Sans',
      position: 'relative',
      ...style,
    },
    children,
  );

// A large faint arch behind the text, cut off by the right edge.
const backdrop = el(
  'div',
  { position: 'absolute', right: '-150px', bottom: '-230px', display: 'flex' },
  [mark(520, shade, ground)],
);

const homeCard = () =>
  frame([
    backdrop,
    brand(),
    el('div', { display: 'flex', flexDirection: 'column' }, [
      el(
        'div',
        {
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Space Grotesk',
          fontWeight: 700,
          fontSize: '96px',
          lineHeight: 1.02,
          letterSpacing: '-3px',
        },
        [
          el('span', {}, 'Run it anywhere.'),
          el('div', { display: 'flex' }, [
            el('span', { whiteSpace: 'pre' }, 'Open it '),
            el('span', { color: accent }, 'here'),
            el('span', {}, '.'),
          ]),
        ],
      ),
      el(
        'span',
        { marginTop: '28px', fontSize: '28px', color: muted },
        'Remote dev servers at https://myapp.test, over the SSH you already have.',
      ),
    ]),
    el(
      'span',
      { fontFamily: 'IBM Plex Mono', fontSize: '24px', color: text },
      '$ curl -fsSL https://nearhost.dev/install.sh | sh',
    ),
  ]);

/**
 * @param {{ id: string, title: string, description?: string }} page
 */
const docsCard = ({ id, title, description }) =>
  frame([
    backdrop,
    brand(el('span', { fontSize: '28px', color: muted }, `Docs · ${section(id)}`)),
    el('div', { display: 'flex', flexDirection: 'column', maxWidth: '880px' }, [
      el(
        'span',
        {
          fontFamily: 'Space Grotesk',
          fontWeight: 700,
          fontSize: title.length > 28 ? '68px' : '84px',
          lineHeight: 1.05,
          letterSpacing: '-2px',
        },
        title,
      ),
      description
        ? el(
            'span',
            { marginTop: '24px', fontSize: '30px', lineHeight: 1.35, color: muted, lineClamp: 3 },
            description,
          )
        : el('span', {}, ''),
    ]),
    el('div', { display: 'flex', fontFamily: 'IBM Plex Mono', fontSize: '24px' }, [
      el('span', { color: accent, whiteSpace: 'pre' }, 'nearhost.dev'),
      el('span', { color: muted }, `/${id}/`),
    ]),
  ]);

/**
 * Renders the card for one page to a PNG.
 * @param {{ id: string, title: string, description?: string }} page
 * @returns {Promise<Buffer>}
 */
export async function renderOg(page) {
  const [loaded] = await Promise.all([loadFonts(), loadWasm()]);
  const tree = page.id === 'index' ? homeCard() : docsCard(page);
  // satori takes ownership of the font data it is given, so each render gets its own copy.
  const own = loaded.map((font) => ({ ...font, data: Buffer.from(font.data) }));
  const svg = await satori(/** @type {any} */ (tree), { width, height, fonts: own });
  return Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng());
}
