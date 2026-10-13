---
title: Routes and roles
description: How each discovered port becomes a web, loopback or ignored route.
sidebar:
  order: 1
---

A project has a list of routes. Each route is a port on the server, a role and a label. The role decides what Nearhost does with the port.

```yaml
routes:
  - port: 8080
    role: web
    label: 'app'
  - port: 5173
    role: loopback
    label: 'Vite (vite.config)'
  - port: 5432
    role: ignore
    label: 'db'
```

## web

Served at `https://<alias>`. Exactly one per project.

Discovery proposes one in this order: a Compose port mapped to container port 80, then port 80 itself, then the Vite port, then a project's only port. Under Laravel Sail, `APP_PORT` wins. You can move the role to any route.

Nearhost picks an ephemeral local port for the forward and the proxy sends requests for the alias to it.

## loopback

A raw TCP forward to `127.0.0.1:<port>` on the laptop, using the same port number as the remote. Use it for a dev server whose URLs point at `localhost`, such as Vite behind a backend framework.

A loopback route is skipped for local projects, because the port is already local. See [Dev servers and hot reload](/docs/concepts/dev-servers-and-hot-reload/) for when you need one.

## ignore

Discovered and listed, not forwarded. Anything discovery does not recognise is listed with this role.

## Uniqueness rules

- Aliases must be unique across projects.
- Loopback ports must be unique across enabled projects. A clash is an advisory at edit time and an error at start time.
- Each project has exactly one `web` route.
