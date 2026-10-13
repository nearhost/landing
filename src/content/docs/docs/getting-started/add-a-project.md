---
title: Add a project
description: Register a directory on a server and serve it at a .test alias.
sidebar:
  order: 4
---

:::note[Planned]
This describes behaviour from the Nearhost design that is not in a release yet.
:::

A project is a directory on a server that runs an HTTP service. Nearhost reads the project's own files to work out its ports, then serves it at a `.test` alias.

## From the TUI

Press `n` and choose **project**. The wizard replaces the main panel and keeps the sidebar visible.

1. **Server.** Pick `local` or any server you have added.
2. **Path.** The project directory on that server. For `local` it defaults to the current directory.
3. **Ports.** Discovery runs and shows a table of ports with a proposed role for each. Press `space` on a row to cycle its role.
4. **Alias.** Prefilled as `<name>.test`. Aliases must be unique across projects.
5. **Confirm.** If the hosts block changes, you are asked for sudo once.

## From the command line

The non-interactive form accepts discovery's defaults and prints the resulting routes.

```text
$ nearhost add --server mini ~/Code/myapp
discovering ports on mini:~/Code/myapp …
  80     web       Laravel (APP_PORT)
  5174   loopback  Vite (VITE_PORT)
  3306   ignore    MySQL (FORWARD_DB_PORT)
added myapp → https://myapp.test
```

## Route roles

| Role       | What happens                                                                           | Default for                                         |
| ---------- | -------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `web`      | Served at `https://<alias>` through the proxy. Exactly one per project.                | APP_PORT, else 80, else the first HTTP-looking port |
| `loopback` | Raw forward to the same port on your laptop's `127.0.0.1`. Skipped for local projects. | VITE_PORT                                           |
| `ignore`   | Listed, not forwarded.                                                                 | Databases, caches, everything else                  |

Advisories are shown, never applied. See [Advisories](/docs/reference/advisories/). Nothing on the remote machine is edited.

## What gets written

Every project lives in `~/.config/nearhost/config.yaml`. Hand edits and TUI edits mix freely.

```yaml
projects:
  - name: myapp
    server: mini
    path: /Users/ecs/Code/myapp
    alias: myapp.test
    enabled: true
    routes:
      - { port: 80, role: web, label: 'Laravel (APP_PORT)' }
      - { port: 5174, role: loopback, label: 'Vite (VITE_PORT)' }
      - { port: 3306, role: ignore, label: 'MySQL (FORWARD_DB_PORT)' }
```

See [config.yaml](/docs/reference/config/) for every key.
