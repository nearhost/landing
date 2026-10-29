// Turns a docs page into its Markdown twin: the page's Markdown with the Starlight-only
// syntax (note directives, root-relative links) rewritten so it reads on its own.

/**
 * The absolute URL of the site, ending in a slash.
 * @param {string} base the Astro base, such as "/" or "/pr-preview/pr-1/"
 * @returns {string}
 */
export function siteUrl(base) {
  return `https://nearhost.dev/${base.replace(/^\/+|\/+$/g, '')}/`.replace(/\/{2,}$/, '/');
}

/**
 * Where an entry's twin lives, relative to the site URL.
 * @param {string} id such as "docs/getting-started/install"
 * @returns {string}
 */
export function twinPath(id) {
  return `${id}.md`;
}

/**
 * The note at the top of every twin, pointing agents at the index and the twin convention.
 * @param {string} site the site URL, ending in a slash
 * @returns {string}
 */
export function agentNote(site) {
  return `For AI agents: the full Nearhost documentation index is at ${site}llms.txt. Every docs page is also available as Markdown: replace the trailing slash with \`.md\`, so ${site}docs/getting-started/install/ becomes ${site}docs/getting-started/install.md.`;
}

// A root-relative link target, as in "](/docs/a/)".
const rootLink = /\]\((\/[^)\s]*)\)/g;

function absoluteLink(path, site) {
  const [pathname, hash] = path.split(/#(.*)/s);
  const twin = pathname.startsWith('/docs/') ? `${pathname.replace(/\/$/, '')}.md` : pathname;
  return `${site}${twin.slice(1)}${hash === undefined ? '' : `#${hash}`}`;
}

/**
 * The whole twin of a docs page.
 * @param {{ id: string, title: string, description?: string, body: string }} entry
 * @param {string} site the site URL, ending in a slash
 * @returns {string}
 */
export function toMarkdown(entry, site) {
  const out = [];
  let fence = null; // the marker that opened the code fence we are in
  let note = null; // the lines of the note directive we are in
  for (const line of entry.body.split('\n')) {
    const marker = line.match(/^(```|~~~)/)?.[1];
    if (marker && (fence === null || fence === marker)) fence = fence === null ? marker : null;
    if (fence !== null || marker) {
      (note?.lines ?? out).push(line);
      continue;
    }
    const text = line.replace(rootLink, (_, path) => `](${absoluteLink(path, site)})`);
    const open = line.match(/^:::(\w+)(?:\[(.*)\])?\s*$/);
    if (open) {
      if (open[1] !== 'note') throw new Error(`${entry.id}: unsupported directive :::${open[1]}`);
      note = { title: open[2] ?? 'Note', lines: [] };
    } else if (note && line.trim() === ':::') {
      const [first = '', ...rest] = note.lines;
      out.push(`> **${note.title}:** ${first}`, ...rest.map((l) => (l === '' ? '>' : `> ${l}`)));
      note = null;
    } else {
      (note?.lines ?? out).push(text);
    }
  }
  const parts = [`# ${entry.title}`, `> ${agentNote(site)}`];
  if (entry.description) parts.push(entry.description);
  parts.push(out.join('\n').trim());
  return `${parts.join('\n\n')}\n`;
}
