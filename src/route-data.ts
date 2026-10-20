// Gives each docs page its own social card, drawn by src/pages/og/[...id].png.ts, and
// structured data that names it as a dated technical article about Nearhost.
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { url } from './lib/url';
import { height, ogPath, width } from './lib/og.mjs';
import { jsonLd, techArticle } from './lib/structured-data.mjs';

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
    {
      tag: 'script',
      attrs: { type: 'application/ld+json' },
      content: jsonLd(
        techArticle(context.site, {
          url: new URL(context.url.pathname, context.site).href,
          title: route.entry.data.title,
          description: route.entry.data.description,
          image,
          modified: route.lastUpdated,
        }),
      ),
    },
  );
});
