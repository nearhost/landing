---
title: TLS and the proxy
description: How the embedded Caddy proxy and the local certificate authority serve each alias over HTTPS.
sidebar:
  order: 6
---

Caddy runs inside the Nearhost process, with its storage under `~/.config/nearhost/caddy`. It listens on 443 for HTTPS and on 80 only to redirect to HTTPS, with a 308. To use other ports, run Nearhost with `--https-port` and `--http-port`.

It answers only this machine, and, for a project whose `.nearhostrc` sets `docker_clients`, containers on this machine's Docker networks. A request from another computer, or for a name Nearhost does not serve, has its connection closed with no answer.

While any project runs, `https://localhost` shows Nearhost's own page, unless a project serves `localhost` itself.

## The local CA

The internal certificate authority, "Nearhost Local CA", is created the first time Nearhost starts. Nearhost never ships a shared key or a wildcard certificate, and Caddy never installs the authority by itself.

Trusting it puts its root into the system trust store, which asks for your password once: the System keychain on macOS, your distribution's certificate store on Linux. It also updates the separate stores that Firefox and Linux Chromium-based browsers use, when `certutil` is installed. If the system already trusts it, only the browser stores are updated, with no password.

Trust it from the welcome box the first time you start Nearhost, or at any time with `nearhost trust`. `nearhost untrust` reverses all of it. See [First run](/docs/getting-started/first-run/) and, for Linux and Firefox, [Install](/docs/getting-started/install/).

Home shows whether it is trusted and when it expires. The date turns amber in the last 30 days.

## Per-name certificates

Leaf certificates are issued automatically. Each exact name a project serves gets its own. A name under a wildcard pattern gets one the first time it is visited. Because the CA is created on your machine, nobody else holds a key that can sign for your `.test` names.

## What the proxy sets

Each web route of a running project is served at its hosts, and the first one also at `https://<alias>`. Requests go to the route's local forward, or for a local project to its port.

- The `Host` header is passed through unchanged.
- `X-Forwarded-Proto: https` and `X-Forwarded-For` are set.
- WebSocket upgrades pass through.
- Responses are not buffered.

## Reloads without dropping connections

Config changes apply through Caddy's in-process reload. Starting or stopping a project leaves the connections of other projects open, and open WebSockets, such as hot reload, stay connected.

The proxy also keeps the requests it passes on, so you can look at them and send them again. See [The request log](/docs/concepts/the-request-log/).

If the browser still warns about the certificate, see [The CA is not trusted](/docs/troubleshooting/troubleshooting/#the-ca-is-not-trusted). For why local dev wants a real HTTPS name, see [HTTPS on a local dev domain](/docs/guides/https-on-a-local-dev-domain/).
