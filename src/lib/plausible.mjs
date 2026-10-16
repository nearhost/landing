// Plausible analytics for nearhost.dev. The script is site-specific; the ID comes from the
// site's installation page on plausible.io.
export const plausibleSrc = 'https://plausible.io/js/pa-USk6rawZJ21LlB1c6IzUW.js';

export const plausibleInit =
  'window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},' +
  'plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()';

/**
 * Only the live site is tracked: not `astro dev`, and not pull request previews, which are
 * built under /pr-preview/pr-<number>/.
 * @param {string} base
 * @param {boolean} prod
 */
export const tracked = (base, prod) => prod && base === '/';
