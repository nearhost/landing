// Serves each docs page as Markdown, for the two route files that mount it at
// docs/<slug>.md and docs/<slug>/index.md.
import { getCollection, type CollectionEntry } from 'astro:content';
import type { APIRoute } from 'astro';
import { siteUrl, toMarkdown } from './markdown-twin.mjs';

export async function getStaticPaths() {
  const entries = await getCollection('docs', ({ id }) => id.startsWith('docs/'));
  return entries.map((entry) => ({
    params: { slug: entry.id.slice('docs/'.length) },
    props: { entry },
  }));
}

export const GET: APIRoute = ({ props }) => {
  const { id, data, body } = (props as { entry: CollectionEntry<'docs'> }).entry;
  const markdown = toMarkdown(
    { id, title: data.title, description: data.description, body: body ?? '' },
    siteUrl(import.meta.env.BASE_URL),
  );
  return new Response(markdown, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
