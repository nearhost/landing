---
title: CLI
description: Every nearhost command, its flags, and what nearhost doctor checks.
sidebar:
  order: 1
---

```text
nearhost                       the interface
nearhost up [project...]       start projects without the interface, until Ctrl-C
nearhost add [path]            add a project, discovering its ports
nearhost ls                    list projects
nearhost trust | untrust       the local CA in the system and browser stores
nearhost hosts apply | clean   the nearhost block in /etc/hosts
nearhost doctor                check ports, the CA, the hosts block and servers
nearhost preset ...            presets, which say what a framework's ports mean
nearhost preset registry ...   the preset registries you trust
nearhost update                update to the latest release
nearhost version               print the version
```

Every command takes `--config <file>` to use another config file.

## nearhost

Opens the interface, at a terminal. It starts the proxy and every enabled project, and `q` stops them all. See [First run](/docs/getting-started/first-run/).

| Flag                  | Effect                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `--https-port <port>` | Serve HTTPS on this port instead of 443.                                                         |
| `--http-port <port>`  | Redirect HTTP on this port instead of 80.                                                        |
| `--no-hosts`          | Leave `/etc/hosts` alone. Add the aliases yourself.                                              |
| `--no-capture`        | Keep no requests or responses in memory. See [The request log](/docs/concepts/the-request-log/). |

## nearhost up

Starts the named projects, or every enabled project when none is named, and serves them until Ctrl-C. A second Ctrl-C stops at once. It takes the same four flags as `nearhost`.

```sh
nearhost up myapp
```

When the hosts block needs to change, it asks for your password in the terminal.

## nearhost add

Adds a project. It discovers the routes from the project's files, prints them and saves the project. At a terminal it asks when it needs to: whether to trust the official presets, which suggested presets to enable, which port is the web app, and whether to add a server it does not know. It starts nothing and changes no file in the project.

| Flag              | Effect                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------- |
| `--server <name>` | The server the path is on. The default is `local`.                                        |
| `--name <name>`   | The project name. The default is the directory's name.                                    |
| `--alias <alias>` | The main name. The default is `<name>.test`. Any domain works, and typing it approves it. |
| `--web <port>`    | The port to serve at the alias.                                                           |
| `--preset <name>` | Enable this preset without asking. Repeat for more.                                       |
| `--no-presets`    | Use no presets and suggest none.                                                          |
| `--disabled`      | Add it disabled: `nearhost up` starts it only when named.                                 |

See [Add a project](/docs/getting-started/add-a-project/).

## nearhost ls

Lists the projects in the config, with their server, alias, whether they are enabled, and the routes that are not ignored.

## nearhost trust

Installs the local CA root into the system trust store, which asks for your password. It then reports on the browser stores that Firefox and Linux Chromium-based browsers use, and updates them when `certutil` is installed. Run it again at any time; it only does what is missing.

## nearhost untrust

Reverses `trust`.

## nearhost hosts

- `apply` sets the nearhost block to the aliases read from stdin, one per line. It writes the file itself, so it runs as root: Nearhost calls it through `sudo`.
- `clean` removes the block, and asks for your password through `sudo`.

Both take `--file <path>` to work on another file than `/etc/hosts`. See [The hosts file](/docs/concepts/the-hosts-file/).

## nearhost doctor

Checks the setup and changes nothing, apart from creating `~/.nearhost` on each server for the agents check. Each line is `ok`, `warn` or `FAIL`, with a fix where there is one, and only a failure makes it exit non-zero. It takes `--https-port`, `--http-port` and `--no-hosts`.

| Check                 | What it looks at                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------- |
| `config`              | Whether the config file reads and is valid.                                                  |
| `port 443`, `port 80` | Whether the ports are free, and what holds them if not. 443 is checked for HTTP/3 too.       |
| `privileged ports`    | On Linux, whether the binary may bind ports below 1024.                                      |
| `local CA`            | Whether it exists, whether the system trusts it, and when it expires.                        |
| `browser stores`      | Whether the Firefox and Chromium stores trust it.                                            |
| `aliases`             | Only shown when a main name is not a valid domain. It fails, and the project does not start. |
| `hosts block`         | Whether `/etc/hosts` has every project's alias.                                              |
| `server <name>`       | Whether `ssh <host>` connects without a prompt, for each server.                             |
| `agents on <name>`    | Whether the server takes the socket coding agents reach Nearhost on. A refusal warns.        |

## nearhost preset

| Command                                      | What it does                                                                              |
| -------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `nearhost preset list`                       | The enabled presets and where they came from, then what each registry offers.             |
| `nearhost preset enable <name>`              | Enable a local preset, or install `<registry>/<name>`. `--force` replaces a changed file. |
| `nearhost preset disable <name>`             | Stop using a preset. Its file is kept.                                                    |
| `nearhost preset update [name\|registry]`    | Move registry presets to their current versions. `--force` replaces hand edits.           |
| `nearhost preset validate <file>`            | Check a preset file and report every problem in it.                                       |
| `nearhost preset test <dir>`                 | Run a directory of preset fixtures. `--presets <dir>` uses presets from a folder.         |
| `nearhost preset index <dir> --ref <commit>` | Print the registry index for a directory of preset files.                                 |

## nearhost preset registry

| Command                                     | What it does                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------- |
| `nearhost preset registry add <owner/repo>` | Trust the registry in a public GitHub repository. `--as <alias>` names it.            |
| `nearhost preset registry list`             | The trusted registries and their cached indexes.                                      |
| `nearhost preset registry remove <alias>`   | Stop trusting a registry, once none of its presets are enabled. Their files are kept. |

See [Presets and registries](/docs/concepts/presets-and-registries/).

## nearhost update

Checks GitHub for the latest release and updates Nearhost the way it was installed. It shows the command it will run and asks first.

| Installed with      | Command it runs                                                             |
| ------------------- | --------------------------------------------------------------------------- |
| Homebrew            | `brew upgrade --cask nearhost/tap/nearhost`                                 |
| npm, pnpm, bun      | `npm install -g @nearhost/cli@latest`, or the pnpm or bun equivalent        |
| `go install`        | `go install github.com/nearhost/nearhost/cmd/nearhost@latest`               |
| The shell installer | The installer again, with `NEARHOST_INSTALL_DIR` set to the binary's folder |

Run through `npx`, it tells you to run `npx @nearhost/cli@latest` instead, since npx fetches a fresh copy. When the binary's folder is not writable, it prints the installer command with `sudo` rather than running anything. On Linux, after a Homebrew or `go install` update, it prints the `setcap` command to run again.

| Flag      | Effect                                                         |
| --------- | -------------------------------------------------------------- |
| `--yes`   | Update without asking.                                         |
| `--check` | Only report. Exits 1 when a newer release is out, 0 otherwise. |

Nearhost also checks for a new release at most once a day, in the background, and prints a line after the command when one is out. The interface shows it in its log. Set `NEARHOST_NO_UPDATE_CHECK=1` to turn the check off.

## nearhost version

Prints the version, as `nearhost 0.4.0`.
