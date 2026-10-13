---
title: Dev servers and hot reload
description: How assets and live reload reach your browser, and when a project needs a loopback forward.
sidebar:
  order: 6
---

A page served from `https://<alias>` usually needs a second thing to work: the dev server that builds its scripts and pushes live updates. There are two ways that server shows up, and Nearhost handles both.

## The dev server is the web app

A Vite, Next.js or similar project serves pages and assets from one port. Give that port the `web` role and you are done. Hot reload uses a WebSocket on the same origin, and the proxy passes WebSocket upgrades through.

Vite checks the `Host` header, so it needs the alias in `server.allowedHosts`. Nearhost shows the exact lines to add. See [Advisories](/docs/reference/advisories/).

## The dev server sits beside a backend

A backend framework renders the HTML, and the page loads its scripts from a separate dev server at an address like `http://localhost:5173`. Rails, Django and Laravel projects that use Vite all work this way.

That address is resolved by your browser, on your laptop. Nothing listens there, so scripts fail to load and hot reload never connects.

A `loopback` route fixes it. Nearhost forwards the same port number on your laptop to the dev server on the remote machine, so `localhost:5173` in the browser reaches port 5173 over there. The remote project needs no changes.

## What happens when a project starts

1. The project's server transport is ensured: the SSH master is up, or the project is local.
2. The hosts block contains `127.0.0.1 <alias>`. Nearhost prompts for sudo if the block changes.
3. One `-L` forward is added per `web` route, on an ephemeral local port, and one per `loopback` route, on the same port locally.
4. The proxy rebuilds its Caddy config with the new site and applies it in-process.
5. The project's state becomes `running`.

A request to `https://myapp.test` reaches Caddy on 443, then the ephemeral local port, then the web port on the remote. A script tag pointing at `http://localhost:5173/...` reaches the loopback forward on 5173, then port 5173 on the remote. The hot reload client connects to the origin its script came from, so it works with no remote configuration.

## Example: Laravel Sail

Under Sail, `laravel-vite-plugin` writes `public/hot` as `http://localhost:<VITE_PORT>`. Discovery recognises Sail and proposes `APP_PORT` as the `web` route and `VITE_PORT` as a `loopback` route, so a Sail project needs no manual setup.

## Running several projects at once

A loopback route uses the same port number on both machines, so two running projects cannot share one. Give each project's dev server its own port. Nearhost warns you before the clash happens and suggests a free port. See [Advisories](/docs/reference/advisories/).
