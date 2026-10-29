import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { docsIndex, sidebarGroups } from './docs-index.mjs';
import { siteUrl } from './markdown-twin.mjs';

const fixtures = [];
after(() => fixtures.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function contentWith(pages) {
  const dir = mkdtempSync(join(tmpdir(), 'docs-index-'));
  fixtures.push(dir);
  for (const group of sidebarGroups) mkdirSync(join(dir, group.directory), { recursive: true });
  for (const [path, frontmatter] of Object.entries(pages)) {
    writeFileSync(join(dir, path), `---\n${frontmatter}\n---\n\nBody.\n`);
  }
  return dir;
}

const links = (index) => index.split('\n').filter((line) => line.startsWith('- ['));

test('orders pages the way the sidebar does', () => {
  const dir = contentWith({
    'docs/coding-agents/zeta.md': 'title: Zeta\nsidebar:\n  order: 1',
    'docs/coding-agents/index.md': 'title: Overview\nsidebar:\n  order: 0',
    'docs/coding-agents/unordered.md': 'title: Unordered',
    'docs/coding-agents/beta.md': 'title: Beta\nsidebar:\n  order: 2',
    'docs/coding-agents/alpha.md': 'title: Alpha\nsidebar:\n  order: 2',
  });
  const urls = links(docsIndex(dir, 'https://x.test/')).map((line) => line.match(/\((.*?)\)/)[1]);
  assert.deepEqual(urls, [
    'https://x.test/docs/coding-agents.md',
    'https://x.test/docs/coding-agents/zeta.md',
    'https://x.test/docs/coding-agents/alpha.md',
    'https://x.test/docs/coding-agents/beta.md',
    'https://x.test/docs/coding-agents/unordered.md',
  ]);
});

test('writes one line per page', () => {
  const dir = contentWith({
    'docs/guides/a.md': 'title: "Fix it: the guide"\ndescription: Does a thing.',
  });
  const index = docsIndex(dir, 'https://x.test/');
  assert.ok(
    index.includes(
      '## Guides\n\n- [Fix it: the guide](https://x.test/docs/guides/a.md): Does a thing.',
    ),
  );
});

test('uses the site URL', () => {
  const dir = contentWith({ 'docs/reference/a.md': 'title: A\ndescription: B' });
  const site = 'https://nearhost.dev/pr-preview/pr-1/';
  for (const line of links(docsIndex(dir, site))) assert.ok(line.includes(`](${site}docs/`));
});

test('lists the real docs', () => {
  const contentDir = fileURLToPath(new URL('../content/docs/', import.meta.url));
  const index = docsIndex(contentDir, siteUrl('/'));
  assert.equal(links(index).length, 38);
  const headings = index.split('\n').filter((line) => line.startsWith('## '));
  assert.deepEqual(
    headings,
    sidebarGroups.map((group) => `## ${group.label}`),
  );
  assert.equal(headings.at(-1), '## Guides');
  assert.ok(!index.includes('use-a-coding-agent'));
});
