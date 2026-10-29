// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLlmsTxt from 'starlight-llms-txt';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import baseLinks from './src/lib/base-links.mjs';
import { lastModified, sourcesFor } from './src/lib/lastmod.mjs';
import { docsIndex, sidebarGroups } from './src/lib/docs-index.mjs';
import { siteUrl, twinPath } from './src/lib/markdown-twin.mjs';
import { plausibleInit, plausibleSrc, tracked } from './src/lib/plausible.mjs';

// Pull request previews are built under /pr-preview/pr-<number>/; the live site sits at /.
const base = process.env.SITE_BASE ?? '/';
/** @param {string} path */
const atBase = (path) => base.replace(/\/$/, '') + path;
const site = siteUrl(base);
/** @param {string} id a docs page id */
const twin = (id) => site + twinPath(id);
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
      // Writes /llms.txt, /llms-full.txt and /llms-small.txt from the docs, for AI assistants.
      plugins: [
        starlightLlmsTxt({
          description:
            'Nearhost is a terminal app for macOS and Linux that opens a dev server running on another machine at a trusted https://name.test address on your laptop, over the SSH config you already have. It installs nothing on the server.',
          details: [
            '- Nearhost is free and open source under MIT. Install it with `curl -fsSL https://nearhost.dev/install.sh | sh`, `brew install nearhost/tap/nearhost` or `npx @nearhost/cli`.',
            '- It works with any HTTP dev server. It reads ports from `.env`, and presets add Docker Compose, Vite and Laravel Sail.',
            '- It is for your own machines and your own browser, not for sharing a page publicly; use a tunnel service such as ngrok for that.',
            '',
            `Start with [Introduction](${twin('docs/getting-started/introduction')}) and [Install](${twin('docs/getting-started/install')}). The guides cover:`,
            '',
            `- [SSO callback fails on a remote dev server](${twin('docs/guides/sso-callback-on-a-remote-dev-server')})`,
            `- [HTTPS on a local dev domain](${twin('docs/guides/https-on-a-local-dev-domain')})`,
            `- [ngrok loads the page, but assets point at localhost](${twin('docs/guides/ngrok-assets-on-localhost')})`,
            `- [Vite hot reload fails over SSH port forwarding](${twin('docs/guides/vite-hot-reload-over-ssh')})`,
            `- [Forward several ports over SSH without retyping -L](${twin('docs/guides/forward-ports-over-ssh')})`,
            `- [WorkOS sign-in on a remote dev server](${twin('docs/guides/workos-sign-in')})`,
            `- [Clerk sign-in on a remote dev server](${twin('docs/guides/clerk-sign-in')})`,
            `- [Cognito sign-in on a remote dev server](${twin('docs/guides/cognito-sign-in')})`,
            '',
            docsIndex(fileURLToPath(new URL('./src/content/docs/', import.meta.url)), site),
          ].join('\n'),
          // The docs in reading order, as the sidebar has them; the guides come last.
          promote: [
            'docs/getting-started/introduction',
            'docs/getting-started/install',
            'docs/getting-started/first-run',
            'docs/getting-started/add-a-server',
            'docs/getting-started/add-a-project',
            'docs/coding-agents/**',
            'docs/concepts/**',
            'docs/reference/**',
            'docs/troubleshooting/**',
          ],
          // Starlight's heading anchors would add a "Section titled" line under every heading.
          customSelectors: { all: ['.sl-anchor-link'] },
          optionalLinks: [
            {
              label: 'Source code',
              url: 'https://github.com/nearhost/nearhost',
              description: 'the Go source, issues and releases',
            },
          ],
        }),
      ],
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
      sidebar: sidebarGroups.map(({ label, directory }) => ({
        label,
        items: [{ autogenerate: { directory } }],
      })),
    }),
    svelte(),
    // Starlight adds a plain sitemap unless one is configured here; this one adds lastmod.
    sitemap({
      // The old coding agent page only redirects.
      filter: (page) => !page.includes('/docs/getting-started/use-a-coding-agent/'),
      serialize(item) {
        const path = new URL(item.url).pathname.slice(base.length);
        const lastmod = lastModified(sourcesFor(path));
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
});
