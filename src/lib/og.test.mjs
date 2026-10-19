import { test } from 'node:test';
import assert from 'node:assert/strict';
import { height, ogPath, renderOg, section, width } from './og.mjs';

const pngSize = (png) => [png.readUInt32BE(16), png.readUInt32BE(20)];
const isPng = (png) =>
  png.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

test('maps an entry id to its card path', () => {
  assert.equal(ogPath('index'), '/og/index.png');
  assert.equal(ogPath('docs/concepts/discovery'), '/og/docs/concepts/discovery.png');
});

test('names the sidebar section of a docs page', () => {
  assert.equal(section('docs/getting-started/install'), 'Getting started');
  assert.equal(section('docs/reference/cli'), 'Reference');
  assert.equal(section('docs/guides/workos-sign-in'), 'Guides');
});

test('draws the landing card and a docs card, one after the other, at 1200x630', async () => {
  const cards = [
    { id: 'index', title: 'Nearhost' },
    {
      id: 'docs/concepts/tls-and-the-proxy',
      title: 'TLS and the proxy',
      description: 'How the embedded Caddy proxy serves each alias over HTTPS.',
    },
    { id: 'docs/reference/cli', title: 'CLI' },
  ];
  for (const card of cards) {
    const png = await renderOg(card);
    assert.ok(isPng(png), `${card.id} is not a PNG`);
    assert.deepEqual(pngSize(png), [width, height]);
  }
});
