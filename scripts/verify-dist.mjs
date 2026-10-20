// Checks the built site for things a green build can still get wrong.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const failures = [];
// SITE_BASE is the PR-preview prefix; src/lib/base-links.mjs puts it on links.
const base = (process.env.SITE_BASE || '/').replace(/\/?$/, '/');

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

/** The @type of each node in a JSON-LD @graph, or none when it does not parse. */
function graphTypes(json) {
  try {
    return JSON.parse(json)['@graph'].map((node) => node['@type']);
  } catch {
    return [];
  }
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

// 2. Every page has its own social card, present and the right size.
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
for (const file of htmlFiles(dist)) {
  const html = readFileSync(file, 'utf8');
  // Redirect pages and the 404 page carry no card.
  if (/http-equiv="refresh"/.test(html) || file.endsWith('404.html')) continue;
  const image = html.match(/<meta property="og:image" content="([^"]*)"/)?.[1];
  if (!image) {
    failures.push(`${file} has no og:image`);
    continue;
  }
  const path = join(dist, new URL(image).pathname.slice(base.length));
  if (!existsSync(path)) {
    failures.push(`${file} points og:image at ${image}, which is not in dist/`);
    continue;
  }
  const png = readFileSync(path);
  if (png.length < 24 || !png.subarray(0, 8).equals(pngSignature)) {
    failures.push(`${image} is not a PNG`);
    continue;
  }
  const size = `${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`;
  check(size === '1200x630', `${image} is ${size}, expected 1200x630`);
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
  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  const types = graphTypes(ld);
  check(
    ['SoftwareApplication', 'SoftwareSourceCode', 'Organization', 'Person', 'WebSite'].every(
      (type) => types.includes(type),
    ),
    `landing page JSON-LD must describe the app, its source, maker and site; found ${types}`,
  );
  // The nav menu, the copy button and the interface demo.
  const components = new Set([...html.matchAll(/component-url="([^"]*)"/g)].map((m) => m[1]));
  check(
    components.size === 3,
    `landing page must hydrate exactly three island components, found ${components.size}`,
  );
  const main = html.match(/<main[\s\S]*<\/main>/)?.[0] ?? '';
  check(
    !/[A-Za-z.]<(code|span)[^>]*>\w/.test(main) && !/<\/(code|span)>[A-Za-z]/.test(main),
    'landing copy has words glued to an inline element',
  );
}

// 5. The docs entry point exists, dated as a technical article.
const installPage = join(dist, 'docs', 'getting-started', 'install', 'index.html');
check(existsSync(installPage), 'docs install page is missing');
if (existsSync(installPage)) {
  const html = readFileSync(installPage, 'utf8');
  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  check(graphTypes(ld).includes('TechArticle'), 'docs pages must carry TechArticle JSON-LD');
  check(/"dateModified":"\d{4}-/.test(ld ?? ''), 'docs JSON-LD must have a dateModified');
}

// 6. Every provider guide says which Nearhost it needs and when it was checked.
const guidesDir = join(dist, 'docs', 'guides');
const guides = existsSync(guidesDir)
  ? readdirSync(guidesDir)
      .filter((name) => name.endsWith('-sign-in'))
      .map((name) => join(guidesDir, name, 'index.html'))
      .filter((file) => existsSync(file))
  : [];
check(guides.length > 0, 'no sign-in guides in dist/docs/guides/');
for (const file of guides) {
  const html = readFileSync(file, 'utf8');
  const note = html.match(/<aside aria-label="Checked against"[\s\S]*?<\/aside>/)?.[0] ?? '';
  check(
    /\d{4}-\d{2}-\d{2}/.test(note),
    `${file} must have a "Checked against" note with a YYYY-MM-DD date`,
  );
  check(
    /Needs Nearhost \d+\.\d+\.\d+ or later/.test(html.replace(/<[^>]*>/g, '')),
    `${file} must say "Needs Nearhost X.Y.Z or later"`,
  );
}

// 7. The llms.txt files for AI assistants exist and carry no page chrome.
for (const name of ['llms.txt', 'llms-full.txt', 'llms-small.txt']) {
  const file = join(dist, name);
  check(existsSync(file), `dist/${name} is missing`);
  if (!existsSync(file)) continue;
  const text = readFileSync(file, 'utf8');
  check(/^(<SYSTEM>.*<\/SYSTEM>\s*)?# /.test(text), `dist/${name} must start with a heading`);
  check(!text.includes('Section titled'), `dist/${name} contains heading anchor text`);
}

// 8. Every sitemap entry carries the date its page last changed.
const sitemapFile = join(dist, 'sitemap-0.xml');
check(existsSync(sitemapFile), 'dist/sitemap-0.xml is missing');
if (existsSync(sitemapFile)) {
  const xml = readFileSync(sitemapFile, 'utf8');
  const entries = xml.match(/<url>/g)?.length ?? 0;
  const dated = xml.match(/<lastmod>\d{4}-\d{2}-\d{2}T[^<]*<\/lastmod>/g)?.length ?? 0;
  check(entries > 0, 'dist/sitemap-0.xml has no entries');
  check(dated === entries, `dist/sitemap-0.xml dates ${dated} of ${entries} entries`);
}

// 9. Every internal link in every page resolves to a file in dist/.
// Links are resolved the way a browser would, against the page's own URL on the site's origin.
// Absolute links to the site point at production, which has no base.
const origin = 'https://nearhost.dev';
for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const page = new URL(base + relative(dist, file).split(sep).join('/'), origin);
  const hrefs = new Set(
    [...html.matchAll(/<a\s[^>]*?href=(?:"([^"]*)"|'([^']*)')/gi)].map((m) => m[1] ?? m[2]),
  );
  for (const href of hrefs) {
    if (href.startsWith('#')) continue;
    const absolute = /^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith('//');
    const prefix = absolute ? '/' : base;
    if (!absolute && base !== '/' && href.startsWith('/') && !href.startsWith(base)) {
      failures.push(`${file} links to ${href}, which skips the site base ${base}`);
      continue;
    }
    let path;
    try {
      const url = new URL(href, page);
      // Other schemes and other hosts.
      if (url.origin !== origin) continue;
      if (!url.pathname.startsWith(prefix)) {
        failures.push(`${file} links to ${href}, which is outside the site base ${base}`);
        continue;
      }
      path = decodeURIComponent(url.pathname.slice(prefix.length));
    } catch {
      failures.push(`${file} links to ${href}, which is not a valid URL path`);
      continue;
    }
    const target =
      path === '' || path.endsWith('/') ? join(dist, path, 'index.html') : join(dist, path);
    if (!target.startsWith(dist)) {
      failures.push(`${file} links to ${href}, which is outside dist/`);
    } else if (!existsSync(target)) {
      failures.push(`${file} links to ${href}, which is not in dist/`);
    } else if (statSync(target).isDirectory()) {
      failures.push(`${file} links to ${href}, a directory; end the link with a slash`);
    }
  }
}

if (failures.length) {
  console.error(
    `verify-dist: ${failures.length} failure(s)\n` + failures.map((f) => `  - ${f}`).join('\n'),
  );
  process.exit(1);
}
console.log(`verify-dist: ${pages.length} pages checked, all good`);
