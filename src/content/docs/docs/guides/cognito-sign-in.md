---
title: Cognito sign-in on a remote dev server
description: Give an Amazon Cognito app client an HTTPS callback URL in local dev, such as https://local.myapp.com/auth/cognito/callback, when the dev server runs on another machine.
sidebar:
  order: 6
---

:::note
Needs Nearhost 0.6.0 or later, which lets a project's main name be a domain that does not end in `.test`. Run `nearhost update` to get it. See [CLI](/docs/reference/cli/#nearhost-update).
:::

New to Nearhost? [Install it](/docs/getting-started/install/) and [add a server](/docs/getting-started/add-a-server/) first.

This guide gets Amazon Cognito sign-in working at `https://local.myapp.com` while your Laravel app runs on another machine. The worked example uses Laravel Socialite with the community `socialiteproviders/cognito` provider and Cognito's managed login pages. The Cognito and Nearhost steps are the same for any stack.

## The symptom

Cognito sends the browser back to your app at a callback URL you list on the app client. Every callback URL has to use HTTPS, with one exception: `http://localhost`, which Cognito allows for testing. When the app runs on your laptop, that exception is all you need.

When the app runs on a server or a VM, `localhost` in your browser is not where the app is. You can forward a port with `ssh -L` and use `http://localhost:8080`, and for one app that works. It stops being enough when:

- **You run more than one app.** Browsers do not separate cookies by port, so two apps on `localhost` can overwrite each other's session cookies.
- **The app shares cookies across subdomains.** An app that sets cookies for `myapp.com`, or talks to an API on another subdomain, only behaves as it does on staging when it runs under that domain.
- **You want local dev to match staging.** Staging's callback is HTTPS on your domain. With `http://localhost`, the scheme, the host and the cookie rules all differ from what you deploy.
- **The page uses browser APIs that need a secure context**, such as service workers or the clipboard. Browsers count `http://localhost` as secure, so these work there, but on any other name, such as the server's own address, they need HTTPS.

A tunnel such as ngrok gives you HTTPS, but each new tunnel name is one more callback URL to add, and the app still builds its links from its own idea of where it lives. It also puts the app on the public internet while you work on it.

Nearhost serves the remote app on your laptop at a name you choose, with a trusted certificate, over SSH. The browser sees one stable HTTPS origin, and that is the origin you list on the Cognito app client.

## Pick a name

Use a name under a domain you own, such as `local.myapp.com`. It needs no DNS record: Nearhost points it at your laptop through `/etc/hosts` while the project is enabled. When the project is disabled, the name resolves as it normally would.

A real-domain name keeps the callback URL shaped like the one on staging and in production. Cognito's documentation asks for HTTPS but does not say whether it accepts `.test` names, so this guide uses a domain you own.

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
  local.myapp.com on port 8080 (a real domain)
Approve these? [y/N]
```

See [Add a project](/docs/getting-started/add-a-project/) for the rest of the add flow, and [Main name](/docs/reference/config/#main-name) for how the name is approved and written to the hosts file.

## Set up Cognito

Use a user pool for development, separate from production's. Its users, app clients and settings are its own.

1. The pool needs a domain for its sign-in pages. In the [Amazon Cognito console](https://console.aws.amazon.com/cognito/home), open the user pool, then **Domain** under **Branding**. If there is no domain, choose **Actions**, then **Create Cognito domain**, and pick a prefix. The domain looks like `https://myapp-dev.auth.eu-west-2.amazoncognito.com`. Either branding version, **Managed login** or **Hosted UI (classic)**, works for this guide.
2. Open **App clients** and create an app client with the application type **Traditional web application**. That type gives the client a secret, which Socialite needs. You cannot add a secret to an existing client later, so if yours has none, create a new one. When it asks for a **Return URL**, enter `https://local.myapp.com/auth/cognito/callback`.
3. Open the app client, then the **Login pages** tab. Under **Managed login pages configuration**, choose **Edit**.
4. Check that **Allowed callback URLs** has `https://local.myapp.com/auth/cognito/callback`. It must match the URL your app sends exactly: `https`, the host, the path, no trailing slash.
5. Add `https://local.myapp.com/` to **Allowed sign-out URLs**. Cognito only sends people back after sign-out to a URL on this list.
6. Under **Identity providers**, keep the user pool's own sign-in, or whichever providers your users sign in with. Under **OAuth grant types**, choose **Authorization code grant**. Under **OpenID Connect scopes**, choose `openid`, `email` and `profile`. Save the changes.

Then set `APP_URL` in the app's `.env` to the new name, and copy the domain and the app client's ID and secret below it. The last two lines build on `APP_URL`, so they have to come after it:

```ini
APP_URL=https://local.myapp.com

COGNITO_HOST=https://myapp-dev.auth.eu-west-2.amazoncognito.com
COGNITO_CLIENT_ID=your-client-id
COGNITO_CLIENT_SECRET=your-client-secret
COGNITO_CALLBACK_URL="${APP_URL}/auth/cognito/callback"
COGNITO_SIGN_OUT_URL="${APP_URL}/"
```

These are the names in the provider's README. `COGNITO_HOST` is the full domain with `https://` and no trailing slash.

## Set up the app

Install the provider, which brings in Socialite:

```sh
composer require socialiteproviders/cognito
```

Add the Cognito entry to `config/services.php`:

```php
'cognito' => [
    'host' => env('COGNITO_HOST'),
    'client_id' => env('COGNITO_CLIENT_ID'),
    'client_secret' => env('COGNITO_CLIENT_SECRET'),
    'redirect' => env('COGNITO_CALLBACK_URL'),
    'logout_uri' => env('COGNITO_SIGN_OUT_URL'),
],
```

The README's version also has a `scope` line. The provider does not read it, so this guide sets scopes in code instead.

Register the provider in the `boot` method of `app/Providers/AppServiceProvider.php` (Laravel 11 and later):

```php
use Illuminate\Support\Facades\Event;
use SocialiteProviders\Cognito\Provider;
use SocialiteProviders\Manager\SocialiteWasCalled;

public function boot(): void
{
    Event::listen(function (SocialiteWasCalled $event) {
        $event->extendSocialite('cognito', Provider::class);
    });
}
```

Then add the routes to `routes/web.php`. The provider asks for `openid` and `profile` by default; `scopes()` adds `email` to them:

```php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Laravel\Socialite\Socialite;

Route::get('/auth/cognito/redirect', function () {
    return Socialite::driver('cognito')->scopes(['email'])->redirect();
});

Route::get('/auth/cognito/callback', function () {
    $cognitoUser = Socialite::driver('cognito')->user();

    // Find or create your user from $cognitoUser, then Auth::login($user).

    return redirect('/dashboard');
});

Route::post('/auth/cognito/logout', function (Request $request) {
    Auth::logout();

    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return redirect(Socialite::driver('cognito')->logoutCognitoUser());
});
```

`logoutCognitoUser()` sends the browser to Cognito's sign-out page with `COGNITO_SIGN_OUT_URL`, and Cognito sends it back there.

With `APP_URL` set to `https://local.myapp.com`, the callback and sign-out URLs follow it. If you have cached the config, run `php artisan config:clear`.

Nearhost's proxy ends HTTPS on your laptop and passes plain HTTP to the server, with `X-Forwarded-Proto: https`. Laravel ignores that header until it trusts the proxy, so it thinks the request was `http://`. The callback is unaffected while `COGNITO_CALLBACK_URL` is a full URL, because Socialite uses it as it is. A path such as `/auth/cognito/callback` would be built from the request instead, as `http://`, and Cognito would refuse it. What goes wrong either way is everything Laravel builds from the request: `route()` and `url()` links, the redirect to `/dashboard` after sign-in, and `asset()` URLs.

The fix is one line in the `withMiddleware` closure in `bootstrap/app.php`:

```php
$middleware->trustProxies(at: '*');
```

The [WorkOS guide](/docs/guides/workos-sign-in/#set-up-the-app) explains it, and what to list instead of `'*'` if the file also runs in production behind a known load balancer.

If the page loads its scripts from Vite at `http://localhost:5173`, that port needs a `loopback` route so your browser can reach it. See [Dev servers and hot reload](/docs/concepts/dev-servers-and-hot-reload/). If `public/hot` says `http://[::1]:5173` instead, set `server.hmr.host` to `'localhost'` in `vite.config.js`, because the forward listens on `127.0.0.1` only. See [Vite on the IPv6 loopback address](/docs/guides/ngrok-assets-on-localhost/#vite-on-the-ipv6-loopback-address).

On another stack the idea is the same. Use any OpenID Connect client with the pool's domain and the app client's ID and secret. Set the app's public URL and its callback URL to `https://local.myapp.com`, and tell the framework to trust `X-Forwarded-Proto` from the proxy, so it builds `https://` links and the callback URL it sends to Cognito matches the one you listed.

## Check it works

Start the project with `nearhost up`, or from the interface, and open `https://local.myapp.com/auth/cognito/redirect`. You should land on Cognito's sign-in page, and after signing in come back to `https://local.myapp.com/auth/cognito/callback` and on to the dashboard.

When it does not:

- **Cognito shows an error page instead of the sign-in page.** Usually the callback URL your app sent is not in **Allowed callback URLs** on the app client whose ID you use. Compare them character by character: `https`, the host, `/auth/cognito/callback`, no trailing slash. Check that `COGNITO_CALLBACK_URL` and `APP_URL` are what you expect.
- **You come back with `error=invalid_scope` in the address.** The app asked for a scope the app client does not allow. Add `openid`, `email` and `profile` under **OpenID Connect scopes**, or ask for fewer.
- **The callback fails with `InvalidStateException`.** Socialite keeps a state value in the session when you start sign-in, and refuses the callback when the session does not come back with it. Start sign-in at `https://local.myapp.com`, not at another address for the same app, and leave `SESSION_DOMAIN` unset (`null`) or set it to `local.myapp.com`. A cookie set for another domain never reaches this one.
- **Links, the redirect after sign-in, or asset URLs use `http://`.** Laravel does not trust the proxy yet. Add `trustProxies` as above. Nearhost redirects `http://` to HTTPS, so a link may still seem to work, but `http://` scripts and styles on an HTTPS page are blocked as mixed content. Look for those warnings in the console.
- **Sign-out does not come back to `https://local.myapp.com/`.** Cognito only redirects to a URL in **Allowed sign-out URLs**. Check that `COGNITO_SIGN_OUT_URL` is on that list exactly, trailing slash included.

## When you still need ngrok

Nearhost is local-only. The name works in your browser on your laptop, and nowhere else.

Cognito itself does not need to reach your app. The browser carries the sign-in there and back, and your server calls Cognito, not the other way round. Cognito's hooks into sign-up and sign-in are Lambda triggers, which run in AWS, not webhooks sent to your app. Use a public tunnel when:

- **Something in AWS calls your app.** A Lambda trigger, or anything else running in AWS, cannot reach your laptop or your dev server. If a trigger calls your app's API, point it at a tunnel.
- **Someone outside needs the link.** A colleague or a client cannot open `local.myapp.com` from their machine.

You can run both: Nearhost for your own browser, and a tunnel just for whatever AWS has to call.

:::note[Checked against]
These pages, on 2026-10-19:

- [socialiteproviders/cognito README](https://github.com/SocialiteProviders/Providers/blob/master/src/Cognito/README.md) and [provider source](https://github.com/SocialiteProviders/Providers/blob/master/src/Cognito/Provider.php)
- [SocialiteProviders Manager: how provider config is read](https://github.com/SocialiteProviders/Manager/blob/master/src/Helpers/ConfigRetriever.php) and [how the redirect URL is formatted](https://github.com/SocialiteProviders/Manager/blob/master/src/Config.php)
- [Laravel Socialite](https://laravel.com/docs/13.x/socialite)
- [Laravel HTTP requests: configuring trusted proxies](https://laravel.com/docs/13.x/requests#configuring-trusted-proxies)
- [Amazon Cognito: application-specific settings with app clients](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-client-apps.html)
- [Amazon Cognito: user pool managed login](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-managed-login.html)
- [Amazon Cognito: using the prefix domain for managed login](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-assign-domain-prefix.html)
- [Amazon Cognito: the authorize endpoint](https://docs.aws.amazon.com/cognito/latest/developerguide/authorization-endpoint.html)
- [Amazon Cognito: the logout endpoint](https://docs.aws.amazon.com/cognito/latest/developerguide/logout-endpoint.html)
- [Amazon Cognito: OIDC identity providers](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-oidc-idp.html) (the **Login pages** tab)
- [Amazon Cognito: Lambda triggers](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-working-with-lambda-triggers.html)

If a step no longer matches, please [open an issue](https://github.com/nearhost/landing/issues).
:::
