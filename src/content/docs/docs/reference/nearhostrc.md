---
title: .nearhostrc
description: Every key in a project's .nearhostrc, how its variables are filled, and what it asks you to approve.
sidebar:
  order: 3
---

A `.nearhostrc` is a YAML file in a project's root directory. You commit it with the project, so everyone who adds the project gets the same ports, hosts and main name, and each worktree can fill them from its own `.env`.

The file only ever proposes. A host or main name that is not `.test`, a wildcard, `localhost` and Docker access all wait for your approval before they go live. See [Approval](#approval).

```yaml
version: 1
alias: ${APP_HOST:-app.local.example.com}
routes:
  - port: ${APP_PORT:-8000}
    label: app
    hosts:
      - api.local.example.com
      - '*.status.local.example.com'
  - port: ${FORWARD_REVERB_PORT:-8080}
    label: reverb
    hosts: [ws.local.example.com]
  - port: ${FORWARD_MINIO_PORT:-9000}
    label: minio
    hosts: [files.local.example.com]
  - port: ${VITE_PORT:-5173}
    role: ignore
    label: vite
docker_clients: true
```

With this `.env` beside it, the app is served at `https://app.local.example.com` and `https://api.local.example.com` from port 8010. A name one label under `status.local.example.com`, such as `eu.status.local.example.com`, reaches the same port; the hosts file cannot hold a pattern, so its names need DNS that points them at this machine. Reverb is served at `ws.local.example.com` from port 8090, and MinIO at `files.local.example.com` from port 9010:

```ini
APP_PORT=8010
FORWARD_REVERB_PORT=8090
FORWARD_MINIO_PORT=9010
```

## Keys

| Key              | Type    | Meaning                                                                                                              |
| ---------------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| `version`        | integer | Required. Must be `1`.                                                                                               |
| `alias`          | string  | Optional. The project's [main name](/docs/reference/config/#main-name): `<name>.test`, or any one domain.            |
| `routes[].port`  | integer | Required. The port on the server. A number from 1 to 65535, or a variable that gives one.                            |
| `routes[].role`  | string  | Optional. `web`, `loopback` or `ignore`. `web` when left out.                                                        |
| `routes[].label` | string  | Optional. A description, shown with the route.                                                                       |
| `routes[].hosts` | list    | Optional, web routes only. Names to serve the route at: exact names or wildcard patterns.                            |
| `docker_clients` | boolean | Optional. `true` serves the project to Docker containers on this machine too. See [Docker clients](#docker-clients). |

The roles mean what they mean in `config.yaml`. See [Routes and roles](/docs/concepts/routes-and-roles/).

The file is the authority on the routes it lists. Their hosts replace any that presets found for those ports. A port the project has that the file does not list stays visible, but a web one becomes `ignore`, so only the file says what is served.

`nearhost add --alias` wins over `alias:`, and `alias:` wins over `<name>.test`. Removing `alias:` from the file leaves the current main name as it is.

## Rules

- A file that lists routes needs at least one `web` route among them.
- The first web route is served at the project's main name. Every later web route needs at least one host.
- A port, or a host, listed twice is an error.
- Only web routes have hosts.
- The main name may be listed as a host only on the first web route, where it is served anyway.
- `docker_clients` works only for a project on this machine, not one on a server.
- Hosts and the main name must be lowercase. The main name cannot be a wildcard pattern, `localhost` or an IP address.

## Variables

`${VAR}` and `${VAR:-default}` work in ports, hosts, labels, roles and the alias. They are filled from `.env.local`, then `.env`, in the project's directory, so a value in `.env.local` wins. They are never filled from Nearhost's own environment.

A variable with no value and no default is an error that names it:

```text
.nearhostrc: ${APP_PORT} has no value in .env.local or .env, and no default
```

A variable can fill part of a value, as in `app.${APP_DOMAIN}`. Worktrees of one repository can then share the committed file and each serve its own hosts. Approval works on the filled values, so you approve the names that will actually be served, and a change in `.env` that gives a new real domain asks again.

## Errors

Every error in the file itself starts with `.nearhostrc`. `nearhost add` stops with it, and the interface and `nearhost doctor` show it with the project.

A key this version of Nearhost does not know is an error, rather than being ignored:

```text
.nearhostrc: line 4: key "hostz" is not understood by this version of Nearhost; update Nearhost, or remove it
```

So is a `version` newer than this Nearhost understands:

```text
.nearhostrc is version 2; this Nearhost understands version 1, so update Nearhost
```

Run `nearhost update` for the second. For the first, check the key's spelling against [Keys](#keys).

## Approval

These need your approval before they go live:

- a host that does not end in `.test`;
- a wildcard pattern, even one under `.test`;
- `localhost`;
- a main name that does not end in `.test`;
- `docker_clients: true`.

A `.test` host, a port, a label or a role needs none. Neither does a host the project already serves.

Each front end asks in its own way:

- **The interface.** When you add a project, the last step lists what needs approval, and `enter` approves it and saves. When a project's file changes later, the project shows `.nearhostrc asks for 1 change that needs approval · a to review`. Press `a` to see what it asks for, then `y` to approve, `n` to decline or `esc` to leave it for later. A declined change is not asked about again until the file changes or Nearhost restarts.
- **`nearhost add`.** At a terminal it lists each item and asks `Approve these? [y/N]`. A host typed with `--host`, or a main name typed with `--alias`, is approved by typing it. Without a terminal it adds nothing, and names the items. For the file at the top of this page:

  ```text
  nearhost: not added: this project asks for things that need your approval (*.status.local.example.com, api.local.example.com, ws.local.example.com, files.local.example.com, app.local.example.com, docker_clients); run nearhost add in a terminal, or open nearhost
  ```

- **`nearhost up`.** It cannot approve anything. A project whose file asks for something new keeps serving what was approved before, and its log says what is waiting. Open `nearhost` to approve it.

Nothing approves itself.

## When it is read

Nearhost reads the file, and applies what it finds:

- when a project starts;
- when you press `r` on a project in the interface;
- when an agent asks Nearhost to read it again.

A change that needs no approval, such as a port moved in `.env`, a new label or a new `.test` host, applies at once and is saved to `config.yaml`. A change that needs approval waits, and the routes approved before keep serving until you approve it. If the file has an error, or is deleted after it was approved, the project keeps serving what was approved and shows the problem.

`nearhost doctor` reads the file too, but only reports. It applies and saves nothing. It reports a file with an error, a change that waits for approval, and a change that needs none but has not been applied yet.

## Docker clients

Nearhost answers only this machine. On Linux, a request from a container comes from a Docker network, not from this machine's loopback address, so Nearhost drops it. `docker_clients: true` also serves the project to the networks Docker has on this machine, while other projects stay loopback-only. It works only for a project on this machine, and it always needs your approval. Docker Desktop on macOS already delivers container requests from 127.0.0.1, so this matters on Linux.

## A file without routes

:::note
A file without routes needs Nearhost 0.7.0 or later. Nearhost 0.6.0 stops with `.nearhostrc needs at least one web route`.
:::

To set only the main name, and leave the routes to discovery and to you, give the file `version` and `alias`:

```yaml
version: 1
alias: ${APP_HOST:-app.local.example.com}
```

The routes stay as discovery found them or as you set them. The file removes only the hosts that an earlier, approved version of it gave, and the main name from any route other than the first web route. A later web route left with no hosts once the main name is removed becomes `ignore`.
