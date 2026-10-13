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
