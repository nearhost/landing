// Dates each sitemap entry by the last commit to the files that make the page.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

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
 * The commit date of the newest commit to these files, or undefined outside a git checkout
 * or for files git does not know. A shallow clone dates every file by its one commit.
 * @param {string[]} files
 * @returns {string | undefined}
 */
export function lastCommitDate(files) {
  if (files.length === 0) return undefined;
  try {
    const date = execFileSync('git', ['log', '-1', '--format=%cI', '--', ...files], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return date || undefined;
  } catch {
    return undefined;
  }
}
