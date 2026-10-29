// The docs index in llms.txt: every docs page, grouped and ordered the way the sidebar is.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { twinPath } from './markdown-twin.mjs';

/**
 * The sidebar groups, in order. astro.config.mjs builds the sidebar from this list.
 * @type {Array<{ label: string, directory: string }>}
 */
export const sidebarGroups = [
  { label: 'Getting started', directory: 'docs/getting-started' },
  { label: 'Coding agents', directory: 'docs/coding-agents' },
  { label: 'Concepts', directory: 'docs/concepts' },
  { label: 'Reference', directory: 'docs/reference' },
  { label: 'Troubleshooting', directory: 'docs/troubleshooting' },
  { label: 'Guides', directory: 'docs/guides' },
];

// Starlight breaks ties between equal orders with this collator, on the entry id.
const collator = new Intl.Collator();

function readPage(contentDir, directory, file) {
  const source = readFileSync(join(contentDir, directory, file), 'utf8');
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const data = parse(frontmatter) ?? {};
  const name = file.replace(/\.mdx?$/, '');
  return {
    id: name === 'index' ? directory : `${directory}/${name}`,
    title: String(data.title ?? ''),
    description: data.description === undefined ? '' : String(data.description),
    order: data.sidebar?.order ?? Number.MAX_VALUE,
  };
}

/**
 * @param {string} contentDir the docs content directory, such as "src/content/docs"
 * @param {string} site the site URL, ending in a slash
 * @returns {string} Markdown: a heading per sidebar group, then a link per page
 */
export function docsIndex(contentDir, site) {
  return sidebarGroups
    .map(({ label, directory }) => {
      const pages = readdirSync(join(contentDir, directory))
        .filter((file) => /\.mdx?$/.test(file))
        .map((file) => readPage(contentDir, directory, file))
        .sort((a, b) => a.order - b.order || collator.compare(a.id, b.id));
      const lines = pages.map(
        (page) =>
          `- [${page.title}](${site}${twinPath(page.id)})${page.description ? `: ${page.description}` : ''}`,
      );
      return [`## ${label}`, '', ...lines].join('\n');
    })
    .join('\n\n');
}
