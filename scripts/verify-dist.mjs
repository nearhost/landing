// Checks the built site for things a green build can still get wrong.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { moves } from '../src/lib/coding-agents-redirect.mjs';

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

/** The nodes of a JSON-LD @graph, or none when it does not parse. */
function graphNodes(json) {
  try {
    const graph = JSON.parse(json)['@graph'];
    return Array.isArray(graph) ? graph : [];
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
  const nodes = graphNodes(ld);
  const types = nodes.map((node) => node['@type']);
  check(
    ['SoftwareApplication', 'SoftwareSourceCode', 'Organization', 'Person', 'WebSite'].every(
      (type) => types.includes(type),
    ),
    `landing page JSON-LD must describe the app, its source, maker and site; found ${types}`,
  );
  check(
    nodes.find((node) => node['@type'] === 'SoftwareApplication')?.name === 'Nearhost',
    'landing page SoftwareApplication must be named Nearhost',
  );
  const faq = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => {
      try {
        return JSON.parse(m[1]);
      } catch {
        return undefined;
      }
    })
    .find((data) => data?.['@type'] === 'FAQPage');
  check(faq?.mainEntity?.length > 0, 'landing page must carry FAQPage JSON-LD with questions');
  // Compare text, not markup, so entities such as &#39; in a heading still match.
  const decode = (text) =>
    text
      .replace(/<[^>]*>/g, '')
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  const headings = [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/g)].map((m) => decode(m[1]).trim());
  for (const question of faq?.mainEntity ?? []) {
    check(headings.includes(question.name), `FAQ "${question.name}" is not on the page`);
  }
  // Both demos hold sample data that must not be quoted as real.
  check(
    /<div class="(?:[^"]*\s)?frame(?:\s[^"]*)?"[^>]*\sdata-nosnippet[\s=>]/.test(html) &&
      /<div class="(?:[^"]*\s)?stage(?:\s[^"]*)?"[^>]*\sdata-nosnippet[\s=>]/.test(html),
    'the interface demo and the agent demo must carry data-nosnippet',
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
  const at = (re) => html.search(re);
  // Each anchor must be found, so a missing one fails rather than passing as -1.
  const order = [/Your browser is on this one\./, /id="agents"/, /id="how"/].map(at);
  check(
    order[0] >= 0 && order[0] < order[1] && order[1] < order[2],
    'the agents section must sit between the problem and the steps',
  );
  check(/<nav[\s\S]*?href="#agents"[\s\S]*?<\/nav>/.test(html), 'the nav must link to #agents');
  check(
    decode(html).includes(
      'A coding agent on that machine can use it too: it asks to add the project, open a preview or show you a plan, and you say yes.',
    ),
    'the hero must mention coding agents',
  );
  const agents = html.match(/<section id="agents"[\s\S]*?<\/section>/)?.[0] ?? '';
  const tabs = [...agents.matchAll(/role="tab"[^>]*aria-controls="agents-(\w+)"/g)].map(
    (m) => m[1],
  );
  const panels = [...agents.matchAll(/role="tabpanel"[^>]*id="agents-(\w+)"/g)].map((m) => m[1]);
  check(
    tabs.length >= 1 && tabs.join() === panels.join(),
    `agent tabs ${tabs} must match panels ${panels}`,
  );
  check(
    !/Claude|Codex|Qwen|Cursor|Gemini|Copilot/.test(
      agents.match(/role="tablist"[\s\S]*?<\/div>/)?.[0] ?? '',
    ),
    'scene selectors must not name an agent',
  );
  check(
    decode(agents).includes('Nothing is added, forwarded or opened until you say yes in Nearhost.'),
    'agents facts copy changed',
  );
  check(
    agents.includes('npx skills add nearhost/nearhost -g'),
    'the skill install command is missing',
  );
  check(tabs.includes('codex'), 'the Codex scene is missing');
  check(tabs.includes('qwen'), 'the Qwen Code scene is missing');
  check(
    decode(agents).includes(
      'An agent on mini wants to show docs/plans/2026-10-28-checkout.md (plan)',
    ) &&
      decode(agents).includes(
        'Nearhost will serve files in /home/ecs/code/myapp, except dotfiles.',
      ),
    'the documents prompt text changed',
  );
  // The Codex and Qwen prompts offer y and n only, as the real ones do.
  const keyLines = [...agents.matchAll(/<span class="key[^>]*>y<\/span>[^\n]*?<\/div>/g)].map(
    (m) => m[0],
  );
  check(
    keyLines.length >= 2 && keyLines.every((line) => !line.includes('esc')),
    'a Codex or Qwen prompt shows an esc key',
  );
  // Every scene's caption link reaches a page, and the heading it names, as section 9 resolves
  // links.
  const tourJson = agents.match(/data-tour="([^"]*)"/)?.[1];
  let tour = [];
  try {
    tour = JSON.parse(decode(tourJson ?? ''));
  } catch {
    failures.push('the agent gallery has no parseable data-tour scene list');
  }
  check(
    tour.length === tabs.length,
    `data-tour lists ${tour.length} scenes for ${tabs.length} tabs`,
  );
  for (const scene of tour) {
    const href = scene.link?.href ?? '';
    const url = new URL(href, new URL(base + 'index.html', 'https://nearhost.dev'));
    const path = decodeURIComponent(url.pathname.slice(base.length));
    const target = join(dist, path, path === '' || path.endsWith('/') ? 'index.html' : '');
    if (
      url.origin !== 'https://nearhost.dev' ||
      !url.pathname.startsWith(base) ||
      !target.startsWith(dist) ||
      !existsSync(target) ||
      statSync(target).isDirectory()
    ) {
      failures.push(`the ${scene.id} scene links to ${href}, which is not in dist/`);
      continue;
    }
    const fragment = decodeURIComponent(url.hash.slice(1));
    check(
      !fragment || readFileSync(target, 'utf8').includes(`id="${fragment}"`),
      `the ${scene.id} scene links to ${href}, but ${relative(dist, target)} has no id="${fragment}"`,
    );
  }
  check(
    decode(agents).includes(
      'An agent on mini wants to open port 5173 on this laptop (browser preview).',
    ),
    'the passthrough prompt text changed',
  );
}

// 5. The docs entry point exists, and every docs page is a dated technical article.
check(
  existsSync(join(dist, 'docs', 'getting-started', 'install', 'index.html')),
  'docs install page is missing',
);
for (const file of htmlFiles(join(dist, 'docs'))) {
  const html = readFileSync(file, 'utf8');
  if (/http-equiv="refresh"/.test(html)) continue;
  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  const article = graphNodes(ld).find((node) => node['@type'] === 'TechArticle');
  check(article, `${file} must carry TechArticle JSON-LD`);
  check(
    /^\d{4}-\d{2}-\d{2}T/.test(article?.dateModified ?? ''),
    `${file} TechArticle must have a dateModified`,
  );
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
  check(
    !text.includes('use-a-coding-agent'),
    `dist/${name} mentions the old coding agent page, which only redirects`,
  );
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
    if (href.startsWith('#')) {
      // A link within the page: its anchor must be on the page.
      let fragment;
      try {
        fragment = decodeURIComponent(href.slice(1));
      } catch {
        failures.push(`${file} links to ${href}, which is not a valid URL fragment`);
        continue;
      }
      if (fragment && !html.includes(`id="${fragment}"`)) {
        failures.push(`${file} links to ${href}, but the page has no #${fragment}`);
      }
      continue;
    }
    const absolute = /^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith('//');
    const prefix = absolute ? '/' : base;
    if (!absolute && base !== '/' && href.startsWith('/') && !href.startsWith(base)) {
      failures.push(`${file} links to ${href}, which skips the site base ${base}`);
      continue;
    }
    let path;
    let fragment;
    try {
      const url = new URL(href, page);
      // Other schemes and other hosts.
      if (url.origin !== origin) continue;
      if (!url.pathname.startsWith(prefix)) {
        failures.push(`${file} links to ${href}, which is outside the site base ${base}`);
        continue;
      }
      path = decodeURIComponent(url.pathname.slice(prefix.length));
      fragment = decodeURIComponent(url.hash.slice(1));
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
    } else if (
      fragment &&
      target.endsWith('.html') &&
      !readFileSync(target, 'utf8').includes(`id="${fragment}"`)
    ) {
      failures.push(`${file} links to ${href}, but the page has no #${fragment}`);
    }
  }
}

// 10. The old coding agent page still sends readers to the right place.
// Every target in the anchor map exists in the build, with its anchor.
const oldPage = join(dist, 'docs/getting-started/use-a-coding-agent/index.html');
for (const [anchor, target] of Object.entries(moves)) {
  const [targetPath, fragment] = target.split('#');
  const label = anchor ? `#${anchor}` : 'no anchor';
  const file = join(dist, targetPath, 'index.html');
  if (!existsSync(file)) {
    failures.push(`old coding agent page: ${label} points at ${target}, which is not in dist/`);
  } else if (fragment && !readFileSync(file, 'utf8').includes(`id="${fragment}"`)) {
    failures.push(
      `old coding agent page: ${label} points at ${target}, but the page has no #${fragment}`,
    );
  }
}
if (!existsSync(oldPage)) {
  failures.push('the old coding agent page is not in dist/');
} else {
  const html = readFileSync(oldPage, 'utf8');
  check(html.includes('noindex'), 'the old coding agent page is missing noindex');
  check(
    html.includes('http-equiv="refresh"'),
    'the old coding agent page is missing its meta refresh',
  );
  check(
    html.includes(`href="${base}docs/coding-agents/"`),
    'the old coding agent page does not link to the overview',
  );
  // The redirect script, inline or bundled, carries the base as a string.
  const scripts = [...html.matchAll(/<script\b([^>]*)>([^<]*)<\/script>/gi)]
    .map(([, attrs, body]) => {
      const src = attrs.match(/\ssrc="([^"]+)"/)?.[1];
      const file = src && join(dist, src.slice(base.length));
      return src ? (file && existsSync(file) ? readFileSync(file, 'utf8') : '') : body;
    })
    .filter((script) => script.includes('location.replace'));
  check(
    scripts.some((script) =>
      new RegExp(`[\`'"]${base.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}[\`'"]`).test(script),
    ),
    'the old coding agent page does not redirect through the site base',
  );
}
// Section 8 fails when the sitemap is missing.
const sitemap = join(dist, 'sitemap-0.xml');
if (existsSync(sitemap)) {
  check(
    !readFileSync(sitemap, 'utf8').includes('use-a-coding-agent'),
    'sitemap-0.xml lists the old coding agent page',
  );
}
// Nothing else links to the old URL.
for (const file of pages) {
  if (file === oldPage) continue;
  const html = readFileSync(file, 'utf8');
  if (/<a\s[^>]*?href=["'][^"']*use-a-coding-agent/i.test(html)) {
    failures.push(`${file} links to the old coding agent page`);
  }
}

if (failures.length) {
  console.error(
    `verify-dist: ${failures.length} failure(s)\n` + failures.map((f) => `  - ${f}`).join('\n'),
  );
  process.exit(1);
}
console.log(`verify-dist: ${pages.length} pages checked, all good`);
