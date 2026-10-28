// Where each section of the old coding agent page lives now. Keys are the old anchors without
// the '#' ('' for none); values are paths below the site base, with the new anchor if it has one.
// The redirect page at src/pages/docs/getting-started/use-a-coding-agent.astro uses this map.
const overview = 'docs/coding-agents/';

export const moves = {
  '': overview,
  'install-the-skill': `${overview}#install-the-skill`,
  'add-a-project': `${overview}add-a-project/`,
  'fix-a-project': `${overview}fix-a-project/`,
  'how-the-agent-reaches-nearhost': `${overview}how-it-works/`,
  'browser-previews-from-a-server': `${overview}browser-previews/`,
  'what-the-token-protects': `${overview}prompts-and-always-allow/#what-the-token-protects`,
  'when-a-passthrough-ends': `${overview}browser-previews/#when-a-passthrough-ends`,
  'without-nearhost-connected': `${overview}browser-previews/#without-nearhost-connected`,
  'documents-from-coding-agents': `${overview}documents/`,
  'what-is-served': `${overview}documents/#what-is-served`,
  'documents-cannot-reach-your-other-pages': `${overview}documents/#documents-cannot-reach-your-other-pages`,
  'always-allow': `${overview}prompts-and-always-allow/#always-allow`,
  'when-a-served-folder-goes-away': `${overview}documents/#when-a-served-folder-goes-away`,
  'agent-api': `${overview}how-it-works/#agent-api`,
  'when-agents-cannot-reach-nearhost': `${overview}troubleshooting/`,
  'turn-notifications-off': `${overview}prompts-and-always-allow/#turn-notifications-off`,
};

/** The path below the base for an old anchor; `hash` is location.hash, with or without '#'. */
export function newPath(hash) {
  const key = hash.replace(/^#/, '');
  return Object.hasOwn(moves, key) ? moves[key] : moves[''];
}
