---
title: config.yaml
description: Every key in the Nearhost configuration file.
sidebar:
  order: 2
---

The file is `~/.config/nearhost/config.yaml`. Hand edits and TUI edits can mix. The TUI writes the file back on every change.

```yaml
servers:
  - name: mini # free text; "local" is reserved and implicit
    ssh_host: mini # alias from ~/.ssh/config, or user@host[:port]
projects:
  - name: myapp
    server: mini
    path: /home/dev/code/myapp
    alias: myapp.test # generated from name, editable
    enabled: true # start automatically when Nearhost launches
    routes:
      - port: 8080 # port on the server
        role: web # web | loopback | ignore
        label: 'app'
      - port: 5173
        role: loopback
        label: 'Vite (vite.config)'
      - port: 5432
        role: ignore
        label: 'db'
```

## Keys

| Key                         | Type    | Meaning                                                          |
| --------------------------- | ------- | ---------------------------------------------------------------- |
| `servers[].name`            | string  | Free text. `local` is reserved.                                  |
| `servers[].ssh_host`        | string  | An alias from `~/.ssh/config`, or `user@host[:port]`.            |
| `projects[].name`           | string  | The project name.                                                |
| `projects[].server`         | string  | The `name` of a server, or `local`.                              |
| `projects[].path`           | string  | The project directory on that server.                            |
| `projects[].alias`          | string  | The hostname served over HTTPS. Generated from `name`, editable. |
| `projects[].enabled`        | boolean | Start the project automatically when Nearhost launches.          |
| `projects[].routes[].port`  | integer | The port on the server.                                          |
| `projects[].routes[].role`  | string  | One of `web`, `loopback` or `ignore`.                            |
| `projects[].routes[].label` | string  | A description, usually from discovery.                           |

## Validation

- Aliases must be unique across projects.
- Loopback ports must be unique across enabled projects.
- Each project has exactly one `web` route.

If the file is invalid, Nearhost exits with the YAML error and line.

## The local server

The `local` server always exists and needs no configuration. It does not appear under `servers`, and it may not be removed or renamed. Loopback routes are skipped for projects on it, because the port is already local.

See [Routes and roles](/docs/concepts/routes-and-roles/).
