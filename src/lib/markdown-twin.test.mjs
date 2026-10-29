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

test('fails on an unterminated note', () => {
  assert.throws(() => toMarkdown(entry(':::note\nHi.\n'), site), {
    message: 'docs/x: unterminated :::note',
  });
});

test('quotes fenced code inside a note without rewriting it', () => {
  const body = ':::note\nRun:\n```sh\n:::tip\n[x](/docs/a/)\n```\n:::\n';
  assert.equal(
    bodyOf(toMarkdown(entry(body), site)),
    '> **Note:** Run:\n> ```sh\n> :::tip\n> [x](/docs/a/)\n> ```\n',
  );
});

test('pins the agent note', () => {
  assert.equal(
    agentNote(site),
    'For AI agents: the full Nearhost documentation index is at https://nearhost.dev/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/docs/getting-started/install/ becomes https://nearhost.dev/docs/getting-started/install.md.',
  );
});

test('tracks indented and longer fences', () => {
  const fenced = '- Step:\n\n  ```sh\n  [x](/docs/a/)\n  ```\n\n````md\n```\n[x](/docs/a/)\n````\n';
  assert.equal(bodyOf(toMarkdown(entry(fenced), site)), fenced);
});

test('rewrites a link with a title and leaves code spans alone', () => {
  const md = toMarkdown(entry('[CLI](/docs/reference/cli/ "The CLI") and `[x](/docs/a/)`\n'), site);
  assert.equal(
    bodyOf(md),
    '[CLI](https://nearhost.dev/docs/reference/cli.md "The CLI") and `[x](/docs/a/)`\n',
  );
});

test('puts a note label on its own line before a block', () => {
  assert.equal(
    bodyOf(toMarkdown(entry(':::note\n- One\n- Two\n:::\n'), site)),
    '> **Note:**\n>\n> - One\n> - Two\n',
  );
});

test('leaves out an empty body', () => {
  assert.equal(toMarkdown(entry('\n'), site), `# X\n\n> ${agentNote(site)}\n`);
});

test('keeps a query string on a docs link', () => {
  const md = toMarkdown(entry('[CLI](/docs/reference/cli/?v=1#flags)\n'), site);
  assert.equal(bodyOf(md), '[CLI](https://nearhost.dev/docs/reference/cli.md?v=1#flags)\n');
});

test('fails on a nested note', () => {
  assert.throws(() => toMarkdown(entry(':::note\nA\n:::note\nB\n:::\n:::\n'), site), {
    message: 'docs/x: nested :::note',
  });
});

test('rewrites links with any title form', () => {
  const md = toMarkdown(entry("[a](/docs/a/ 'T') [b](/docs/b/ (T))\n"), site);
  assert.equal(
    bodyOf(md),
    "[a](https://nearhost.dev/docs/a.md 'T') [b](https://nearhost.dev/docs/b.md (T))\n",
  );
});

test('leaves a code span holding shorter backtick runs alone', () => {
  const body = '``a `[x](/docs/a/)` b`` then [y](/docs/b/)\n';
  assert.equal(
    bodyOf(toMarkdown(entry(body), site)),
    '``a `[x](/docs/a/)` b`` then [y](https://nearhost.dev/docs/b.md)\n',
  );
});

test('treats an indented heading as a block but not a hashtag', () => {
  assert.equal(
    bodyOf(toMarkdown(entry(':::note\n  ## Steps\n:::\n'), site)),
    '> **Note:**\n>\n>   ## Steps\n',
  );
  assert.equal(
    bodyOf(toMarkdown(entry(':::note\n#nearhost\n:::\n'), site)),
    '> **Note:** #nearhost\n',
  );
});
