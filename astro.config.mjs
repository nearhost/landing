// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import svelte from '@astrojs/svelte';
import { satteri } from '@astrojs/markdown-satteri';
import baseLinks from './src/lib/base-links.mjs';
import { plausibleInit, plausibleSrc, tracked } from './src/lib/plausible.mjs';

// Pull request previews are built under /pr-preview/pr-<number>/; the live site sits at /.
const base = process.env.SITE_BASE ?? '/';
/** @param {string} path */
const atBase = (path) => base.replace(/\/$/, '') + path;
const analytics = tracked(base, process.argv.includes('build'))
  ? [
      { tag: /** @type {const} */ ('script'), attrs: { async: true, src: plausibleSrc } },
      { tag: /** @type {const} */ ('script'), content: plausibleInit },
    ]
  : [];

export default defineConfig({
  site: 'https://nearhost.dev',
  base,
  markdown: {
    processor: satteri({ hastPlugins: base === '/' ? [] : [baseLinks(base)] }),
  },
  redirects: {
    '/docs': atBase('/docs/getting-started/introduction/'),
    '/docs/concepts/laravel-sail-and-vite': atBase('/docs/concepts/dev-servers-and-hot-reload/'),
  },
  integrations: [
    starlight({
      title: 'Nearhost',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/nearhost/nearhost' }],
      editLink: { baseUrl: 'https://github.com/nearhost/landing/edit/main/' },
      lastUpdated: true,
      routeMiddleware: './src/route-data.ts',
      head: analytics,
      customCss: [
        '@fontsource-variable/space-grotesk/index.css',
        '@fontsource-variable/dm-sans/index.css',
        '@fontsource/ibm-plex-mono/400.css',
        '@fontsource/ibm-plex-mono/500.css',
        './src/styles/tokens.css',
        './src/styles/starlight.css',
      ],
      components: {
        SiteTitle: './src/components/starlight/SiteTitle.astro',
        Header: './src/components/starlight/Header.astro',
        Footer: './src/components/starlight/Footer.astro',
      },
      sidebar: [
        {
          label: 'Getting started',
          items: [{ autogenerate: { directory: 'docs/getting-started' } }],
        },
        { label: 'Guides', items: [{ autogenerate: { directory: 'docs/guides' } }] },
        { label: 'Concepts', items: [{ autogenerate: { directory: 'docs/concepts' } }] },
        { label: 'Reference', items: [{ autogenerate: { directory: 'docs/reference' } }] },
        {
          label: 'Troubleshooting',
          items: [{ autogenerate: { directory: 'docs/troubleshooting' } }],
        },
      ],
    }),
    svelte(),
  ],
});
