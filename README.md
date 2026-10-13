# nearhost.dev

Source for the Nearhost website and documentation. Built with Astro and Starlight, deployed to GitHub Pages.

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

Pushes to `main` build and deploy through `.github/workflows/deploy.yml`. Pull requests build, verify, check links and run Lighthouse, but do not deploy. The custom domain is set by `public/CNAME`. GitHub Pages must be enabled with GitHub Actions as its source before the first deploy.

## Conventions

Commits are conventional-commit titles with no body. Prettier and ESLint run on staged files before each commit. Copy stays in the components as plain text, labels are sentence case, and the landing page is dark only. Dependent pull requests are managed as a stack with the gh stack extension.
