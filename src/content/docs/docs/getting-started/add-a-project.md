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
4. **Routes.** The ports found, with a role, what each opens on this machine and a label. Ticked ports are served. The project's web port opens `https://<alias>`, and any other `web` port opens the names it is given. A `loopback` port opens `localhost:<port>`, and an `ignore` port opens nothing. See [Routes and roles](/docs/concepts/routes-and-roles/) for what each does. The line under the table says what the selected port's role does. `space` ticks or unticks a port, and `←` or `→` changes its role. Changing one port's role leaves the others as they are. At least one port must be `web`, and only one `web` port can go without names of its own; `enter` says so if two do. One port is the project's web port. To serve another port as well, make it `web` and give it names of its own with `h`. If no ports were found, give the web port yourself. The opens column and the line under the table need Nearhost 0.8.0 or later.
5. **Name.** The project's name and its alias. The name is what Nearhost calls the project: in the sidebar, the log and `nearhost up <name>`. The alias is the address your browser opens, shown after `https://`. It follows the name until you change it, unless it comes from the project's `.nearhostrc`. `tab` moves between them. Names and aliases must be unique. The alias is the project's [main name](/docs/reference/config/#main-name) and can be any lowercase domain name, such as `local.myapp.com`, but not a wildcard, `localhost` or an IP address. A real domain asks for approval, which typing it here gives. One that comes from the project's [`.nearhostrc`](/docs/reference/nearhostrc/) is asked about on the last step. The hints under the name and alias need Nearhost 0.8.0 or later.
6. **Confirm.** The server, path, address and routes, with any advice. It also lists anything that needs approval, such as a host or option from the project's `.nearhostrc`, and `enter` approves it as it adds the project.

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

At a terminal it asks what the interface asks: whether to trust the official presets, which suggested presets to enable, and which port is the web app when that is not clear. It also offers to add a server it does not know, and asks you to approve any real domain, wildcard, `localhost` or Docker access that the project's `.nearhostrc` or presets ask for. Without a terminal it takes the defaults, and stops if it cannot tell which port is web or if something needs approval. See [Approval](/docs/reference/nearhostrc/#approval).

| Flag              | Effect                                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--server <name>` | The server the path is on. The default is `local`.                                                                                                     |
| `--name <name>`   | The project name. The default is the directory's name.                                                                                                 |
| `--alias <alias>` | The main name. The default is `<name>.test`. Any lowercase domain name works, but not a wildcard, `localhost` or an IP address. Typing it approves it. |
| `--web <port>`    | The port to serve at the alias.                                                                                                                        |
| `--host <host>`   | Add this host to the primary web route. Repeat for more. Typing it approves it.                                                                        |
| `--preset <name>` | Enable this preset without asking. Repeat for more.                                                                                                    |
| `--no-presets`    | Use no presets and suggest none.                                                                                                                       |
| `--disabled`      | Add it disabled: `nearhost up` starts it only when named.                                                                                              |

A directory whose name has letters or digits outside ASCII, such as `café`, needs `--name` or `--alias`, or an `alias` in its `.nearhostrc`. From Nearhost 0.8.0, `nearhost add` stops and says so.

A `~` in the path means the server's home directory, even when your shell has already turned it into this machine's.

## Route roles

| Role       | What happens                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `web`      | Served through the proxy. The first is served at `https://<alias>`, and each later one at its own hosts. |
| `loopback` | Raw forward to the same port on your laptop's `127.0.0.1` and `[::1]`. Skipped for local projects.       |
| `ignore`   | Listed, not forwarded.                                                                                   |

Discovery proposes the roles, and you can change them at any time. See [Routes and roles](/docs/concepts/routes-and-roles/).

A project can have several web routes, each served at hosts of its own. In the form, choose a web route on the routes step and press `h` to type its hosts. On the command line, `--host` adds a host to the primary web route. See [Multi-host projects](/docs/concepts/multi-host-projects/).

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
