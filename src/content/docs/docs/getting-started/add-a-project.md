---
title: Add a project
description: Register a directory on a server and serve it at a .test alias.
sidebar:
  order: 4
---

A project is a directory on a server that runs an HTTP service. Nearhost reads the project's own files to work out its ports, then serves it at a `.test` alias. The service can be anything that listens on a port.

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
$ nearhost add --server mini ~/code/myapp
discovering ports on mini:~/code/myapp …
  5173   ignore    Vite (vite.config)
  5432   ignore    db
  8080   web       app
added myapp → https://myapp.test
```

Here a Compose service named `app` publishes `8080:80`, so it becomes the web route. The Vite port is listed but not forwarded. If your pages load scripts from `localhost:5173`, change that route to `loopback`. See [Dev servers and hot reload](/docs/concepts/dev-servers-and-hot-reload/).

## Route roles

| Role       | What happens                                                                           | Default for                                                   |
| ---------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `web`      | Served at `https://<alias>` through the proxy. Exactly one per project.                | A port mapped to container port 80, else the Vite port        |
| `loopback` | Raw forward to the same port on your laptop's `127.0.0.1`. Skipped for local projects. | A dev server port you choose, or VITE_PORT under Laravel Sail |
| `ignore`   | Listed, not forwarded.                                                                 | Databases, caches, everything else                            |

Advisories are shown, never applied. See [Advisories](/docs/reference/advisories/). Nothing on the remote machine is edited.

## What gets written

Every project lives in `~/.config/nearhost/config.yaml`. Hand edits and TUI edits mix freely.

```yaml
projects:
  - name: myapp
    server: mini
    path: /home/dev/code/myapp
    alias: myapp.test
    enabled: true
    routes:
      - { port: 8080, role: web, label: 'app' }
      - { port: 5173, role: loopback, label: 'Vite (vite.config)' }
      - { port: 5432, role: ignore, label: 'db' }
```

See [config.yaml](/docs/reference/config/) for every key.
