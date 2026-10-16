// Takes the daily snapshot of download and star counts that the stats workflow publishes at
// nearhost.dev/stats/stats.json. GitHub only reports running totals, so the history is carried
// over from the previous snapshot.
//
//   node scripts/collect-stats.mjs <previous.json> <out.json>
//
// The previous snapshot may be missing, which starts a fresh history.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = 'nearhost/nearhost';

// Only the release archives count. The installer also fetches checksums.txt, so counting it
// would count every install twice.
const ARCHIVE = /\.(tar\.gz|zip)$/;

export function countDownloads(releases) {
  const byRelease = {};
  for (const release of releases) {
    byRelease[release.tag_name] = release.assets
      .filter((asset) => ARCHIVE.test(asset.name))
      .reduce((sum, asset) => sum + asset.download_count, 0);
  }
  const total = Object.values(byRelease).reduce((sum, n) => sum + n, 0);
  return { total, byRelease };
}

// A second run on the same day replaces that day's entry rather than adding another.
export function recordDay(series, day, value) {
  return [...series.filter((entry) => entry.d !== day), { d: day, v: value }].sort((a, b) =>
    a.d.localeCompare(b.d),
  );
}

export function buildStats(previous, { repo, releases, stars, now }) {
  const day = now.toISOString().slice(0, 10);
  const downloads = countDownloads(releases);
  return {
    schemaVersion: 1,
    generatedAt: now.toISOString(),
    repo,
    downloads: {
      ...downloads,
      daily: recordDay(previous?.downloads?.daily ?? [], day, downloads.total),
    },
    stars: {
      total: stars,
      daily: recordDay(previous?.stars?.daily ?? [], day, stars),
    },
  };
}

async function github(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'nearhost-landing-stats',
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`GET ${path}: ${res.status} ${res.statusText}`);
  return res.json();
}

async function allReleases() {
  const releases = [];
  for (let page = 1; ; page++) {
    const batch = await github(`/repos/${REPO}/releases?per_page=100&page=${page}`);
    releases.push(...batch);
    if (batch.length < 100) return releases;
  }
}

async function main([previousPath, outPath]) {
  if (!previousPath || !outPath) {
    throw new Error('usage: node scripts/collect-stats.mjs <previous.json> <out.json>');
  }
  if (!process.env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is not set');

  const previous = existsSync(previousPath)
    ? JSON.parse(readFileSync(previousPath, 'utf8'))
    : undefined;
  const [releases, repo] = await Promise.all([allReleases(), github(`/repos/${REPO}`)]);
  const stats = buildStats(previous, {
    repo: REPO,
    releases,
    stars: repo.stargazers_count,
    now: new Date(),
  });

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(stats, null, 2)}\n`);
  console.log(`${stats.downloads.total} downloads, ${stats.stars.total} stars`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(`collect-stats: ${error.message}`);
    process.exit(1);
  });
}
