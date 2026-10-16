import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildStats, countDownloads, recordDay } from './collect-stats.mjs';

const release = (tag, assets) => ({
  tag_name: tag,
  assets: Object.entries(assets).map(([name, download_count]) => ({ name, download_count })),
});

test('counts archives and leaves checksums out', () => {
  const releases = [
    release('v0.2.0', {
      'checksums.txt': 9,
      'nearhost_0.2.0_darwin_arm64.tar.gz': 5,
      'nearhost_0.2.0_linux_amd64.tar.gz': 2,
    }),
    release('v0.1.0', { 'checksums.txt': 1, 'nearhost_0.1.0_windows_amd64.zip': 3 }),
  ];
  assert.deepEqual(countDownloads(releases), {
    total: 10,
    byRelease: { 'v0.2.0': 7, 'v0.1.0': 3 },
  });
});

test('appends a new day and replaces a repeated one', () => {
  const series = [{ d: '2026-10-15', v: 4 }];
  assert.deepEqual(recordDay(series, '2026-10-16', 6), [
    { d: '2026-10-15', v: 4 },
    { d: '2026-10-16', v: 6 },
  ]);
  assert.deepEqual(recordDay(series, '2026-10-15', 5), [{ d: '2026-10-15', v: 5 }]);
});

test('keeps the history from the previous snapshot', () => {
  const previous = {
    schemaVersion: 1,
    downloads: { total: 4, byRelease: {}, daily: [{ d: '2026-10-15', v: 4 }] },
    stars: { total: 1, daily: [{ d: '2026-10-15', v: 1 }] },
  };
  const stats = buildStats(previous, {
    repo: 'nearhost/nearhost',
    releases: [release('v0.4.0', { 'nearhost_0.4.0_darwin_arm64.tar.gz': 6 })],
    stars: 2,
    now: new Date('2026-10-16T06:17:00Z'),
  });
  assert.deepEqual(stats, {
    schemaVersion: 1,
    generatedAt: '2026-10-16T06:17:00.000Z',
    repo: 'nearhost/nearhost',
    downloads: {
      total: 6,
      byRelease: { 'v0.4.0': 6 },
      daily: [
        { d: '2026-10-15', v: 4 },
        { d: '2026-10-16', v: 6 },
      ],
    },
    stars: {
      total: 2,
      daily: [
        { d: '2026-10-15', v: 1 },
        { d: '2026-10-16', v: 2 },
      ],
    },
  });
});

test('starts a fresh history without a previous snapshot', () => {
  const stats = buildStats(undefined, {
    repo: 'nearhost/nearhost',
    releases: [],
    stars: 0,
    now: new Date('2026-10-16T06:17:00Z'),
  });
  assert.deepEqual(stats.downloads.daily, [{ d: '2026-10-16', v: 0 }]);
  assert.deepEqual(stats.stars.daily, [{ d: '2026-10-16', v: 0 }]);
});
