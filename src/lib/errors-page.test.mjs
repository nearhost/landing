import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { errorsPage, problems } from './errors-page.mjs';
import { dataPath, formattedPage, pagePath } from '../../scripts/sync-errors.mjs';

const catalog = JSON.parse(readFileSync(dataPath, 'utf8'));
const entry = (fields) => ({ code: 'port.in-use', level: 'error', summary: 'Busy.', ...fields });
const withCodes = (...codes) => ({ docsBase: catalog.docsBase, codes });

test('the catalog has nothing the page cannot show', () => {
  assert.deepEqual(problems(catalog), []);
});

test('the page matches src/data/errors.json; run node scripts/sync-errors.mjs if not', async () => {
  assert.equal(readFileSync(pagePath, 'utf8'), await formattedPage(catalog));
});

test('an entry without a summary fails', () => {
  assert.deepEqual(problems(withCodes(entry({ summary: ' ' }))), ['port.in-use has no summary']);
  assert.throws(() => errorsPage(withCodes(entry({ summary: undefined }))), /no summary/);
});

test('a code listed twice, an unknown level or a new area fails', () => {
  const found = problems(withCodes(entry(), entry({ level: 'fatal' }), entry({ code: 'zebra.x' })));
  assert.ok(found.includes('port.in-use is listed twice'));
  assert.ok(found.includes('port.in-use has an unknown level: fatal'));
  assert.ok(found.some((p) => p.startsWith('zebra.x is in an area the page has no section for')));
});

test('each code is the id of its heading, dots and all', () => {
  const page = errorsPage(withCodes(entry({ code: 'port.needs-permission', status: 403 })));
  assert.match(
    page,
    /^<h3 id="port\.needs-permission"><code>port\.needs-permission<\/code><\/h3>$/m,
  );
  assert.match(page, /^\*\*Error\*\* · status 403$/m);
});

test('a code that is never an API error has no status, and a note is a Note', () => {
  const page = errorsPage(withCodes(entry({ level: 'info' })));
  assert.match(page, /^\*\*Note\*\*$/m);
});

test('steps keep their commands in code blocks', () => {
  const steps = [{ text: 'Start it:', command: 'nearhost -d' }];
  const page = errorsPage(withCodes(entry({ steps })));
  assert.match(page, /\nStart it:\n\n```sh\nnearhost -d\n```\n/);
});

test('text is shown as written, not as Markdown', () => {
  const page = errorsPage(withCodes(entry({ summary: 'Use *this* or <that> [x].' })));
  assert.match(page, /Use \\\*this\\\* or \\<that\\> \\\[x\\\]\./);
});

test('a family has one entry, at its prefix without the dot', () => {
  const family = { prefix: 'advice.', level: 'warning', summary: 'Advice.' };
  const page = errorsPage({ ...withCodes(entry()), families: [family] });
  assert.match(page, /^<h3 id="advice"><code>advice\.&lt;id&gt;<\/code><\/h3>$/m);
});
