import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lastCommitDate, sourcesFor } from './lastmod.mjs';

test('maps the landing page to its components', () => {
  assert.ok(sourcesFor('').includes('src/components/landing'));
});

test('maps a docs page to its Markdown file', () => {
  assert.deepEqual(sourcesFor('docs/getting-started/install/'), [
    'src/content/docs/docs/getting-started/install.md',
  ]);
});

test('has no sources for a page without a file', () => {
  assert.deepEqual(sourcesFor('docs/no-such-page/'), []);
  assert.deepEqual(sourcesFor('og/index.png'), []);
});

test('dates a tracked file and nothing for no files', () => {
  assert.match(lastCommitDate(['package.json']) ?? '', /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(lastCommitDate([]), undefined);
});
