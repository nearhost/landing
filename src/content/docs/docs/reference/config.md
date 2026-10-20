---
title: config.yaml
description: Every key in the Nearhost configuration file.
sidebar:
  order: 2
---

The file is `~/.config/nearhost/config.yaml`, or `$XDG_CONFIG_HOME/nearhost/config.yaml` when that variable is set. `--config <file>` points any command at another file.

Nearhost writes the file whenever you add or change something in the interface, or run `nearhost add`, `nearhost preset` or `nearhost preset registry`. `nearhost up` writes it too, when a project's `.nearhostrc` has changed in a way that needs no approval. It reads the file again first, so hand edits are kept, but comments and formatting are not.

```yaml
servers:
  - name: mini # free text; "local" is reserved and implicit
    ssh_host: mini # alias from ~/.ssh/config, or user@host
projects:
  - name: myapp
    server: mini
    path: /home/dev/code/myapp
    alias: myapp.test # the main name: <name>.test, or any domain
    enabled: true # start automatically when Nearhost launches
    routes:
      - port: 8080 # port on the server
        role: web # web | loopback | ignore
        label: 'app (APP_PORT)'
      - port: 5173
        role: loopback
        label: 'Vite (vite.config)'
      - port: 5432
        role: ignore
        label: 'db'
registries:
  - alias: nearhost
    repo: nearhost/presets
presets:
  - name: nearhost/vite
    ref: e6c0be9e14dc89ec5c19bb1bc7d155c1029c298d
    sha256: 024643158cc1d55819e3f62d9d3e429cc8b15dae396cf036db9d573815c9d80e
```

## Keys

| Key                         | Type    | Meaning                                                                                        |
| --------------------------- | ------- | ---------------------------------------------------------------------------------------------- |
| `servers[].name`            | string  | Free text. `local` is reserved.                                                                |
| `servers[].ssh_host`        | string  | An alias from `~/.ssh/config`, or `user@host`. For another port, use an alias with `Port`.     |
| `projects[].name`           | string  | The project name.                                                                              |
| `projects[].server`         | string  | The `name` of a server, or `local`.                                                            |
| `projects[].path`           | string  | The project directory on that server.                                                          |
| `projects[].alias`          | string  | The project's main name, served over HTTPS. `<name>.test` unless you change it. See below.     |
| `projects[].enabled`        | boolean | Start the project automatically when Nearhost launches.                                        |
| `projects[].routes[].port`  | integer | The port on the server.                                                                        |
| `projects[].routes[].role`  | string  | One of `web`, `loopback` or `ignore`.                                                          |
| `projects[].routes[].label` | string  | Optional. A description, usually from discovery.                                               |
| `projects[].routes[].hosts` | list    | Optional, web routes only. More names to serve the route at: exact names or wildcard patterns. |
| `projects[].nearhostrc`     | map     | Written by Nearhost: what you last approved from the project's `.nearhostrc`. Do not edit it.  |
| `registries[].alias`        | string  | The name a registry's presets are known by, as in `nearhost/vite`.                             |
| `registries[].repo`         | string  | The registry's GitHub repository, as `owner/name`.                                             |
| `registry_prompt`           | boolean | `false` stops Nearhost offering to trust the official registry. Absent means ask.              |
| `notifications`             | boolean | `false` stops the terminal notification when an agent proposes a project. Absent means on.     |
| `presets[].name`            | string  | An enabled preset: `<registry>/<name>`, or a plain name for a local file.                      |
| `presets[].ref`             | string  | For a registry preset, the commit it was installed from.                                       |
| `presets[].sha256`          | string  | For a registry preset, the hash of its file.                                                   |

Use `nearhost preset` and `nearhost preset registry` rather than editing the last five by hand. See [Presets and registries](/docs/concepts/presets-and-registries/).

## Main name

`projects[].alias` is the project's main name: the address Nearhost shows, prints after `nearhost add` and gives to agents. It is `<name>.test` by default. It can be any one exact domain instead, such as `app.local.example.com`.

A main name must be lowercase. It cannot be a wildcard pattern, `localhost` or an IP address.

A main name that does not end in `.test` is a real domain, so it needs your approval before it goes live. Typing it with `nearhost add --alias` approves it. A name from a `.nearhostrc` that you did not type is asked about in the terminal by `nearhost add`. When a `.nearhostrc` or an agent proposes one later, it waits for you in the interface, and the old name keeps serving until you approve.

The hosts file treats the two kinds differently:

- A `.test` name is written to `/etc/hosts` for every project, enabled or not.
- Any other name is written only while its project is enabled, and unless DNS already resolves it only to this machine's loopback address. A disabled project does not hide the real site.

A project has one main name. If you switch to a real domain, the `<name>.test` address stops working.

A `.nearhostrc` file can set the main name with `alias:`. It accepts `${VAR}` and `${VAR:-default}`, filled from `.env.local` and then `.env`, so each worktree can have its own name:

```yaml
version: 1
alias: ${APP_HOST:-app.local.example.com}
```

`nearhost add --alias` wins over the file, and the file wins over `<name>.test`. Removing `alias:` from the file leaves the current name as it is.

## Validation

- Server names are unique, each server has a host, and `local` is not used as a name.
- Project names are unique, and each project's server exists.
- Aliases are unique across projects, ignoring case. An alias that is not a valid main name does not start, and `nearhost doctor` reports it.
- Each project has at least one `web` route. The first is served at the main name. Every other web route needs at least one host. Ports are from 1 to 65535.
- Only web routes have hosts, and a project serves each host once.
- `docker_clients` in a `.nearhostrc` works only for projects on `local`.
- Loopback ports are unique across enabled projects.
- Registry aliases are lowercase letters, digits and single hyphens. Each preset's registry is trusted. Registry presets have `ref` and `sha256`, and local ones do not.

If the file is not valid YAML, Nearhost exits with the error and its line. If it breaks a rule above, Nearhost exits naming the file and the problem. `nearhost doctor` reports either without exiting.

## Beside the config

The folder that holds `config.yaml` also holds:

- `caddy/`: the proxy's storage, including the local certificate authority
- `presets/`: installed presets
- `registry/`: each trusted registry's cached index
- `run/`: the SSH control sockets

## The local server

The `local` server always exists and needs no configuration. It does not appear under `servers`, and it may not be removed or renamed. A route on it is `web` or `ignore`, because a loopback forward would point the port at itself.

See [Routes and roles](/docs/concepts/routes-and-roles/).
