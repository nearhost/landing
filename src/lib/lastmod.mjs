// Dates each sitemap entry by the last commit to the files that make the page.
import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';

// The landing page is drawn from these, so a change to any of them changes the page.
const landingSources = [
  'src/pages/index.astro',
  'src/layouts/Landing.astro',
  'src/components/landing',
];

/**
 * The source files behind a page, from its path below the site base, or none for a page
 * that does not come from a file of its own.
 * @param {string} path such as "" or "docs/guides/workos-sign-in/"
 * @returns {string[]}
 */
export function sourcesFor(path) {
  if (path === '') return landingSources;
  const slug = path.replace(/\/$/, '');
  if (!slug.startsWith('docs/')) return [];
  return ['.md', '.mdx']
    .map((ext) => `src/content/docs/${slug}${ext}`)
    .filter((file) => existsSync(file));
}

/**
 * When these files last changed: the date of the newest commit to them, or, for files not
 * committed yet, their newest modification time. Undefined for no files. A shallow clone
 * dates every committed file by its one commit.
 * @param {string[]} files
 * @returns {string | undefined}
 */
export function lastModified(files) {
  if (files.length === 0) return undefined;
  try {
    const date = execFileSync('git', ['log', '-1', '--format=%cI', '--', ...files], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (date) return date;
  } catch {
    // Not a git checkout; fall back to the files themselves.
  }
  const times = files.filter((file) => existsSync(file)).map((file) => statSync(file).mtimeMs);
  return times.length ? new Date(Math.max(...times)).toISOString() : undefined;
}
