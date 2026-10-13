// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import svelte from '@astrojs/svelte';

export default defineConfig({
  site: 'https://nearhost.dev',
  integrations: [
    starlight({
      title: 'Nearhost',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/nearhost/nearhost' }],
      editLink: { baseUrl: 'https://github.com/nearhost/landing/edit/main/' },
      lastUpdated: true,
      sidebar: [
        { label: 'Getting started', items: [{ autogenerate: { directory: 'docs/getting-started' } }] },
        { label: 'Concepts', items: [{ autogenerate: { directory: 'docs/concepts' } }] },
        { label: 'Reference', items: [{ autogenerate: { directory: 'docs/reference' } }] },
        { label: 'Troubleshooting', items: [{ autogenerate: { directory: 'docs/troubleshooting' } }] },
      ],
    }),
    svelte(),
  ],
});
