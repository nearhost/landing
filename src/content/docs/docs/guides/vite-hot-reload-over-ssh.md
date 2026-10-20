---
title: Vite hot reload fails over SSH port forwarding
description: Why Vite's scripts or hot reload fail when the dev server runs on another machine and you reach it through ssh -L, which port each setup has to forward, and how to keep it working without retyping forwards.
sidebar:
  order: 3
---

You run `npm run dev` on a server or a VM and forward a port to your laptop with `ssh -L`. The page loads, but edits never show up. Or the page loads without its styles and scripts. The browser console says `[vite] failed to connect to websocket`, or `[vite] server connection lost. Polling for restart...`, or the page is replaced by `Blocked request. This host ("…") is not allowed.`

The first two mean the browser is asking for an address the forward does not cover. Which address depends on whether Vite serves the page itself or sits beside a backend. The third means the forward works: the request reached Vite, and Vite refused the name you used, which `server.allowedHosts` fixes.

## Why it happens

Vite's hot reload client opens a WebSocket to the host and port its own script came from, unless `server.ws` says otherwise (`server.hmr` in older Vite). So hot reload works wherever the scripts load, and fails wherever they do not. If your config sets a separate WebSocket port, such as `server.ws.clientPort`, forward that port too.

### Vite serves the page

A plain Vite app, or a framework built on it, serves the page, its scripts and the hot reload socket from one port. Forward that port and the browser reaches all three:

```sh
ssh -L 5173:localhost:5173 myserver
```

Open `http://localhost:5173` and hot reload works. Two things still break it:

- **Opening it by another name.** Vite checks the `Host` header and refuses names it does not know, the page included, with `Blocked request. This host ("…") is not allowed.` `localhost`, `*.localhost` names and IP addresses are always allowed. For any other name, add it to `server.allowedHosts` in `vite.config.js`.
- **The connection dropping.** When `ssh` exits, so does the forward. The console says `server connection lost`, and nothing reloads until you run `ssh -L` again.

### Vite sits beside a backend

Laravel, Rails, Django and other backends render the HTML themselves, and the page loads its scripts from the Vite dev server on a second port, at an address such as `http://localhost:5173`. In Laravel, `laravel-vite-plugin` writes that address to `public/hot` when `npm run dev` starts, and every script tag on the page uses it.

Forwarding only the backend's port loads the HTML, and then the scripts fail, because your browser asks for `localhost:5173` on your laptop and nothing listens there. Forward the Vite port too, to the same port number on your laptop:

```sh
ssh -L 8000:localhost:8000 -L 5173:localhost:5173 myserver
```

The number has to match on both ends. `-L 3000:localhost:5173` reaches Vite, but the page still asks for 5173. If you run several projects, each needs its own Vite port, because two forwards cannot share 5173 on your laptop.

## Keeping it working with plain SSH

- **List the forwards in `~/.ssh/config`,** so one `ssh myserver` sets them all up:

  ```
  Host myserver
    LocalForward 8000 localhost:8000
    LocalForward 5173 localhost:5173
    ServerAliveInterval 15
  ```

- **Reconnect when it drops,** with `autossh` or a loop around `ssh -N`. With `ServerAliveInterval 15`, `ssh` notices a dead connection after about 45 seconds instead of hanging.
- **Add each new name** to `server.allowedHosts` if you open the app by a name other than `localhost` or a `*.localhost` name.

## How Nearhost handles it

New to Nearhost? [Install it](/docs/getting-started/install/) and [add a server](/docs/getting-started/add-a-server/) first.

Nearhost serves the project at a name such as `https://myapp.test`, over one SSH connection per server that it reconnects by itself, putting every forward back.

- **Vite serves the page.** Give its port the `web` role. The proxy passes the hot reload WebSocket through on the same origin. Add the name to `server.allowedHosts` once; with the `nearhost/vite` preset enabled, Nearhost shows the exact lines.
- **Vite sits beside a backend.** Give the Vite port the `loopback` role. Nearhost forwards it to the same port number on your laptop, so the page's `http://localhost:5173` reaches the remote dev server. Under Laravel Sail, discovery proposes this route for you. The page at `https://myapp.test` now loads its scripts from another origin, and Vite's default CORS policy allows only `localhost` pages. `laravel-vite-plugin` also allows `*.test` names and your `APP_URL`; with another integration, add the name to `server.cors.origin`.
- **Several projects.** Nearhost warns about two projects that want the same loopback port before they clash, and suggests a free one when the port comes from a variable.

From Nearhost 0.7.0, a loopback forward answers on both `127.0.0.1` and `[::1]`, so it still works when Vite listens on `::1` and `public/hot` says `http://[::1]:5173`. On Nearhost older than 0.7.0, the forward listens on `127.0.0.1` only, so set `server.hmr.host` to `'localhost'`.

For the details, see [Dev servers and hot reload](/docs/concepts/dev-servers-and-hot-reload/) and [Routes and roles](/docs/concepts/routes-and-roles/).

:::note[Checked against]
These, on 2026-10-20:

- The Vite 8.3 hot reload client and host check, in `vite/dist/client/client.mjs` and `vite/dist/node`
- [Vite: server options](https://vite.dev/config/server-options.html), for `server.ws`, `server.hmr`, `server.cors` and `server.allowedHosts`
- [OpenSSH: ssh_config(5)](https://man.openbsd.org/ssh_config), for `LocalForward`, `ServerAliveInterval` and `ServerAliveCountMax`

If something here no longer matches, please [open an issue](https://github.com/nearhost/landing/issues).
:::
