---
title: Introduction
description: What Nearhost does, who it is for, and how to get a remote project open in your browser.
sidebar:
  order: 0
---

Nearhost opens a dev server that runs on another machine at a trusted `https://name.test` address on your laptop. It uses the SSH access you already have and installs nothing on the server.

## Who it is for

You write code on a laptop and run it somewhere else: a desktop under the desk, a home server, a VPS. The app listens on `localhost` over there, and your browser is over here.

Without Nearhost that means an `ssh -L` flag per port, a certificate warning, and hot reload that fails to connect. With it, each project has a name, a certificate your browser trusts, and forwards that reconnect on their own.

## What you get

- **One address per project.** `https://myapp.test` today, tomorrow and after a reboot.
- **Real HTTPS.** Secure cookies, OAuth callbacks and service workers behave as they do in production.
- **Hot reload and WebSockets.** They travel through the same SSH connection.
- **Nothing on the server.** No agent, no config changes, no open ports. If `ssh <host>` works, Nearhost works.
- **Any stack.** Nearhost routes ports. It reads Compose files and Vite configs to propose them, and you can enter them by hand for anything else.

## Quick start

Install the binary:

```sh
curl -fsSL https://nearhost.dev/install.sh | sh
```

Start it. The first run sets up the local certificate authority:

```sh
nearhost
```

Then press `n` to add a server, `n` again to add a project, and `o` to open it. The same steps from the command line:

```sh
nearhost add --server mini ~/code/myapp
nearhost up myapp
```

## Where to go next

- [Install](/docs/getting-started/install/) covers Homebrew, npm and Linux setup.
- [Add a server](/docs/getting-started/add-a-server/) and [Add a project](/docs/getting-started/add-a-project/) walk through each screen.
- [Dev servers and hot reload](/docs/concepts/dev-servers-and-hot-reload/) explains how assets and live reload reach your browser.

## When to use something else

Nearhost serves your own browser on your own machine. To show a page to a client or a teammate, use a public tunnel service. To reach a database or another non-HTTP port, a plain `ssh -L` forward is still the right tool.
