// Checks that the built errors page has an anchor for every code in src/data/errors.json, so
// each problem `type` the API sends (https://nearhost.dev/docs/reference/errors/#<code>) lands
// on its entry. Run it after the build.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const catalog = JSON.parse(readFileSync(new URL('src/data/errors.json', root), 'utf8'));
const page = fileURLToPath(new URL('dist/docs/reference/errors/index.html', root));

if (!existsSync(page)) {
  console.error(`check-error-anchors: ${page} does not exist; run the build first`);
  process.exit(1);
}
const html = readFileSync(page, 'utf8');
const ids = new Map();
for (const [, id] of html.matchAll(/\sid="([^"]*)"/g)) ids.set(id, (ids.get(id) ?? 0) + 1);

const failures = [];
const anchors = [
  ...catalog.codes.map((entry) => entry.code),
  // A family, such as advice.<id>, has one entry under its prefix without the dot.
  ...(catalog.families ?? []).map((family) => family.prefix.replace(/\.$/, '')),
];
for (const code of anchors) {
  const url = new URL(`#${code}`, catalog.docsBase);
  const id = decodeURIComponent(url.hash.slice(1));
  if (url.pathname !== '/docs/reference/errors/') failures.push(`${url.href}: not the errors page`);
  else if (id !== code) failures.push(`${url.href}: the anchor is not the code`);
  else if (!ids.has(id)) failures.push(`${url.href}: no element has id="${id}"`);
  else if (ids.get(id) > 1) failures.push(`${url.href}: ${ids.get(id)} elements have id="${id}"`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  console.error(`check-error-anchors: ${failures.length} of ${anchors.length} anchors failed`);
  process.exit(1);
}
console.log(`check-error-anchors: all ${anchors.length} anchors resolve`);
