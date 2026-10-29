# HTTPS on a local dev domain

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/docs/getting-started/install/ becomes https://nearhost.dev/docs/getting-started/install.md.

Serve local development at a trusted HTTPS name, such as myapp.test or local.myapp.com, so secure-context browser APIs and Secure cookies work, and choose which kind of name to use.

> **Note:** Names under your own domain, such as `local.myapp.com`, need Nearhost 0.6.0 or later. `.test` names work on every version. Run `nearhost update` to get the latest. See [CLI](https://nearhost.dev/docs/reference/cli.md#nearhost-update).

Some things in local development only work over HTTPS. On your laptop you rarely notice, because browsers treat `http://localhost` as secure. Once you browse to the dev server by its address or by a name instead of `localhost`, which is usual when it runs on another machine, plain HTTP stops being enough.

## What needs HTTPS

Browsers give some features only to a secure context: a page served over HTTPS, or from `localhost`, `127.0.0.1` or a `*.localhost` name. On `http://192.168.1.20:8080` or `http://myapp.test`, these are missing:

- **Service workers.** `navigator.serviceWorker` is undefined, so offline support and push notifications cannot be tested.
- **The clipboard.** `navigator.clipboard` is undefined, so copy buttons fail.
- **Web Crypto.** `crypto.subtle` is undefined, which breaks libraries that hash or sign in the browser.
- **The camera and microphone.** `navigator.mediaDevices` is undefined.
- **Passkeys and geolocation.** WebAuthn and the Geolocation API refuse to run.

Cookies have the same rule. Browsers do not set a cookie marked `Secure` over plain HTTP. Chrome and Firefox make an exception for `localhost`, but Safari does not, so test secure cookies over HTTPS. That rules out `SameSite=None` cookies, which must be `Secure`, and the `__Host-` and `__Secure-` cookie prefixes. If your app sets these in production, it behaves differently in development without HTTPS.

A self-signed certificate is not a fix. The browser warns on every visit, and some features, such as service workers, refuse to load over a certificate it does not trust.

## Choosing a name

You need a name the browser resolves to the dev server, and a certificate for it that the browser trusts.

**A `.test` name, such as `myapp.test`.** `.test` is reserved for testing and never exists on the public internet, so it cannot clash with a real site. It is Nearhost's default, and works with no setup. Some third-party services, such as sign-in providers, may not accept a `.test` callback, or do not say whether they do.

**A name under your own domain, such as `local.myapp.com`.** It is shaped like production, so cookie scoping, cross-subdomain requests and provider settings behave as they do on staging. It needs no DNS record. Two things to know:

- Cookies your production site sets for the whole domain, with `Domain=myapp.com`, are sent to `local.myapp.com` too, if your browser has them.
- Nearhost writes the name to `/etc/hosts` only while the project is enabled. Disable the project, and the name reaches the real site again, if there is one. See [Main name](https://nearhost.dev/docs/reference/config.md#main-name).

Avoid `.dev`, which is a real top-level domain whose every name browsers force to HTTPS, and `.local`, which macOS and many Linux systems resolve with multicast DNS, and which can be slow to look up.

## Setting it up

If the dev server runs on your laptop, a tool such as mkcert and a line in `/etc/hosts` are enough. You make a local certificate authority, trust it, issue a certificate for the name, and point the dev server at it.

If the dev server runs on another machine, Nearhost does all of this on your laptop. It creates a local certificate authority the first time it starts, which you trust once with your password, and it issues a certificate for each project's name. Its proxy serves the name over HTTPS and forwards to the dev server over SSH. See [TLS and the proxy](https://nearhost.dev/docs/concepts/tls-and-the-proxy.md).

New to Nearhost? [Install it](https://nearhost.dev/docs/getting-started/install.md) and [add a server](https://nearhost.dev/docs/getting-started/add-a-server.md) first.

Add the project with the name you chose:

```sh
nearhost add --server mini '~/code/myapp' --alias local.myapp.com
```

Leave out `--alias` to use `myapp.test`. Then tell the app it lives at the HTTPS name: set its public URL, such as `APP_URL`, and trust the proxy's `X-Forwarded-Proto` header. The [WorkOS guide](https://nearhost.dev/docs/guides/workos-sign-in.md#set-up-the-app) shows both for Laravel. Single-port dev servers also need the name allowed: `allowedDevOrigins` in Next.js, `server.allowedHosts` in Vite. See [Dev servers and hot reload](https://nearhost.dev/docs/concepts/dev-servers-and-hot-reload.md).

## Sign-in providers

Sign-in providers are the most common reason to want a real HTTPS name. The guides set one up end to end:

- [WorkOS sign-in](https://nearhost.dev/docs/guides/workos-sign-in.md)
- [Clerk sign-in](https://nearhost.dev/docs/guides/clerk-sign-in.md)
- [Cognito sign-in](https://nearhost.dev/docs/guides/cognito-sign-in.md)

If the callback is what fails, see [SSO callback fails on a remote dev server](https://nearhost.dev/docs/guides/sso-callback-on-a-remote-dev-server.md).

## When ngrok is still the right tool

A Nearhost name only works on your laptop. Its proxy answers no other machine. Use a public tunnel, such as ngrok, when:

- **Another device needs the page,** such as your phone, to test a camera or a service worker on mobile.
- **Someone outside needs the link,** such as a colleague or a client.
- **A service sends webhooks,** from servers that cannot reach your laptop.
