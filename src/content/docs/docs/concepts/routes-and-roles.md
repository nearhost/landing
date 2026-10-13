---
title: Routes and roles
description: How each discovered port becomes a web, loopback or ignored route.
sidebar:
  order: 1
---

A project has a list of routes. Each route is a port on the server, a role and a label. The role decides what Nearhost does with the port.

```yaml
routes:
  - port: 80
    role: web
    label: 'Laravel (APP_PORT)'
  - port: 5174
    role: loopback
    label: 'Vite (VITE_PORT)'
  - port: 3306
    role: ignore
    label: 'MySQL (FORWARD_DB_PORT)'
```

## web

Served at `https://<alias>`. Exactly one per project.

The default candidate is APP_PORT, else port 80, else the first discovered HTTP-looking port. Nearhost picks an ephemeral local port for the forward and the proxy sends requests for the alias to it.

## loopback

A raw TCP forward to `127.0.0.1:<port>` on the laptop, using the same port number as the remote. The default for VITE_PORT.

A loopback route is skipped for local projects, because the port is already local. See [Laravel Sail and Vite](/docs/concepts/laravel-sail-and-vite/) for why Vite needs this.

## ignore

Discovered and listed, not forwarded. Anything discovery does not recognise is listed with this role.

## Uniqueness rules

- Aliases must be unique across projects.
- Loopback ports must be unique across enabled projects. A clash is an advisory at edit time and an error at start time.
- Each project has exactly one `web` route.
