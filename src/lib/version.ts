const RELEASES = 'https://api.github.com/repos/nearhost/nearhost/releases/latest';

let cached: Promise<string> | undefined;

async function fetchVersion(): Promise<string> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return 'latest';
  try {
    const res = await fetch(RELEASES, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'nearhost-landing-build',
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return 'latest';
    const data = (await res.json()) as { tag_name?: string };
    return typeof data.tag_name === 'string' && data.tag_name.length > 0 ? data.tag_name : 'latest';
  } catch {
    return 'latest';
  }
}

export function latestVersion(): Promise<string> {
  return (cached ??= fetchVersion());
}
