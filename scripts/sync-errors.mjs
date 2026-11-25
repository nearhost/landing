// Copies Nearhost's catalog of message codes into src/data/errors.json and writes the errors
// reference page from it. Run it when the catalog changes:
//
//   node scripts/sync-errors.mjs [path/to/catalog.json]
//
// The catalog is internal/report/catalog.json in the nearhost repository, checked out beside
// this one by default. src/lib/errors-page.test.mjs checks that the page matches the data.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as prettier from 'prettier';
import { errorsPage } from '../src/lib/errors-page.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
export const dataPath = `${root}src/data/errors.json`;
export const pagePath = `${root}src/content/docs/docs/reference/errors.md`;

/** The page for a catalog, formatted as the repository's Prettier config formats it. */
export async function formattedPage(catalog) {
  const options = (await prettier.resolveConfig(pagePath)) ?? {};
  return prettier.format(errorsPage(catalog), { ...options, filepath: pagePath });
}

async function formattedJSON(catalog) {
  const options = (await prettier.resolveConfig(dataPath)) ?? {};
  return prettier.format(JSON.stringify(catalog), { ...options, filepath: dataPath });
}

async function main(args) {
  const source =
    args[0] ??
    fileURLToPath(new URL('../../nearhost/internal/report/catalog.json', import.meta.url));
  const catalog = JSON.parse(readFileSync(source, 'utf8'));
  const page = await formattedPage(catalog);
  writeFileSync(dataPath, await formattedJSON(catalog));
  writeFileSync(pagePath, page);
  console.log(`Wrote ${dataPath} and ${pagePath} from ${source}.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
