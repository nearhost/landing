---
title: TLS and the proxy
description: How the embedded Caddy proxy and the local certificate authority serve each alias over HTTPS.
sidebar:
  order: 4
---

Caddy runs inside the Nearhost process, with its storage under `~/.config/nearhost/caddy`. It listens on 443 for HTTPS and on 80 only to redirect to HTTPS.

## The local CA

The internal certificate authority, "Nearhost Local CA", is created on first run. Nearhost never ships a shared key or a wildcard certificate.

`nearhost trust` installs its root into the macOS System keychain, with one sudo prompt. Where a Firefox profile exists, it also enables `enterprise_roots` so Firefox trusts the keychain. `nearhost untrust` reverses both.

## Per-alias certificates

Leaf certificates are issued automatically, one per alias.

## What the proxy sets

Each enabled project is a site block, `https://<alias>`, with `reverse_proxy 127.0.0.1:<local port>`.

- The `Host` header is passed through unchanged.
- `X-Forwarded-Proto: https` and `X-Forwarded-For` are set.
- WebSocket upgrades pass through.
- Responses are not buffered.

## Reloads without dropping connections

Config changes apply through Caddy's in-process reload. Adding or removing a project leaves the connections of other projects open.
