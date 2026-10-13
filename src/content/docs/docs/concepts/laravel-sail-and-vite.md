---
title: Laravel Sail and Vite
description: Why Sail projects need a loopback forward for Vite and how Nearhost sets it up.
sidebar:
  order: 6
---

:::note[Planned]
This describes behaviour from the Nearhost design that is not in a release yet.
:::

Laravel Sail with Vite and hot module replacement is the reference workload. Any HTTP service routes the same way.

## Why Vite needs a loopback forward

Under Sail, `laravel-vite-plugin` writes `public/hot` as `http://localhost:<VITE_PORT>`. The page served from `https://<alias>` then asks the browser for scripts at that address, so the browser must find Vite on the laptop's own localhost.

## What Nearhost does

When a project starts:

1. The project's server transport is ensured: the SSH master is up, or the project is local.
2. The hosts block contains `127.0.0.1 <alias>`. Nearhost prompts for sudo if the block changes.
3. One `-L` forward is added per `web` route, on an ephemeral local port, and one per `loopback` route, on the same port locally.
4. The proxy rebuilds its Caddy config with the new site and applies it in-process.
5. The project's state becomes `running`.

A request to `https://myapp.test` reaches Caddy on 443, then the ephemeral local port, then `localhost:80` on the remote. The page's `<script src="http://localhost:5174/...">` reaches the loopback forward on 5174, then `localhost:5174` on the remote. Vite's HMR client connects to the same origin its script came from, so HMR works with no remote configuration.

## Advisories you may see

- **Vite on the default port.** Vite is present but neither VITE_PORT nor `server.port` is set, so it uses 5173 and is likely to clash.
- **allowedHosts missing.** Vite is present outside Sail and `server.allowedHosts` does not include the alias.
- **APP_URL mismatch.** The Laravel `.env` has an APP_URL other than `https://<alias>`.

Each comes with its fix. See [Advisories](/docs/reference/advisories/).
