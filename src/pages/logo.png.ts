// The square logo at /logo.png, for the Organization in each page's structured data.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { APIRoute } from 'astro';

// Read from the project root: the build bundles this file, so its own URL moves.
export const GET: APIRoute = async () =>
  new Response(
    new Uint8Array(await readFile(join(process.cwd(), 'brand/nearhost-logo-dark-500.png'))),
    {
      headers: { 'Content-Type': 'image/png' },
    },
  );
