// The schema.org entities every page refers to, so search engines and AI assistants see one
// Nearhost, made by one person, whichever page they read first.

/** @param {URL | string} site */
const at = (site, path) => new URL(path, site).href;

/** @param {URL | string} site */
export const ids = (site) => ({
  organization: at(site, '/#organization'),
  person: at(site, '/#maker'),
  website: at(site, '/#website'),
  software: at(site, '/#software'),
});

/**
 * The organisation, its maker and the website. Absolute URLs always point at production,
 * so previews describe the live site.
 * @param {URL | string} site
 */
export function entities(site) {
  const id = ids(site);
  return [
    {
      '@type': 'Organization',
      '@id': id.organization,
      name: 'Nearhost',
      url: at(site, '/'),
      logo: at(site, '/logo.png'),
      founder: { '@id': id.person },
      sameAs: ['https://github.com/nearhost'],
    },
    {
      '@type': 'Person',
      '@id': id.person,
      name: 'Edward Coleridge Smith',
      url: 'https://github.com/edcs',
      sameAs: ['https://github.com/edcs'],
    },
    {
      '@type': 'WebSite',
      '@id': id.website,
      name: 'Nearhost',
      url: at(site, '/'),
      publisher: { '@id': id.organization },
    },
  ];
}

/**
 * A docs page as a technical article, dated by its last commit.
 * @param {URL | string} site
 * @param {{ url: string, title: string, description?: string, image: string, modified?: Date }} page
 */
export function techArticle(site, page) {
  const id = ids(site);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        '@id': `${page.url}#article`,
        headline: page.title,
        ...(page.description ? { description: page.description } : {}),
        url: page.url,
        image: page.image,
        ...(page.modified ? { dateModified: page.modified.toISOString() } : {}),
        inLanguage: 'en',
        author: { '@id': id.person },
        publisher: { '@id': id.organization },
        isPartOf: { '@id': id.website },
        about: { '@id': id.software },
      },
      ...entities(site),
    ],
  };
}

/**
 * JSON-LD ready for a script element: a "<" in any value, such as "</script>" in a title,
 * cannot end the element early.
 * @param {unknown} data
 */
export const jsonLd = (data) => JSON.stringify(data).replace(/</g, '\\u003c');
