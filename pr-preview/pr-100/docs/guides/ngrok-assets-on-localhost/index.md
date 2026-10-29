# ngrok loads the page, but assets point at localhost

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-100/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-100/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-100/docs/getting-started/install.md.

Why a dev site behind ngrok still loads its scripts, redirects or hot reload from localhost or http://, how to patch each one, and how to skip the tunnel when the dev server runs on another machine.

You put your dev server behind ngrok and open the tunnel's address. The HTML arrives, and then something still points somewhere else: the scripts and styles try `localhost`, a redirect takes you to `http://localhost:8000`, or the page never updates when you edit a file. Sometimes the dev server refuses the request outright.

The tunnel did its job. It forwarded the request. The problem is that the page and the dev server still describe themselves with the addresses in their own config, and those addresses mean nothing in the browser that opened the tunnel.

## Why it happens

Three different things build URLs, and each one gets it wrong in its own way.

### The asset dev server

A backend framework that uses Vite renders the HTML itself, and the page loads its scripts from the Vite dev server on a separate port. In Laravel, the `@vite` directive reads the `public/hot` file, which `laravel-vite-plugin` writes when `npm run dev` starts. That file holds the dev server's own address, such as `http://localhost:5173` under Sail or `http://[::1]:5173` elsewhere, and every script tag on the page points there.

Your browser resolves that address on your laptop. If the dev server runs on another machine, nothing listens there, so scripts and styles fail to load and hot reload never connects. Even where something does answer, the Vite dev server only allows requests from the origins `laravel-vite-plugin` lists: `localhost`, `*.test`, `*.localhost` and your `APP_URL`. An ngrok address is none of them unless you put it in `APP_URL`.

Rails, Django and other backends that pair with Vite work the same way.

### Links and redirects

Most frameworks build absolute URLs from the request, or from a URL in their config.

- **From the request.** ngrok ends HTTPS at its edge and forwards to your dev server, adding `X-Forwarded-Proto: https`. A framework that does not trust the proxy ignores that header and builds `http://` links and redirects. If you started ngrok with `--host-header=rewrite`, the app sees the local address's hostname, usually `localhost`, and builds links to that.
- **From config.** Anything built from `APP_URL` or a similar setting, such as emails, queued jobs, or an OAuth redirect URI, uses whatever that setting says, usually `http://localhost:8000`.

### Host checks in single-port dev servers

Next.js and plain Vite serve pages, assets and hot reload from one port, so their assets use relative paths. What gets in the way is the dev server's host check:

- **Next.js** serves the page, assets included. Recent versions block its dev resources, hot reload included, from hostnames it was not told about, and log `Blocked cross-origin request to Next.js dev resource` on the server. The page loads, but edits never show.
- **Vite** refuses every request whose `Host` it does not recognise, the page included, and answers with `Blocked request. This host ("…") is not allowed.`, naming the host. Nothing loads until the host is in `server.allowedHosts`.

## Patching it with ngrok

Each patch fixes one of the three.

- **Assets.** Stop the dev server, which deletes `public/hot`, and run `npm run build`. Laravel then serves the built files from the app's own origin. You lose hot reload. On other backends, build the assets or tunnel the Vite port. Keeping hot reload means a second tunnel for port 5173, with Vite told to advertise that tunnel's address through `server.origin` and `server.hmr`, and that tunnel's hostname added to `server.allowedHosts`. Once `server.origin` is set, Laravel's Vite plugin allows only that origin through CORS, so also set `server.cors.origin` to the app tunnel's address, or the browser blocks the scripts.
- **Links and redirects.** Set `APP_URL` to the tunnel's address and make the framework trust the proxy. The [WorkOS guide](https://nearhost.dev/pr-preview/pr-100/docs/guides/workos-sign-in.md#set-up-the-app) shows the one-line `trustProxies` change for Laravel. If the tunnel name changes each time you start it, so does `APP_URL`.
- **Host checks.** Add the tunnel's hostname to `allowedDevOrigins` in `next.config.ts`, or to `server.allowedHosts` in Vite's config.

## How Nearhost avoids it

New to Nearhost? [Install it](https://nearhost.dev/pr-preview/pr-100/docs/getting-started/install.md) and [add a server](https://nearhost.dev/pr-preview/pr-100/docs/getting-started/add-a-server.md) first.

When the dev server runs on another machine, Nearhost serves it on your laptop at a name such as `https://myapp.test`, with a trusted certificate, over SSH. Nothing is public, and the name stays the same every time.

- **Assets.** A `loopback` route forwards the Vite port, so `http://localhost:5173` in your browser reaches port 5173 on the remote machine. `.test` names are already on the Vite dev server's allowed origins. Under Laravel Sail, Nearhost proposes the route for you. See [Dev servers and hot reload](https://nearhost.dev/pr-preview/pr-100/docs/concepts/dev-servers-and-hot-reload.md).
- **Links and redirects.** The proxy passes the `Host` header through unchanged and sets `X-Forwarded-Proto: https`. Set `APP_URL` to the Nearhost name once, and trust the proxy as above.
- **Host checks.** Add the Nearhost name to `allowedDevOrigins` or `server.allowedHosts` once. It does not change between runs.

### Vite on the IPv6 loopback address

A Vite dev server that listens on `::1` makes `laravel-vite-plugin` write `http://[::1]:5173` to `public/hot`. A loopback forward answers on both `127.0.0.1` and `[::1]`, so that works as it is. This needs Nearhost 0.7.0 or later and a laptop with the IPv6 loopback, which every Mac and almost every Linux machine has. Otherwise, see [Vite on `[::1]`](https://nearhost.dev/pr-preview/pr-100/docs/concepts/dev-servers-and-hot-reload.md#vite-on-1).

## The guides

The sign-in guides walk through all of this for one app each, at a name under your own domain:

- [WorkOS sign-in](https://nearhost.dev/pr-preview/pr-100/docs/guides/workos-sign-in.md), with Laravel
- [Clerk sign-in](https://nearhost.dev/pr-preview/pr-100/docs/guides/clerk-sign-in.md), with Next.js
- [Cognito sign-in](https://nearhost.dev/pr-preview/pr-100/docs/guides/cognito-sign-in.md), with Laravel

## When ngrok is still the right tool

Nearhost only answers your own laptop. Keep a tunnel for:

- **Webhooks.** A payment provider, an auth provider or GitHub sends them from its own servers, which cannot reach your laptop.
- **Sharing a link.** A colleague, a client, or your phone cannot open a Nearhost name.

You can run both: Nearhost for your own browser, and a tunnel for the one endpoint that the outside world has to reach.
