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

// A code span, left as written, or a root-relative link target with an optional title, as in
// "](/docs/a/)" or '](/docs/a/ "Title")'. Matching code spans first keeps their text intact; a
// span closes only on a backtick run of its own length, so it can hold shorter runs.
const rootLink =
  /(?<!`)(`+)(?!`)[\s\S]*?(?<!`)\1(?!`)|\]\((\/[^)\s]*)((?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?)\)/g;

// A code fence opener or closer: up to any indent, then three or more backticks or tildes.
const fenceLine = /^\s*(`{3,}|~{3,})(.*)$/;

// A line that starts a block of its own, so a note's label can't share it.
const blockStart = /^\s*(?:([-*+]|\d+[.)])\s|#{1,6}(?:\s|$)|>|\||`{3,}|~{3,})/;

function absoluteLink(path, site) {
  const [, pathname, suffix] = path.match(/^([^?#]*)(.*)$/s);
  const twin = pathname.startsWith('/docs/') ? `${pathname.replace(/\/$/, '')}.md` : pathname;
  return `${site}${twin.slice(1)}${suffix}`;
}

/**
 * The whole twin of a docs page.
 * @param {{ id: string, title: string, description?: string, body: string }} entry
 * @param {string} site the site URL, ending in a slash
 * @returns {string}
 */
export function toMarkdown(entry, site) {
  const out = [];
  let fence = null; // the marker that opened the code fence we are in, such as "```"
  let note = null; // the lines of the note directive we are in
  for (const line of entry.body.split('\n')) {
    const [, marker, rest] = line.match(fenceLine) ?? [];
    if (fence === null && marker) {
      fence = marker;
    } else if (
      fence !== null &&
      marker?.[0] === fence[0] &&
      marker.length >= fence.length &&
      !rest.trim()
    ) {
      fence = null;
    }
    if (fence !== null || marker) {
      (note?.lines ?? out).push(line);
      continue;
    }
    const text = line.replace(rootLink, (match, code, path, title) =>
      code ? match : `](${absoluteLink(path, site)}${title})`,
    );
    const open = line.match(/^:::(\w+)(?:\[(.*)\])?\s*$/);
    if (open) {
      if (open[1] !== 'note') throw new Error(`${entry.id}: unsupported directive :::${open[1]}`);
      // A note inside a note would lose the outer one's lines, and Starlight doesn't nest them.
      if (note) throw new Error(`${entry.id}: nested :::note`);
      note = { title: open[2] ?? 'Note', lines: [] };
    } else if (note && line.trim() === ':::') {
      const quote = (l) => (l === '' ? '>' : `> ${l}`);
      const [first = '', ...rest] = note.lines;
      if (blockStart.test(first)) {
        out.push(`> **${note.title}:**`, '>', ...note.lines.map(quote));
      } else {
        out.push(`> **${note.title}:** ${first}`, ...rest.map(quote));
      }
      note = null;
    } else {
      (note?.lines ?? out).push(text);
    }
  }
  if (note) throw new Error(`${entry.id}: unterminated :::note`);
  const parts = [`# ${entry.title}`, `> ${agentNote(site)}`];
  if (entry.description) parts.push(entry.description);
  const body = out.join('\n').trim();
  if (body) parts.push(body);
  return `${parts.join('\n\n')}\n`;
}
