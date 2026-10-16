<a href="https://nearhost.dev"><img src="https://raw.githubusercontent.com/nearhost/.github/main/assets/header.png" alt="Nearhost. Run it anywhere. Open it here."></a>

# nearhost.dev

The source for [nearhost.dev](https://nearhost.dev), the website and documentation for [Nearhost](https://github.com/nearhost/nearhost). Nearhost is a terminal app that opens a dev server running on one of your other machines at a local `https://myapp.test`, over the SSH config you already have. This site is built with Astro and Starlight and deployed to GitHub Pages.

[Website](https://nearhost.dev) · [Docs](https://nearhost.dev/docs/getting-started/introduction/) · [Nearhost](https://github.com/nearhost/nearhost) · [Releases](https://github.com/nearhost/nearhost/releases)

## Develop

    nvm use
    npm install
    npm run dev

## Verify

    npm run verify

Runs the formatter check, linter, type checks, a production build and the output checks. CI runs the same command.

## Docs

Pages live in `src/content/docs/docs/<group>/`. Add a Markdown file with `title`, `description` and `sidebar.order` frontmatter and it appears in the sidebar.

## Layout

- `src/pages/index.astro` is the landing page, composed from `src/components/landing/`.
- `src/components/CopyButton.svelte` and `NavMenu.svelte` are the only client-side islands.
- `src/styles/tokens.css` holds the brand tokens. Components use `--nh-*` variables, never raw colours.
- `src/styles/starlight.css` maps those tokens onto Starlight; `src/components/starlight/` holds the three overrides.
- `public/install.sh` is the installer served at nearhost.dev/install.sh. `scripts/test-install.sh` exercises it offline.
- `scripts/verify-dist.mjs` checks the built output before deploy.

## Deploy

Pushes to `main` build, verify and publish the site to the `gh-pages` branch through `.github/workflows/deploy.yml`, and GitHub Pages serves that branch. Each pull request from this repository also gets a preview at `nearhost.dev/pr-preview/pr-<number>/`, linked in a comment on the pull request and removed when it closes. The custom domain is set by `public/CNAME`.

A preview is built with `SITE_BASE` set to its path. Root-relative links in components go through `url()` from `src/lib/url.ts`; links in Markdown are prefixed by `src/lib/base-links.mjs`. Try a preview build locally with `SITE_BASE=/pr-preview/pr-1/ npm run build`.

Once a day `.github/workflows/stats.yml` runs `scripts/collect-stats.mjs`, which records Nearhost's release download and star counts at `nearhost.dev/stats/stats.json` with a daily history carried over from the previous snapshot. It pushes to `gh-pages` directly, and the site deploy leaves `stats/` in place. Downloads count the release archives only, not `checksums.txt`.

## Conventions

Commits are conventional-commit titles with no body. Prettier and ESLint run on staged files before each commit. Copy stays in the components as plain text, labels are sentence case, and the landing page is dark only. Dependent pull requests are managed as a stack with the gh stack extension.

## Licence

MIT. See [LICENSE](LICENSE). Logo files for avatars and app icons are in [brand/](brand/).
