// Root-relative links go through here so they keep working when the site is built under a
// base path, as pull request previews are.
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export function url(path: string): string {
  return base + path;
}
