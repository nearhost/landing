---
title: Add a project
description: Register a directory on this machine or a server and serve it at an alias.
sidebar:
  order: 4
---

A project is a directory, on this machine or on a server, that runs an HTTP service. Nearhost reads the project's files to work out its ports, then serves it at an alias, `<name>.test` unless you choose another. The service can be anything that listens on a port.

## From the interface

Press `n`. A box titled "Add project" opens over the screen. Its steps are counted at the top, and steps that have nothing to ask are skipped. `esc` goes back a step.

1. **Server.** Pick `local` for this machine, or a server you have added. The selected server, or the selected project's, is chosen already. **New server…** adds one on the way. See [Add a server](/docs/getting-started/add-a-server/).
2. **Path.** The project's directory. On `local` it starts as the folder you ran `nearhost` in, and on a server as `~/`. See [Typing a path](#typing-a-path).
3. **Presets.** Nearhost reads ports from `.env` by itself. While no preset registry is trusted, it asks once whether to trust the official presets, which add Compose files, Vite and Laravel Sail. Choose Yes, No, or Don't ask again. With a registry trusted, it lists the presets that suit this project, ticked. `space` unticks one, and `enter` enables the rest. See [Presets and registries](/docs/concepts/presets-and-registries/).
4. **Routes.** The ports found, with a role and a label for each. Ticked ports are served. `space` ticks or unticks a port, and `←` or `→` changes its role. At least one port must be `web`. If no ports were found, give the web port yourself.
5. **Name.** The project's name and its alias, which follows the name until you change it. `tab` moves between them. Names and aliases must be unique. The alias is the project's [main name](/docs/reference/config/#main-name) and can be any lowercase domain name, such as `local.myapp.com`, but not a wildcard, `localhost` or an IP address. A real domain asks for approval, which typing it here gives. One that comes from the project's `.nearhostrc` is asked about on the last step.
6. **Confirm.** The server, path, address and routes, with any advice. `enter` adds the project.

The project is selected and starts at once. If its alias is not in `/etc/hosts` yet, Nearhost asks for your password to add it. See [First run](/docs/getting-started/first-run/#the-password-box).

## Typing a path

Nearhost suggests directories as you type, on this machine and on servers alike. It reads each folder in the background, so typing never waits.

```text
path      ~/code/bl▏og/
          blog  blob
```

The rest of the suggested name appears faint after the cursor. When several directories match, they are listed under the field.

| Key        | Action                                                  |
| ---------- | ------------------------------------------------------- |
| `tab`, `→` | Accept the suggestion.                                  |
| `↑`, `↓`   | Choose between the matches.                             |
| `enter`    | Use the path exactly as typed, without the suggestion.  |
| `ctrl+r`   | Reconnect to the server, if the connection has dropped. |

`tab` with nothing suggested lists the folder again, which picks up a directory made since. Hidden directories are suggested once you type the `.`.

## From the command line

`nearhost add` takes a path and discovers its routes the same way. Run without a terminal, as in a script, it prints:

```text
$ nearhost add --server mini '~/code/myapp' --web 8080
No preset registries are trusted. To use the official presets: nearhost preset registry add nearhost/presets

Routes found for myapp (mini:/home/dev/code/myapp):
  PORT  ROLE    LABEL
  3307  ignore  forward-db (FORWARD_DB_PORT)
  5174  ignore  vite (VITE_PORT)
  8080  web     app (APP_PORT)

Added myapp on mini at https://myapp.test
Start it with `nearhost up`.
```

With no registry trusted, only the `.env` port variables are found, and every port but the web one is `ignore`. Here the Vite port should reach the browser as `localhost:5174`, so change it to `loopback` afterwards: select the project, press `tab`, choose the route and press `space`. The [Vite and Sail presets](/docs/concepts/presets-and-registries/) do that for you.

At a terminal it asks what the interface asks: whether to trust the official presets, which suggested presets to enable, and which port is the web app when that is not clear. It also offers to add a server it does not know, and asks you to approve any real domain, wildcard, `localhost` or Docker access that the project's `.nearhostrc` or presets ask for. Without a terminal it takes the defaults, and stops if it cannot tell which port is web or if something needs approval.

| Flag              | Effect                                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--server <name>` | The server the path is on. The default is `local`.                                                                                                     |
| `--name <name>`   | The project name. The default is the directory's name.                                                                                                 |
| `--alias <alias>` | The main name. The default is `<name>.test`. Any lowercase domain name works, but not a wildcard, `localhost` or an IP address. Typing it approves it. |
| `--web <port>`    | The port to serve at the alias.                                                                                                                        |
| `--host <host>`   | Add this host to the web route. Repeat for more. Typing it approves it.                                                                                |
| `--preset <name>` | Enable this preset without asking. Repeat for more.                                                                                                    |
| `--no-presets`    | Use no presets and suggest none.                                                                                                                       |
| `--disabled`      | Add it disabled: `nearhost up` starts it only when named.                                                                                              |

A `~` in the path means the server's home directory, even when your shell has already turned it into this machine's.

## Route roles

| Role       | What happens                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `web`      | Served through the proxy. The first is served at `https://<alias>`, and each later one at its own hosts. |
| `loopback` | Raw forward to the same port on your laptop's `127.0.0.1`. Skipped for local projects.                   |
| `ignore`   | Listed, not forwarded.                                                                                   |

Discovery proposes the roles, and you can change them at any time. See [Routes and roles](/docs/concepts/routes-and-roles/).

Advisories are shown, never applied. See [Advisories](/docs/reference/advisories/). Nothing on the remote machine is edited.

## What gets written

Every project lives in `~/.config/nearhost/config.yaml`. You can edit it by hand too.

```yaml
projects:
  - name: myapp
    server: mini
    path: /home/dev/code/myapp
    alias: myapp.test
    enabled: true
    routes:
      - { port: 3307, role: ignore, label: 'forward-db (FORWARD_DB_PORT)' }
      - { port: 5174, role: loopback, label: 'vite (VITE_PORT)' }
      - { port: 8080, role: web, label: 'app (APP_PORT)' }
```

See [config.yaml](/docs/reference/config/) for every key.
