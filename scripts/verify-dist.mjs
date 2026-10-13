// Checks the built site for things a green build can still get wrong.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function filesMatching(dir, extensions) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return filesMatching(path, extensions);
    return extensions.some((ext) => name.endsWith(ext)) ? [path] : [];
  });
}

function htmlFiles(dir) {
  return filesMatching(dir, ['.html']);
}

function textFiles(dir) {
  return filesMatching(dir, ['.html', '.css', '.js', '.mjs', '.json', '.txt', '.xml', '.svg']);
}

check(existsSync(dist), 'verify-dist: dist/ does not exist; run the build first');
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

// 1. Domain and installer ship with the site.
check(existsSync(join(dist, 'CNAME')), 'dist/CNAME is missing');
if (existsSync(join(dist, 'CNAME'))) {
  check(
    readFileSync(join(dist, 'CNAME'), 'utf8').trim() === 'nearhost.dev',
    'dist/CNAME must contain nearhost.dev',
  );
}
check(existsSync(join(dist, 'install.sh')), 'dist/install.sh is missing');
if (existsSync(join(dist, 'install.sh'))) {
  check(
    readFileSync(join(dist, 'install.sh'), 'utf8').startsWith('#!/bin/sh'),
    'install.sh must start with #!/bin/sh',
  );
}

// 2. Social image is present and the right size.
if (existsSync(join(dist, 'og.png'))) {
  const png = readFileSync(join(dist, 'og.png'));
  const isPng = png
    .subarray(0, 8)
    .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  check(isPng, 'og.png is not a PNG');
  if (isPng) {
    if (png.length < 24) {
      failures.push('og.png is truncated');
    } else {
      const width = png.readUInt32BE(16);
      const height = png.readUInt32BE(20);
      check(width === 1200 && height === 630, `og.png is ${width}x${height}, expected 1200x630`);
    }
  }
} else {
  failures.push('dist/og.png is missing');
}

// 3. No third-party font requests anywhere in dist/.
const pages = htmlFiles(dist);
check(pages.length > 0, 'no HTML files in dist/');
for (const file of textFiles(dist)) {
  const text = readFileSync(file, 'utf8');
  check(!/fonts\.(googleapis|gstatic)\.com/.test(text), `${file} references Google Fonts`);
}

// 4. Landing page essentials.
const index = join(dist, 'index.html');
check(existsSync(index), 'dist/index.html is missing');
if (existsSync(index)) {
  const html = readFileSync(index, 'utf8');
  check(
    /Run it anywhere\.\s*<br[^>]*>\s*Open it\s*<span[^>]*>here<\/span>\./.test(html),
    'landing headline is missing or changed',
  );
  check(
    /data-version[^>]*>(v\d+\.\d+\.\d+[^<]*|latest)</.test(html),
    'footer version is neither a tag nor "latest"',
  );
  const islands = (html.match(/astro-island/g) ?? []).length;
  check(islands > 0, 'no islands rendered on the landing page');
}

// 5. The docs entry point exists.
check(
  existsSync(join(dist, 'docs', 'getting-started', 'install', 'index.html')),
  'docs install page is missing',
);

if (failures.length) {
  console.error(
    `verify-dist: ${failures.length} failure(s)\n` + failures.map((f) => `  - ${f}`).join('\n'),
  );
  process.exit(1);
}
console.log(`verify-dist: ${pages.length} pages checked, all good`);
