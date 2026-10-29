import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agentNote, siteUrl, toMarkdown, twinPath } from './markdown-twin.mjs';

const site = 'https://nearhost.dev/';
const entry = (body, extra = {}) => ({ id: 'docs/x', title: 'X', body, ...extra });
// The body of a twin, after the title, the note and the blank lines between them.
const bodyOf = (md) => md.split('\n\n').slice(2).join('\n\n');

test('builds the site URL from the base', () => {
  assert.equal(siteUrl('/'), 'https://nearhost.dev/');
  assert.equal(siteUrl('/pr-preview/pr-1/'), 'https://nearhost.dev/pr-preview/pr-1/');
  assert.equal(siteUrl('/pr-preview/pr-1'), 'https://nearhost.dev/pr-preview/pr-1/');
});

test('maps an entry id to its twin', () => {
  assert.equal(twinPath('docs/getting-started/install'), 'docs/getting-started/install.md');
  assert.equal(twinPath('docs/coding-agents'), 'docs/coding-agents.md');
});

test('starts with the title, the note and the description', () => {
  const page = { id: 'docs/getting-started/install', title: 'Install', body: 'Body.\n' };
  assert.equal(
    toMarkdown({ ...page, description: 'Install it.' }, site),
    `# Install\n\n> ${agentNote(site)}\n\nInstall it.\n\nBody.\n`,
  );
  assert.equal(toMarkdown(page, site), `# Install\n\n> ${agentNote(site)}\n\nBody.\n`);
});

test('turns a note into a blockquote', () => {
  const note = (body) => bodyOf(toMarkdown(entry(body), site));
  assert.equal(note(':::note\nNeeds 0.6.0.\n:::\n'), '> **Note:** Needs 0.6.0.\n');
  assert.equal(note(':::note[Checked against]\nThese:\n:::\n'), '> **Checked against:** These:\n');
});

test('quotes a multi-paragraph note', () => {
  const body =
    ':::note[Checked against]\nThese, on 2026-10-20:\n\n- [A](https://a.example)\n- B\n:::\n';
  assert.equal(
    bodyOf(toMarkdown(entry(body), site)),
    '> **Checked against:** These, on 2026-10-20:\n>\n> - [A](https://a.example)\n> - B\n',
  );
});

test('rewrites docs links to twins', () => {
  const link = (href) => bodyOf(toMarkdown(entry(`[L](${href})\n`), site));
  assert.equal(link('/docs/reference/cli/'), '[L](https://nearhost.dev/docs/reference/cli.md)\n');
  assert.equal(
    link('/docs/reference/cli/#nearhost-update'),
    '[L](https://nearhost.dev/docs/reference/cli.md#nearhost-update)\n',
  );
  assert.equal(
    link('/docs/reference/cli#flags'),
    '[L](https://nearhost.dev/docs/reference/cli.md#flags)\n',
  );
  assert.equal(link('/docs/coding-agents/'), '[L](https://nearhost.dev/docs/coding-agents.md)\n');
  assert.equal(link('/install.sh'), '[L](https://nearhost.dev/install.sh)\n');
  assert.equal(link('https://clerk.com/docs/'), '[L](https://clerk.com/docs/)\n');
  assert.equal(link('#anchor'), '[L](#anchor)\n');
});

test('uses the base', () => {
  const preview = 'https://nearhost.dev/pr-preview/pr-1/';
  const md = toMarkdown(entry('[CLI](/docs/reference/cli/)\n'), preview);
  assert.ok(md.endsWith('[CLI](https://nearhost.dev/pr-preview/pr-1/docs/reference/cli.md)\n'));
  assert.ok(md.includes('https://nearhost.dev/pr-preview/pr-1/llms.txt'));
});

test('leaves fenced code alone', () => {
  const fenced = '```sh\n:::note\n[x](/docs/a/)\n```\n\n~~~\n:::tip\n[x](/docs/a/)\n~~~\n';
  assert.equal(bodyOf(toMarkdown(entry(fenced), site)), fenced);
});

test('fails on other directives', () => {
  assert.throws(() => toMarkdown(entry(':::tip\nHi.\n:::\n'), site), {
    message: 'docs/x: unsupported directive :::tip',
  });
});
