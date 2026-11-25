// Writes the errors reference page (src/content/docs/docs/reference/errors.md) from
// src/data/errors.json, the catalog of codes that Nearhost exports from internal/report.
// scripts/sync-errors.mjs runs it; src/lib/errors-page.test.mjs checks the page is current.

/** Where the API's problem `type` links point; each code is an anchor on this page. */
export const docsBase = 'https://nearhost.dev/docs/reference/errors/';

/**
 * The page's sections, in order. A code belongs to the section that lists its area, the part
 * before its first dot; codes with no dot are in the first section. A new area in the catalog
 * fails the sync until it is added here.
 * @type {Array<{ label: string, areas: string[], see?: string }>}
 */
export const sections = [
  { label: 'General', areas: ['', 'cli'] },
  {
    label: 'Ports',
    areas: ['port'],
    see: '[Port 443 or 80 already in use](/docs/troubleshooting/troubleshooting/#port-443-or-80-already-in-use)',
  },
  {
    label: 'Nearhost in the background',
    areas: ['core'],
    see: '[Run Nearhost in the background](/docs/guides/run-in-the-background/)',
  },
  {
    label: 'The service',
    areas: ['service'],
    see: '[Start it at login](/docs/guides/run-in-the-background/#start-it-at-login)',
  },
  { label: 'config.yaml', areas: ['config'], see: '[config.yaml](/docs/reference/config/)' },
  {
    label: 'The hosts file',
    areas: ['hosts'],
    see: '[The hosts file](/docs/concepts/the-hosts-file/)',
  },
  {
    label: 'The local CA',
    areas: ['ca', 'trust'],
    see: '[The local CA](/docs/concepts/tls-and-the-proxy/#the-local-ca)',
  },
  {
    label: 'SSH and forwards',
    areas: ['ssh', 'forward', 'passthrough'],
    see: '[SSH transport](/docs/concepts/ssh-transport/)',
  },
  {
    label: 'Docker',
    areas: ['docker'],
    see: '[Callbacks from Docker containers](/docs/guides/container-callbacks/)',
  },
  {
    label: 'Updates',
    areas: ['update'],
    see: '[nearhost update](/docs/reference/cli/#nearhost-update)',
  },
  { label: 'The interface', areas: ['interface'] },
  {
    label: 'Adding and exporting projects',
    areas: ['add', 'export', 'discovery'],
    see: '[Add a project](/docs/getting-started/add-a-project/)',
  },
  {
    label: 'Presets',
    areas: ['preset', 'presets'],
    see: '[Presets and registries](/docs/concepts/presets-and-registries/)',
  },
  {
    label: 'Project checks',
    areas: ['doctor', 'projects', 'nearhostrc', 'routes', 'advice'],
    see: '[Project checks](/docs/reference/cli/#project-checks)',
  },
  {
    label: 'Coding agents',
    areas: ['agents', 'agent'],
    see: '[How agents reach Nearhost](/docs/coding-agents/how-it-works/)',
  },
  {
    label: 'Documents',
    areas: ['documents'],
    see: '[Documents](/docs/coding-agents/documents/)',
  },
  {
    label: "Nearhost's page",
    areas: ['page', 'proxy'],
    see: "[Nearhost's page](/docs/guides/run-in-the-background/#nearhosts-page)",
  },
  { label: 'The control API', areas: ['control'] },
];

const levels = { error: 'Error', warning: 'Warning', info: 'Note' };

/** A code's area: the part before its first dot, or "" for a code with none. */
const areaOf = (code) => (code.includes('.') ? code.slice(0, code.indexOf('.')) : '');

/**
 * The problems with a catalog, as messages; none when it can be written as a page.
 * @param {any} catalog the parsed errors.json
 * @returns {string[]}
 */
export function problems(catalog) {
  const out = [];
  if (catalog?.docsBase !== docsBase) out.push(`docsBase is not ${docsBase}`);
  const codes = Array.isArray(catalog?.codes) ? catalog.codes : [];
  if (codes.length === 0) out.push('the catalog has no codes');
  const seen = new Set();
  const known = new Set(sections.flatMap((s) => s.areas));
  const entries = [
    ...codes.map((entry) => ({ entry, name: entry?.code })),
    ...(catalog?.families ?? []).map((entry) => ({ entry, name: entry?.prefix })),
  ];
  for (const { entry, name } of entries) {
    if (typeof name !== 'string' || !/^[a-z][a-z0-9-]*(\.[a-z0-9-]+)*\.?$/.test(name)) {
      out.push(`an entry has no valid code: ${JSON.stringify(entry)}`);
      continue;
    }
    if (seen.has(name)) out.push(`${name} is listed twice`);
    seen.add(name);
    if (typeof entry.summary !== 'string' || !entry.summary.trim()) {
      out.push(`${name} has no summary`);
    }
    if (!(entry.level in levels)) out.push(`${name} has an unknown level: ${entry.level}`);
    if (!known.has(areaOf(name))) {
      out.push(
        `${name} is in an area the page has no section for; add it to src/lib/errors-page.mjs`,
      );
    }
    for (const step of entry.steps ?? []) {
      if (!step?.text && !step?.command) out.push(`${name} has an empty step`);
    }
  }
  return out;
}

/** Text as Markdown that shows it as written. */
function inline(text) {
  return text.replace(/[\\`*[\]<>]/g, (c) => `\\${c}`);
}

/** Text for an HTML attribute value or element. */
function html(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function entryLines(id, title, entry) {
  const level = levels[entry.level];
  const lines = [
    `<h3 id="${html(id)}"><code>${html(title)}</code></h3>`,
    '',
    entry.status ? `**${level}** · status ${entry.status}` : `**${level}**`,
    '',
    inline(entry.summary.trim()),
  ];
  for (const step of entry.steps ?? []) {
    if (step.text) lines.push('', inline(step.text));
    if (step.command) lines.push('', '```sh', step.command, '```');
  }
  return lines;
}

/**
 * The errors reference page, as Markdown with front matter.
 * @param {any} catalog the parsed errors.json
 * @returns {string}
 */
export function errorsPage(catalog) {
  const found = problems(catalog);
  if (found.length) throw new Error(`errors.json:\n${found.join('\n')}`);
  const out = [
    '---',
    '# Written by scripts/sync-errors.mjs from src/data/errors.json. Do not edit by hand.',
    'title: Errors',
    'description: Every code Nearhost puts on an error, a warning or a note, and what it means.',
    'sidebar:',
    '  order: 6',
    // Problem types and a preset's advice link to #advice.<id>, which has no entry of its own.
    'head:',
    '  - tag: script',
    '    content: |',
    "      addEventListener('DOMContentLoaded', function () {",
    '        function go() {',
    '          var id = decodeURIComponent(location.hash.slice(1));',
    "          if (id.indexOf('advice.') === 0 && !document.getElementById(id)) {",
    "            var to = document.getElementById('advice');",
    '            if (to) to.scrollIntoView();',
    '          }',
    '        }',
    "        addEventListener('hashchange', go);",
    '        go();',
    '      });',
    '---',
    '',
    'Every error, warning and note Nearhost shows has a code, such as `port.needs-permission`. A code names one problem wherever it shows up, and it never changes once released, so you can search for it here or match on it in a script. Each entry below says what the code means. Where the fix is always the same, it gives the fix too; otherwise the message itself says what to do, as it names the path, port or server involved.',
    '',
    'Where codes show up:',
    '',
    '- `nearhost <command> --verbose` prints the code under the title of an error, a warning or a note. See [Errors, warnings and notes](/docs/reference/cli/#errors-warnings-and-notes).',
    "- The core log has it in brackets, as in `error [port.needs-permission] HTTPS port 443 needs permission to bind.` See [The core's log](/docs/guides/run-in-the-background/#the-cores-log).",
    '- `nearhost doctor --verbose` prints a `code:` line under each row that did not pass, and `nearhost doctor --json` gives each check and finding a `code`.',
    '- The APIs answer an error with its `code`, and a `type` that links to its entry on this page. See [Agent API](/docs/coding-agents/how-it-works/#errors-and-warnings).',
    '',
    'An entry is an error, a warning or a note, as Nearhost labels it. The status is the HTTP status the APIs answer with when the code is the error of a request; an entry without one is never an API error.',
  ];
  const families = catalog.families ?? [];
  for (const section of sections) {
    const codes = catalog.codes.filter((e) => section.areas.includes(areaOf(e.code)));
    const fams = families.filter((f) => section.areas.includes(areaOf(f.prefix)));
    if (codes.length + fams.length === 0) continue;
    out.push('', `## ${section.label}`);
    if (section.see) out.push('', `See ${section.see}.`);
    for (const entry of [...codes].sort((a, b) => a.code.localeCompare(b.code))) {
      out.push('', ...entryLines(entry.code, entry.code, entry));
    }
    for (const fam of fams) {
      const id = fam.prefix.replace(/\.$/, '');
      out.push('', ...entryLines(id, `${fam.prefix}<id>`, fam));
      if (id === 'advice') {
        out.push(
          '',
          "`<id>` is the advisory's id, so `advice.vite-default-port` is the `vite-default-port` advisory. See [Advisories](/docs/reference/advisories/) for each one and its fix.",
        );
      }
    }
  }
  return `${out.join('\n')}\n`;
}
