import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moves, newPath } from './coding-agents-redirect.mjs';

test('no anchor goes to the overview', () => {
  assert.equal(newPath(''), 'docs/coding-agents/');
  assert.equal(newPath('#'), 'docs/coding-agents/');
});

test('a moved section keeps its anchor', () => {
  assert.equal(newPath('#agent-api'), 'docs/coding-agents/how-it-works/#agent-api');
  assert.equal(
    newPath('what-the-token-protects'),
    'docs/coding-agents/prompts-and-always-allow/#what-the-token-protects',
  );
});

test('a section that became a page drops its anchor', () => {
  assert.equal(newPath('#browser-previews-from-a-server'), 'docs/coding-agents/browser-previews/');
});

test('an unknown anchor goes to the overview', () => {
  assert.equal(newPath('#no-such-anchor'), 'docs/coding-agents/');
});

test('every heading of the old page has a move', () => {
  assert.equal(Object.keys(moves).length, 17); // 16 anchors in the spec's table, plus ''
});
