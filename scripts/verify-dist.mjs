// Checks the built site for things a green build can still get wrong.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith('.html') ? [path] : [];
  });
}

check(existsSync(dist), 'dist/ does not exist; run the build first');
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
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    check(width === 1200 && height === 630, `og.png is ${width}x${height}, expected 1200x630`);
  }
} else {
  failures.push('dist/og.png is missing');
}

// 3. No third-party font requests anywhere.
const pages = htmlFiles(dist);
check(pages.length > 0, 'no HTML files in dist/');
for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  check(!/fonts\.(googleapis|gstatic)\.com/.test(html), `${page} references Google Fonts`);
}

// 4. Landing page essentials.
const index = join(dist, 'index.html');
check(existsSync(index), 'dist/index.html is missing');
if (existsSync(index)) {
  const html = readFileSync(index, 'utf8');
  check(html.includes('Run it anywhere.'), 'landing headline is missing');
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
