---
title: Clerk sign-in on a remote dev server
description: Run a Clerk and Next.js app at a local HTTPS domain, such as https://local.myapp.com, with hot reload working, when the dev server runs on another machine.
sidebar:
  order: 5
---

:::note
Needs Nearhost 0.6.0 or later, which lets a project's main name be a domain that does not end in `.test`. Run `nearhost update` to get it. See [CLI](/docs/reference/cli/#nearhost-update).
:::

This guide gets Clerk sign-in working at `https://local.myapp.com` while your Next.js app runs on another machine. The worked example uses Clerk's Next.js SDK, `@clerk/nextjs`, with a Clerk development instance. The Clerk and Nearhost steps are the same for any stack.

## The symptom

A Clerk development instance is relaxed about where your app runs. It is built for an app on `localhost`, and it does not ask you to register a domain or a callback URL. When the app runs on a server or a VM, though, `localhost` in your browser is not where the app is.

A tunnel such as ngrok gets the page on screen, but often not much more. The page loads at the ngrok address, and then hot reload never connects. Recent versions of Next.js block requests for its dev resources, hot reload included, from any host it was not told about, and logs `Blocked cross-origin request to Next.js dev resource` on the server. Anything the app builds from a URL in its environment, such as an app URL set to `http://localhost:3000`, still points there. And the app is on the public internet while you work on it.

Nearhost serves the remote app on your laptop at a name you choose, with a trusted certificate, over SSH. The browser sees one stable HTTPS origin, the page and its hot reload connection come from that origin, and nothing is public.

If you only need one app and plain HTTP, forwarding port 3000 with `ssh -L` gets you `http://localhost:3000`, which a development instance accepts. Nearhost is for when you want HTTPS, a name per project, or a setup shaped like production.

## Pick a name

Use a name under a domain you own, such as `local.myapp.com`. It needs no DNS record: Nearhost points it at your laptop through `/etc/hosts` while the project is enabled. When the project is disabled, the name resolves as it normally would.

A real-domain name is shaped like production, where Clerk's Frontend API lives on a subdomain of your domain. Clerk's documentation does not say which local names a development instance accepts beyond `localhost`, so this guide uses a domain you own.

## Add the project

On the command line, give the name with `--alias`:

```sh
nearhost add --server mini '~/code/myapp' --alias local.myapp.com
```

```text
Added myapp on mini at https://local.myapp.com
Start it with `nearhost up`.
```

A name that does not end in `.test` needs your approval, because it can hide the real site. Typing it with `--alias` counts as approval.

To keep the name with the project, put it in a `.nearhostrc` in the project's root:

```yaml
version: 1
alias: local.myapp.com
```

Run `nearhost add` without `--alias`, and it asks before using the name, since you did not type it:

```text
$ nearhost add --server mini '~/code/myapp'
.nearhostrc asks for these, which need your approval:
  local.myapp.com on port 3000 (a real domain)
Approve these? [y/N]
```

The port is the one `next dev` listens on, 3000 unless you changed it. Give it the `web` role. The Next.js dev server serves pages, assets and hot reload from that one port, so it needs no `loopback` route.

See [Add a project](/docs/getting-started/add-a-project/) for the rest of the add flow, and [Main name](/docs/reference/config/#main-name) for how the name is approved and written to the hosts file.

## Set up Clerk

Use a development instance. It is the default for a new Clerk application, and its publishable key starts with `pk_test_`.

A development instance has nothing to register for the new name. There is no redirect URI or allowed domain to add. Its Frontend API lives at a Clerk address ending in `accounts.dev`, and your app talks to it across sites whatever the app's own name is. Clerk's own docs use development keys on preview domains such as `*.vercel.app` in the same way.

The **allowed origins** setting in Clerk's API is for browser extensions and similar apps, not for a web app on a development instance. Leave it alone.

In the Clerk Dashboard, open the **API keys** page and copy the keys into the app's `.env.local`:

```ini
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

These are the names `@clerk/nextjs` reads. If you set the app up with Clerk's `init` command, they are already there.

## Set up the app

Recent versions of Next.js only let their dev resources be requested from `localhost` and from the hostname `next dev` was started with. A page at `https://local.myapp.com` asks for them from `local.myapp.com`, so add that name to `allowedDevOrigins` in `next.config.ts`:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['local.myapp.com'],
};

export default nextConfig;
```

Write the hostname alone, without `https://` or a port. Restart `next dev` after changing it. The setting only affects development, so it is safe to commit.

Clerk's middleware stays as the quickstart has it: `clerkMiddleware()` in `proxy.ts` on Next.js 16 and later, or `middleware.ts` on Next.js 15 and earlier, at the root of the project or in `src/`. If you pass it `authorizedParties`, add the new origin, with the scheme:

```ts
export default clerkMiddleware({
  authorizedParties: ['https://local.myapp.com'],
});
```

Nearhost's proxy passes the `Host` header through unchanged and sets `X-Forwarded-Proto: https`, so the app sees the name you browse to. If the app keeps its own public URL in an environment variable, such as `NEXT_PUBLIC_APP_URL`, set it to `https://local.myapp.com`.

On another stack the idea is the same. Clerk needs nothing new, and the dev server needs to accept the new hostname. Vite, for example, wants it in `server.allowedHosts`. See [Dev servers and hot reload](/docs/concepts/dev-servers-and-hot-reload/).

## Check it works

Start the project with `nearhost up`, or from the interface, and open `https://local.myapp.com`. The page should load, Clerk's sign-in button should appear, and signing in should bring you back signed in. Edit a component, and the page should update without a reload.

When it does not:

- **The page loads, but edits do not show until you reload.** Next.js is blocking hot reload from the new name. The server log shows `Blocked cross-origin request to Next.js dev resource` with the hostname it saw. Add that hostname to `allowedDevOrigins` and restart `next dev`.
- **You sign in, but come back signed out, or requests return 401.** If `clerkMiddleware()` has `authorizedParties`, check that it lists `https://local.myapp.com` exactly, with `https` and no port. Check too that the publishable and secret keys come from the same instance.
- **Links or redirects you build yourself go to `localhost`.** They come from an environment variable that still says `http://localhost:3000`. Change it to `https://local.myapp.com`.

## Testing with production keys

Clerk's production keys only work on your production domain. Clerk describes a way round that for debugging, with a local subdomain over HTTPS on port 443, which Nearhost provides, but calls it strongly discouraged. See [using production keys in local development](https://clerk.com/docs/guides/development/troubleshooting/using-production-keys-in-development).

## When you still need ngrok

Nearhost is local-only. The name works in your browser on your laptop, and nowhere else. Use a public tunnel when:

- **Clerk sends webhooks.** Clerk sends them through Svix, from its servers, which cannot reach your laptop. Point the endpoint on the dashboard's **Webhooks** page at a tunnel to the server, such as `https://<your-tunnel>/api/webhooks`. Clerk's CLI also has `clerk webhooks listen --forward-to`, a relay that forwards deliveries to a local URL. Run it on the server, next to the app.
- **Someone outside needs the link.** A colleague or a client cannot open `local.myapp.com` from their machine.

You can run both: Nearhost for your own browser, and a tunnel just for the webhook endpoint.

:::note[Checked against]
These pages, on 2026-10-19:

- [Clerk: Next.js quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart)
- [Clerk: Express quickstart](https://clerk.com/docs/expressjs/getting-started/quickstart) (the API keys page)
- [Clerk: clerkMiddleware()](https://clerk.com/docs/reference/nextjs/clerk-middleware)
- [Clerk: environment variables](https://clerk.com/docs/guides/development/clerk-environment-variables)
- [Clerk: development and production instances](https://clerk.com/docs/guides/development/managing-environments)
- [Clerk: how Clerk works](https://clerk.com/docs/guides/how-clerk-works/overview)
- [Clerk: update an instance](https://clerk.com/docs/reference/backend/instance/update) (allowed origins)
- [Clerk: using production keys in local development](https://clerk.com/docs/guides/development/troubleshooting/using-production-keys-in-development)
- [Clerk: webhooks overview](https://clerk.com/docs/guides/development/webhooks/overview) and [syncing data with webhooks](https://clerk.com/docs/guides/development/webhooks/syncing)
- [Clerk changelog: CLI webhooks](https://clerk.com/changelog/2026-07-09-clerk-cli-webhooks-and-impersonate)
- [Next.js: allowedDevOrigins](https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins)

They were read, not run end to end. If a step no longer matches, please [open an issue](https://github.com/nearhost/landing/issues).
:::
