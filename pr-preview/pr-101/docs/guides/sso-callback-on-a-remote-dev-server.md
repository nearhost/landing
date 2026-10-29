# SSO callback fails on a remote dev server

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-101/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-101/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-101/docs/getting-started/install.md.

Why an SSO or OAuth sign-in callback fails, or lands on localhost or the wrong origin, when your dev server runs on a server or VM, and how to give it one HTTPS address that works.

> **Note:** The fix on this page uses a name under your own domain, which needs Nearhost 0.6.0 or later. Run `nearhost update` to get it. See [CLI](https://nearhost.dev/pr-preview/pr-101/docs/reference/cli.md#nearhost-update).

Sign-in works when the app runs on your laptop. Move the dev server to a server or a VM, and it falls apart: the provider shows a redirect URI error, or you sign in and land on `localhost` with nothing there, or you come back to the app and it says the sign-in state is invalid.

## Why it happens

Sign-in with an SSO or OAuth provider is a round trip through your browser. The app sends the browser to the provider with a callback URL. The provider checks that URL against the list you registered, and after sign-in sends the browser back to it. The callback has to be right three times over: the app has to send it, the provider has to accept it, and your browser has to reach the app at it.

A remote dev server breaks one of those, depending on the address you use.

- **`http://localhost`.** Most providers accept it for development, and the app sends it happily. But your browser resolves `localhost` on your laptop, so after sign-in it lands where nothing is listening. Forwarding the port with `ssh -L` fixes that for one app.
- **The server's own address,** such as `http://192.168.1.20:8080`. The browser reaches it, but providers that allow plain HTTP usually allow it only for `localhost`. Cognito, for example, requires HTTPS for every other callback.
- **A tunnel,** such as ngrok. It gives you HTTPS, but each new tunnel name is one more callback to register, and the app still builds its callback from its own config. If that says `http://localhost`, or the app does not trust the tunnel and builds `http://`, the URL it sends does not match the one you registered. See [ngrok loads the page, but assets point at localhost](https://nearhost.dev/pr-preview/pr-101/docs/guides/ngrok-assets-on-localhost.md).

There is a fourth failure that looks the same. Most integrations store a state value in a session cookie when sign-in starts, and check it on the callback. If you start sign-in at one address and come back at another, the cookie does not come with you, and the callback is refused. In Laravel, `laravel/workos` answers with a 403, and Socialite throws an `InvalidStateException`.

## The fix: one HTTPS address everywhere

New to Nearhost? [Install it](https://nearhost.dev/pr-preview/pr-101/docs/getting-started/install.md) and [add a server](https://nearhost.dev/pr-preview/pr-101/docs/getting-started/add-a-server.md) first.

Pick one address and use it in all three places: the URL your browser opens, the callback the app sends, and the callback the provider has registered. It has to be HTTPS, and your browser has to reach the remote app at it.

Nearhost gives you that address. It serves the remote dev server on your laptop at a name you choose, such as `https://local.myapp.com`, with a trusted certificate, over SSH. Add the project with that name:

```sh
nearhost add --server mini '~/code/myapp' --alias local.myapp.com
```

Then, on the app and provider side:

1. **Register the callback** with the provider, on that name: for example `https://local.myapp.com/auth/callback`. Use the provider's development or staging environment.
2. **Set the app's public URL** to `https://local.myapp.com`, in `APP_URL` or whatever your framework reads, so the callback the app sends matches.
3. **Trust the proxy.** Nearhost ends HTTPS on your laptop and sets `X-Forwarded-Proto: https`. A framework that ignores the header builds `http://` links and redirects. In Laravel, that is one `trustProxies` line; the [WorkOS guide](https://nearhost.dev/pr-preview/pr-101/docs/guides/workos-sign-in.md#set-up-the-app) shows it.
4. **Start sign-in at the same name.** Open `https://local.myapp.com`, not the server's address or an old tunnel, so the state cookie comes back.

## The guides

Each provider has its own setup, and its own way of failing. The guides cover them step by step:

- [WorkOS sign-in](https://nearhost.dev/pr-preview/pr-101/docs/guides/workos-sign-in.md): the redirect URI on the **Redirects** tab, with Laravel and `laravel/workos`.
- [Clerk sign-in](https://nearhost.dev/pr-preview/pr-101/docs/guides/clerk-sign-in.md): a development instance needs no callback registered at all, and what breaks is the dev server's hot reload. With Next.js.
- [Cognito sign-in](https://nearhost.dev/pr-preview/pr-101/docs/guides/cognito-sign-in.md): **Allowed callback URLs** on the app client, with Laravel and Socialite.

For other providers, such as Auth0, Okta or Google, the same four steps apply. Find where the provider lists allowed callback or redirect URLs, and add the HTTPS one.

## When ngrok is still the right tool

Nearhost is local-only. The name works in your browser on your laptop, and nowhere else. The sign-in round trip goes through your browser, so it does not need a tunnel. Keep one for:

- **Webhooks.** A provider that sends events to your app does so from its own servers, which cannot reach your laptop.
- **Sharing a link.** A colleague or a client cannot open `local.myapp.com` from their machine.
