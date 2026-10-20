// One social card per page, written to /og/<entry id>.png at build time.
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { renderOg } from '../../lib/og.mjs';

export const getStaticPaths = (async () => {
  const docs = await getCollection('docs');
  return [
    { params: { id: 'index' }, props: { title: 'Nearhost' } },
    ...docs.map((entry) => ({
      params: { id: entry.id },
      props: { title: entry.data.title, description: entry.data.description },
    })),
  ];
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params, props }) => {
  const png = await renderOg({
    id: params.id!,
    title: props.title,
    description: props.description,
  });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
