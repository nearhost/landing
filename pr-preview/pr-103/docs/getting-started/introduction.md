# Introduction

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-103/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-103/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-103/docs/getting-started/install.md.

What Nearhost does, who it is for, and how to get a remote project open in your browser.

Nearhost opens your dev servers at trusted `https://name.test` addresses, whether they run on this machine or on another one you reach over SSH. For a remote server it uses the SSH access you already have and installs nothing there.

## Who it is for

You run dev servers on your laptop, or somewhere else: a desktop under the desk, a home server, a VPS. Over there the app listens on `localhost`, and your browser is over here.

Without Nearhost that means an `ssh -L` flag per port, a certificate warning, and hot reload that fails to connect. With it, each project has a name, a certificate your browser trusts, and forwards that reconnect on their own.

## What you get

- **One address per project.** `https://myapp.test` today, tomorrow and after a reboot.
- **Real HTTPS.** Secure cookies, OAuth callbacks and service workers behave as they do in production.
- **Hot reload and WebSockets.** They travel through the same SSH connection.
- **Nothing installed on the server.** No daemon, no open ports, and nothing written to your project unless you run `nearhost export`. Nearhost only keeps a socket in `~/.nearhost` there, so a coding agent on the server can reach it. If `ssh <host>` works without a prompt, Nearhost works.
- **Any stack.** Nearhost routes ports. It finds them in `.env`, and [presets](https://nearhost.dev/pr-preview/pr-103/docs/concepts/presets-and-registries.md) teach it Compose files, Vite and Laravel Sail. You can set routes by hand for anything else.

## Quick start

Install the binary:

```sh
curl -fsSL https://nearhost.dev/install.sh | sh
```

Start it. The first time, it offers to trust its local certificate authority so your browser accepts its certificates:

```sh
nearhost
```

Then press `s` to add a server, `n` to add a project on it or on this machine, and `o` to open it. Nearhost starts each project as soon as it is added, and every enabled project each time it opens. `q` quits and stops them all.

The same steps from the command line, which offers to add `mini` when it is not a server yet:

```sh
nearhost add --server mini ~/code/myapp
nearhost up myapp
```

`nearhost doctor` checks your setup at any time.

## Where to go next

- [Install](https://nearhost.dev/pr-preview/pr-103/docs/getting-started/install.md) covers the installer, Homebrew, npm and Linux setup.
- [Add a server](https://nearhost.dev/pr-preview/pr-103/docs/getting-started/add-a-server.md) and [Add a project](https://nearhost.dev/pr-preview/pr-103/docs/getting-started/add-a-project.md) walk through each screen.
- [Presets and registries](https://nearhost.dev/pr-preview/pr-103/docs/concepts/presets-and-registries.md) explains how Nearhost learns a framework's ports.
- [Dev servers and hot reload](https://nearhost.dev/pr-preview/pr-103/docs/concepts/dev-servers-and-hot-reload.md) explains how assets and live reload reach your browser.
- [SSO callback fails on a remote dev server](https://nearhost.dev/pr-preview/pr-103/docs/guides/sso-callback-on-a-remote-dev-server.md) fixes sign-in that breaks on a remote dev server. [HTTPS on a local dev domain](https://nearhost.dev/pr-preview/pr-103/docs/guides/https-on-a-local-dev-domain.md) and [ngrok loads the page, but assets point at localhost](https://nearhost.dev/pr-preview/pr-103/docs/guides/ngrok-assets-on-localhost.md) cover the HTTPS name and the asset URLs.

## When to use something else

Nearhost serves your own browser on your own machine. To show a page to a client or a teammate, use a public tunnel service. To reach a database or another non-HTTP port, a plain `ssh -L` forward is still the right tool.
