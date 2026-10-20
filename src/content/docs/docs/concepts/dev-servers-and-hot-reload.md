---
title: Dev servers and hot reload
description: How assets and live reload reach your browser, and when a project needs a loopback forward.
sidebar:
  order: 7
---

A page served from `https://<alias>` usually needs a second thing to work: the dev server that builds its scripts and pushes live updates. There are two ways that server shows up, and Nearhost handles both.

## The dev server is the web app

A Vite, Next.js or similar project serves pages and assets from one port. Give that port the `web` role and you are done. Hot reload uses a WebSocket on the same origin, and the proxy passes WebSocket upgrades through.

Vite checks the `Host` header, so it needs the alias in `server.allowedHosts`. With the `nearhost/vite` preset enabled, Nearhost shows the exact lines to add. See [Advisories](/docs/reference/advisories/).

## The dev server sits beside a backend

A backend framework renders the HTML, and the page loads its scripts from a separate dev server at an address like `http://localhost:5173`. Rails, Django and Laravel projects that use Vite all work this way.

That address is resolved by your browser, on your laptop. Nothing listens there, so scripts fail to load and hot reload never connects.

A `loopback` route fixes it. Nearhost forwards the same port number on your laptop to the dev server on the remote machine, so `localhost:5173` in the browser reaches port 5173 over there. The remote project needs no changes, as long as the page asks for `localhost`.

The forward listens on `127.0.0.1` only. A Laravel project outside Sail whose Vite listens on `::1` writes `http://[::1]:5173` to `public/hot`, and the browser finds nothing there. Set `server.hmr.host` to `'localhost'` in `vite.config.js`. See [Vite on the IPv6 loopback address](/docs/guides/ngrok-assets-on-localhost/#vite-on-the-ipv6-loopback-address).

Discovery proposes a loopback route only under Laravel Sail. For other backends, select the project, press `tab`, choose the dev server's route and press `space` to make it `loopback`. See [Routes and roles](/docs/concepts/routes-and-roles/#changing-roles).

To see which forwards plain `ssh -L` would need for the same project, see [Vite hot reload fails over SSH port forwarding](/docs/guides/vite-hot-reload-over-ssh/).

## What happens when a project starts

1. For a project on a server, Nearhost waits for its SSH connection. If the server cannot connect, the project does not start.
2. The hosts block is checked. It holds `127.0.0.1 <alias>` for every `.test` project, and for an enabled project with another [main name](/docs/reference/config/#main-name) unless DNS already sends that name only to loopback. An enabled project's exact web hosts are listed the same way. Nearhost asks for your password only if it needs to change.
3. For a project on a server, one `-L` forward is added per `web` route, each on an ephemeral local port, and one per `loopback` route, on the same port locally. A local project needs no forwards.
4. The proxy rebuilds its Caddy config with the new site and applies it in-process.
5. The project's state becomes `running`.

A request to `https://myapp.test` reaches Caddy on 443, then the ephemeral local port, then the web port on the remote. A script tag pointing at `http://localhost:5173/...` reaches the loopback forward on 5173, then port 5173 on the remote. The hot reload client connects to the origin its script came from, so it works with no remote configuration.

## Example: Laravel Sail

Under Sail, `laravel-vite-plugin` writes `public/hot` as `http://localhost:<VITE_PORT>`. With the official presets trusted and `nearhost/sail` enabled, discovery reads the Compose file, makes the port published for container port 80 the `web` route, and proposes `VITE_PORT` as a `loopback` route. A Sail project then needs no manual setup. See [Presets and registries](/docs/concepts/presets-and-registries/).

## Running several projects at once

A loopback route uses the same port number on both machines, so two running projects cannot share one. Give each project's dev server its own port. Nearhost warns you before the clash happens, and suggests a free port when the port comes from a variable. Adding a clashing project is refused unless you add it with `--disabled`. See [Advisories](/docs/reference/advisories/).

If another program already holds the port on your laptop, the project goes into `error` and names the program. Its other routes still start.

## Reloads and reconnects

Starting or stopping a project reloads the proxy without closing open WebSockets, so hot reload in other tabs stays connected. If the SSH connection drops, Nearhost reconnects and puts every forward back. The project shows `degraded` meanwhile.
