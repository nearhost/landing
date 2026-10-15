// A Sätteri hast plugin that prefixes root-relative links in Markdown with the site's base
// path, which Astro leaves as written. With the base at / it is not added at all.
export default function baseLinks(base) {
  const prefix = base.replace(/\/$/, '');
  return {
    name: 'base-links',
    element: {
      filter: ['a'],
      visit(node, ctx) {
        const href = node.properties?.href;
        if (typeof href === 'string' && /^\/(?!\/)/.test(href)) {
          ctx.setProperty(node, 'href', prefix + href);
        }
      },
    },
  };
}
