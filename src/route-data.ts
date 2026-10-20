// Gives each docs page its own social card, drawn by src/pages/og/[...id].png.ts.
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { url } from './lib/url';
import { height, ogPath, width } from './lib/og.mjs';

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  // The 404 page is not in the docs collection, so it has no card.
  if (!route.entry.id.startsWith('docs/') || !context.site) return;

  const image = new URL(url(ogPath(route.entry.id)), context.site).href;
  const alt = `${route.entry.data.title}: Nearhost docs`;
  route.head.push(
    { tag: 'meta', attrs: { property: 'og:image', content: image } },
    { tag: 'meta', attrs: { property: 'og:image:width', content: String(width) } },
    { tag: 'meta', attrs: { property: 'og:image:height', content: String(height) } },
    { tag: 'meta', attrs: { property: 'og:image:alt', content: alt } },
    { tag: 'meta', attrs: { name: 'twitter:image', content: image } },
    { tag: 'meta', attrs: { name: 'twitter:image:alt', content: alt } },
  );
});
