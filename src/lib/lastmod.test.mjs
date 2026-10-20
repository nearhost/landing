import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { lastModified, sourcesFor } from './lastmod.mjs';

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
  assert.match(lastModified(['package.json']) ?? '', /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(lastModified([]), undefined);
});

test('dates a file git does not know by its modification time', () => {
  const dir = mkdtempSync(join(tmpdir(), 'lastmod-'));
  const file = join(dir, 'new.md');
  writeFileSync(file, '# New\n');
  assert.equal(lastModified([file]), new Date(statSync(file).mtimeMs).toISOString());
  rmSync(dir, { recursive: true });
});

test('dates a directory git does not know by the newest file in it', () => {
  const dir = mkdtempSync(join(tmpdir(), 'lastmod-'));
  mkdirSync(join(dir, 'nested'));
  const file = join(dir, 'nested', 'newer.astro');
  writeFileSync(join(dir, 'older.astro'), '');
  utimesSync(join(dir, 'older.astro'), new Date('2020-01-01'), new Date('2020-01-01'));
  writeFileSync(file, '');
  utimesSync(dir, new Date('2020-01-01'), new Date('2020-01-01'));
  assert.equal(lastModified([dir]), new Date(statSync(file).mtimeMs).toISOString());
  rmSync(dir, { recursive: true });
});
