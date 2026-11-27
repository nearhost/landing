import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8');

function block(selector) {
  const start = css.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `${selector} block missing`);
  const body = css.slice(start, css.indexOf('}', start));
  const map = {};
  for (const m of body.matchAll(/(--nh-[\w-]+):\s*([^;]+);/g)) map[m[1]] = m[2].trim();
  return map;
}

const dark = block(':root');
const light = block(":root[data-theme='light']");

function resolve(map, name) {
  const v = map[name];
  const ref = v?.match(/^var\((--nh-[\w-]+)\)$/);
  return ref ? resolve(map, ref[1]) : v;
}

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test('accent is magenta', () => {
  assert.equal(dark['--nh-accent'].toLowerCase(), '#ff70c8');
  assert.equal(light['--nh-accent'].toLowerCase(), '#b0156c');
});

test('ground and surface', () => {
  assert.equal(dark['--nh-ground'].toLowerCase(), '#111013');
  assert.equal(dark['--nh-surface'].toLowerCase(), '#19171c');
  assert.equal(dark['--nh-line'].toLowerCase(), '#2f2a33');
  assert.equal(dark['--nh-text'].toLowerCase(), '#f4eef2');
  assert.equal(dark['--nh-muted'].toLowerCase(), '#b9a8b4');
  assert.equal(dark['--nh-accent-ink'].toLowerCase(), '#111013');
  assert.equal(light['--nh-ground'].toLowerCase(), '#f6f4f6');
  assert.equal(light['--nh-surface'].toLowerCase(), '#ffffff');
  assert.equal(light['--nh-text'].toLowerCase(), '#1e1820');
  assert.equal(light['--nh-accent-ink'].toLowerCase(), '#ffffff');
});

test('no old palette', () => {
  const old =
    '#d6f26b #0f1210 #161a17 #1d221e #2a312b #ecefe8 #c5ccc6 #a4ada5 #818a82 #f4f5f1 #e6e9e0 #dde0d9 #1b1f1c #3e463f #5c645d #626b63 #4a6200'.split(
      ' ',
    );
  const lower = css.toLowerCase();
  for (const hex of old) assert.ok(!lower.includes(hex), `${hex} still present`);
});

test('text contrast', () => {
  for (const [theme, map] of [
    ['dark', dark],
    ['light', light],
  ]) {
    for (const fg of ['--nh-text', '--nh-body', '--nh-muted', '--nh-faint', '--nh-accent']) {
      for (const bg of ['--nh-ground', '--nh-surface', '--nh-raised']) {
        const ratio = contrast(resolve(map, fg), resolve(map, bg));
        assert.ok(ratio >= 4.5, `${theme} ${fg} on ${bg} is ${ratio.toFixed(2)}`);
      }
    }
  }
});

test('mark tokens', () => {
  for (const map of [dark, light]) {
    assert.ok('--nh-mark-chevron' in map);
    assert.ok('--nh-mark-dot' in map);
    assert.ok(!('--nh-mark-arch' in map));
  }
  assert.equal(light['--nh-mark-dot'], 'var(--nh-accent)');
});
