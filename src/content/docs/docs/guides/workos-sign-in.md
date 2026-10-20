---
title: WorkOS sign-in on a remote dev server
description: Give a WorkOS AuthKit app an HTTPS redirect URI in local dev, such as https://local.myapp.com/authenticate, when the dev server runs on another machine.
sidebar:
  order: 6
---

:::note
Needs Nearhost 0.6.0 or later, which lets a project's main name be a domain that does not end in `.test`. Run `nearhost update` to get it. See [CLI](/docs/reference/cli/#nearhost-update).
:::

New to Nearhost? [Install it](/docs/getting-started/install/) and [add a server](/docs/getting-started/add-a-server/) first.

This guide gets WorkOS AuthKit sign-in working at `https://local.myapp.com` while your Laravel app runs on another machine. The worked example uses the `laravel/workos` package from the Laravel starter kits, but the WorkOS and Nearhost steps are the same for any stack.

## The symptom

WorkOS sends the browser back to your app at a redirect URI you register in its dashboard. It has to match the URI your app sends exactly, including `https://` and the path. The staging environment accepts `http://localhost`, which is fine when the app runs on your laptop. When it runs on a server or a VM, `localhost` in your browser is not where the app is.

A tunnel such as ngrok gets the page on screen, but often not much more. The app still builds its links and assets from its own idea of where it lives, so redirects and scripts point back at `localhost` or at `http://`. Each tunnel name is one more redirect URI to register, and WorkOS's advice is to use a stable custom domain if you must use a tunnel at all.

Nearhost serves the remote app on your laptop at a name you choose, with a trusted certificate, over SSH. The browser sees one stable HTTPS origin, and that is the origin you register with WorkOS.

## Pick a name

Use a name under a domain you own, such as `local.myapp.com`. It needs no DNS record: Nearhost points it at your laptop through `/etc/hosts` while the project is enabled. When the project is disabled, the name resolves as it normally would.

A real-domain name keeps the redirect URI shaped like the one in production. WorkOS's documentation does not say whether it accepts `.test` names, so this guide uses a domain you own.

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

To keep the name with the project, put it in a [`.nearhostrc`](/docs/reference/nearhostrc/) in the project's root:

```yaml
version: 1
alias: local.myapp.com
```

Run `nearhost add` without `--alias`, and it asks before using the name, since you did not type it:

```text
$ nearhost add --server mini '~/code/myapp'
This project asks for these, which need your approval:
  local.myapp.com on port 8080 (a real domain)
Approve these? [y/N]
```

See [Add a project](/docs/getting-started/add-a-project/) for the rest of the add flow, and [Main name](/docs/reference/config/#main-name) for how the name is approved and written to the hosts file.

## Set up WorkOS

Do this in the WorkOS staging environment, which is meant for development. Its API keys, users and settings are separate from production's.

1. In the dashboard, open **Applications**, then your application, then the **Redirects** tab.
2. Add the redirect URI `https://local.myapp.com/authenticate`, and make it the default. With `laravel/workos` the callback route is `/authenticate`. No trailing slash.
3. Set the sign-in endpoint, which WorkOS's docs also call the initiate login URI, to `https://local.myapp.com/login`. AuthKit sends people there when sign-in starts outside your app, such as from a password reset or an invitation link.
4. On the same tab, add the sign-out URI `https://local.myapp.com/` and make it the default. Without a sign-out URI, WorkOS shows an error after sign-out, unless the app still has the older App homepage URL set. That setting is deprecated, and only kept as a fallback for existing apps.

Then copy the staging environment's client ID and API key into the app's `.env`, after `APP_URL`, which the redirect URL builds on:

```ini
APP_URL=https://local.myapp.com
WORKOS_CLIENT_ID=your-client-id
WORKOS_API_KEY=your-api-key
WORKOS_REDIRECT_URL="${APP_URL}/authenticate"
```

These are the names the starter kits read in `config/services.php`.

## Set up the app

`APP_URL` is set to the new name above, so the redirect URL follows it. If `APP_URL` is already further down the file, move it above `WORKOS_REDIRECT_URL`, which reads it.

If you have cached the config, run `php artisan config:clear`.

Nearhost's proxy ends HTTPS on your laptop and passes plain HTTP to the server, with `X-Forwarded-Proto: https`. Laravel ignores that header until it trusts the proxy, so it thinks the request was `http://`. The WorkOS callback is unaffected, because `laravel/workos` reads it from `WORKOS_REDIRECT_URL`. What goes wrong is everything Laravel builds from the request: `route()` and `url()` links, the redirect to the dashboard after sign-in, and `asset()` URLs.

The starter kit's `bootstrap/app.php` already has a `withMiddleware` closure. Add one line inside it (Laravel 11 and later):

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->trustProxies(at: '*');

    // The lines already there stay as they are.
})
```

`'*'` trusts the forwarded headers from any address. If this file also runs in production behind a known load balancer, list that load balancer's addresses plus `127.0.0.1`, or the Docker network's gateway under Sail, instead, or read the list from an environment variable. Nearhost's forward arrives from `127.0.0.1`, or from the Docker network's gateway under Sail, so leaving it out stops Laravel trusting it and brings back `http://` links.

If the page loads its scripts from Vite at `http://localhost:5173`, that port needs a `loopback` route so your browser can reach it. See [Dev servers and hot reload](/docs/concepts/dev-servers-and-hot-reload/). If `public/hot` says `http://[::1]:5173` instead, set `server.hmr.host` to `'localhost'` in `vite.config.js`, because the forward listens on `127.0.0.1` only. See [Vite on the IPv6 loopback address](/docs/guides/ngrok-assets-on-localhost/#vite-on-the-ipv6-loopback-address).

On another stack the idea is the same. Set the app's public URL to `https://local.myapp.com`, and tell the framework to trust `X-Forwarded-Proto` from the proxy, so it builds `https://` links and the callback URL it sends to WorkOS matches the one you registered.

## Check it works

Start the project with `nearhost up`, or from the interface, and open `https://local.myapp.com/login`. You should land on the AuthKit sign-in page, and after signing in come back to `https://local.myapp.com/authenticate` and on to the dashboard.

When it does not:

- **WorkOS shows an error instead of the sign-in page.** Usually the redirect URI your app sent is not on the Redirects tab of the environment whose keys you use. Compare them character by character: `https`, the host, `/authenticate`, no trailing slash. Check that `WORKOS_REDIRECT_URL` and `APP_URL` are what you expect, and that the keys are the staging ones.
- **Links, the redirect after sign-in, or asset URLs use `http://`.** Laravel does not trust the proxy yet. Add `trustProxies` as above. Nearhost redirects `http://` to HTTPS, so a link may still seem to work, but `http://` scripts and styles on an HTTPS page are blocked as mixed content. Look for those warnings in the console.
- **`/authenticate` returns 403.** `laravel/workos` keeps a state value in the session when you start sign-in, and refuses the callback when the session does not come back with it. Start sign-in at `https://local.myapp.com`, not at another address for the same app, and leave `SESSION_DOMAIN` unset (`null`) or set it to `local.myapp.com`. A cookie set for another domain never reaches this one.

## When you still need ngrok

Nearhost is local-only. The name works in your browser on your laptop, and nowhere else. Use a public tunnel when:

- **WorkOS sends webhooks.** They come from WorkOS's servers, which cannot reach your laptop. Point the staging webhook endpoint at a tunnel. Or use WorkOS's events API, where your app fetches events from WorkOS rather than receiving them.
- **Someone outside needs the link.** A colleague or a client cannot open `local.myapp.com` from their machine.

You can run both: Nearhost for your own browser, and a tunnel just for the webhook endpoint.

:::note[Checked against]
These pages, on 2026-10-19:

- [Laravel starter kits: WorkOS AuthKit authentication](https://laravel.com/docs/13.x/starter-kits#workos)
- [Laravel HTTP requests: configuring trusted proxies](https://laravel.com/docs/13.x/requests#configuring-trusted-proxies)
- [laravel/workos](https://github.com/laravel/workos) and the [React starter kit's WorkOS branch](https://github.com/laravel/react-starter-kit/tree/workos)
- [WorkOS: Redirect URIs](https://workos.com/docs/sso/redirect-uris)
- [WorkOS AuthKit: sessions](https://workos.com/docs/authkit/sessions) (sign-out URIs)
- [WorkOS: Staging and production environments](https://workos.com/docs/authkit/environments)
- [WorkOS AuthKit: configure your project](https://workos.com/docs/authkit/vanilla/nodejs/1-configure-your-project)
- [WorkOS: Redirect URIs for local, staging and production](https://workos.com/blog/redirect-uris-for-local-staging-and-production)
- [WorkOS: Data syncing with the events API or webhooks](https://workos.com/docs/events/data-syncing)

If a step no longer matches, please [open an issue](https://github.com/nearhost/landing/issues).
:::
