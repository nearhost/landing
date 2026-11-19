# CLI

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-119/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-119/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-119/docs/getting-started/install.md.

Every nearhost command, its flags, and what nearhost doctor checks.

```text
nearhost                       the interface
nearhost up [project...]       start projects without the interface, until Ctrl-C
nearhost add [path]            add a project, discovering its ports
nearhost export [project]      write a project's setup to its .nearhostrc
nearhost ls                    list projects
nearhost trust | untrust       the local CA in the system and browser stores
nearhost hosts clean           remove the nearhost block from /etc/hosts
nearhost doctor                check ports, the CA, the hosts block, servers and projects
nearhost preset ...            presets, which say what a framework's ports mean
nearhost preset registry ...   the preset registries you trust
nearhost update                update to the latest release
nearhost completion <shell>    print a shell completion script
nearhost version               print the version (also nearhost --version)
```

Every command takes `--config <file>` to use another config file. A mistyped command gets a suggestion, as `Did you mean this?` with the closest command names. From Nearhost 0.8.0.

A mistyped subcommand under `nearhost hosts`, `nearhost preset`, `nearhost preset registry` or `nearhost completion` is an error too. It prints `unknown command "<x>" for "nearhost <group>"`, suggests the closest command when there is one, and exits 1, so `nearhost hosts clear` no longer looks like a clean that worked. With no subcommand, each of them prints its help and exits 0.

## Exit status

These are the exit statuses a script can rely on:

| Command                     | Status | When                                                                                                                |
| --------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------- |
| `nearhost`                  | 1      | There is no terminal. Use `nearhost up` instead.                                                                    |
| `nearhost up`               | 1      | Nothing can be served once every project has tried to start.                                                        |
| `nearhost add`              | 130    | Ctrl-C or another stop signal interrupted it, and nothing was added.                                                |
| `nearhost untrust`          | not 0  | While trust remains: a system or browser store still trusts the CA, or could not be reached.                        |
| `nearhost doctor`           | 1      | A check failed, or a project has an error. Warnings leave it at 0.                                                  |
| `nearhost update --check`   | 0      | Nearhost is up to date, including when the newest release has no files for it yet.                                  |
|                             | 1      | A newer release is out.                                                                                             |
|                             | 2      | The check failed. The reason goes to stderr.                                                                        |
| `nearhost update`           | 1      | The update command ran, but the copy that runs next did not start, printed no version, or is still the old version. |
| A mistyped command or group | 1      | The command, or a subcommand under `hosts`, `preset` or `completion`, does not exist.                               |

## nearhost

Opens the interface, at a terminal. It starts the proxy and every enabled project, and `q` stops them all. See [First run](https://nearhost.dev/pr-preview/pr-119/docs/getting-started/first-run.md).

It needs a terminal: stdin and stdout must both be one. Without one, as in a service, a cron job, a script or a pipe, it starts nothing, prints this to stderr and exits 1:

```text
nearhost needs a terminal for its interface. Use nearhost up to serve without one.
```

On Windows the message adds `In Git Bash, run it through winpty or use Windows Terminal.` `nearhost --help`, `-h` and `help` print the help and exit 0 without a terminal.

| Flag                  | Effect                                                                                                                     |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `--https-port <port>` | Serve HTTPS on this port instead of 443.                                                                                   |
| `--http-port <port>`  | Redirect HTTP on this port instead of 80.                                                                                  |
| `--web-port <port>`   | Serve Nearhost's page at `https://nearhost.localhost:<port>` instead of 6327. `0` turns the page off. From Nearhost 0.8.0. |
| `--no-hosts`          | Leave `/etc/hosts` alone. Add the aliases yourself.                                                                        |
| `--no-capture`        | Keep no requests or responses in memory. See [The request log](https://nearhost.dev/pr-preview/pr-119/docs/concepts/the-request-log.md).                           |

Only one Nearhost runs at a time. A second one, the interface or `nearhost up`, stops with `Another Nearhost is already running (pid N). Stop it first.`, without the pid when it is not known. A different `--config` file does not change that. When the second one's ports are taken, it reports the ports first.

## nearhost up

Starts the named projects, or every enabled project when none is named, and serves them until Ctrl-C. It takes the same five flags as `nearhost`.

```sh
nearhost up myapp
```

Ctrl-C, a SIGTERM and closing the terminal all stop it the same way. It stops the projects and their ssh connections, and waits at most 30 seconds for them. A second Ctrl-C stops at once. Started under `nohup`, it keeps running when the terminal closes. On Windows, closing the window gives it the few seconds Windows allows before it ends the process, and Ctrl-C there gives it the full shutdown.

`up` reads the config once, when it starts. To serve a project you add with `nearhost add` while it runs, stop `up` and start it again.

Once every project has tried to start, `up` checks that at least one is running, or is starting or reconnecting while it waits on its server. If none is, it prints the summary and `Nothing can be served, so nearhost up is stopping.`, stops as Ctrl-C does and exits 1, so a service manager sees the failure. It does the same when every change to the hosts block is refused.

When the hosts block needs to change, it asks for your password in the terminal. Without a terminal, as under a service manager, CI or `nohup`, it cannot ask for your password, so it skips the hosts change and prints, once: `The hosts file needs sudo, and there is no terminal to ask in. Run nearhost up in a terminal once, or pass --no-hosts.` Do not give Nearhost a passwordless `sudo` rule to get around this: its binary is usually writable by you, so the rule would give your account root. On Windows, the change goes through a User Account Control prompt, with no password.

On Linux, when this user may not bind port 80 or 443, `up` prints the `setcap` command for its binary under the error, then `Do not run nearhost with sudo.` It prints neither when the port is in use by another program, or when the system lets any user bind port 80.

## nearhost add

Adds a project. It discovers the routes from the project's files, prints them and saves the project. At a terminal it asks when it needs to: whether to trust the official presets, which suggested presets to enable, which port is the web app, whether to add a server it does not know, and whether to approve hosts, a main name or Docker access that the project's `.nearhostrc` or presets ask for, and loopback ports that its `.nearhostrc` adds. Without a terminal it stops rather than approve them. It starts nothing and changes no file in the project.

Approval asks about each item on its own, as `<item>: approve? [y/N]`. Before it asks about a host or a main name, it says what approving a name does. A no drops that host, loopback port or `docker_clients`, and the add goes on. A refused main name falls back to the `.test` one, and the summary names what was left out. Nearhost asks about a refused item from the `.nearhostrc` again when it next reviews the project. See [Approval](https://nearhost.dev/pr-preview/pr-119/docs/reference/nearhostrc.md#approval).

Its last line says whether the Nearhost already running picks the project up. With the interface open, it says `The running Nearhost picks it up in a moment.` Under `nearhost up`, it says to stop `up` and start it again. With nothing running, it says to start it with `nearhost up`. When it cannot tell which kind of Nearhost runs, it says to stop it and start it again if the project does not appear. A project added with `--disabled` is listed by the interface, not started, and the line says how to start it.

Ctrl-C, or any other signal that `nearhost up` stops on, ends the add cleanly: it closes the ssh connection, removes its temporary folder, saves nothing, prints `Interrupted, so the project was not added.` and exits 130. A second Ctrl-C ends it at once.

| Flag              | Effect                                                                                                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--server <name>` | The server the path is on. The default is `local`.                                                                                                                           |
| `--name <name>`   | The project name. The default is the directory's name.                                                                                                                       |
| `--alias <alias>` | The main name. The default is `<name>.test`. Any lowercase domain name works, but not a wildcard, `localhost`, `nearhost.localhost` or an IP address. Typing it approves it. |
| `--web <port>`    | The port to serve at the alias.                                                                                                                                              |
| `--host <host>`   | Add this host to the primary web route. Repeat for more. Typing it approves it.                                                                                              |
| `--preset <name>` | Enable this preset without asking. Repeat for more.                                                                                                                          |
| `--no-presets`    | Use no presets and suggest none.                                                                                                                                             |
| `--disabled`      | Add it disabled: `nearhost up` starts it only when named.                                                                                                                    |

From Nearhost 0.8.0, `nearhost add` refuses a name with letters or digits outside ASCII, such as `café`, since the `.test` name made from it would lose them. Pass `--name` with a-z, 0-9 and `-`, or give the main name with `--alias` or in the project's `.nearhostrc`.

See [Add a project](https://nearhost.dev/pr-preview/pr-119/docs/getting-started/add-a-project.md).

## nearhost export

Writes what Nearhost serves for a project, its routes, hosts and main name, to a `.nearhostrc` in the project's directory. Commit the file, and whoever adds the project after cloning it gets the same setup. For a project on a server, it writes the file on the server, over SFTP.

```sh
nearhost export [project] [--dry-run] [--force]
```

Without a name, it exports the project on this machine whose directory holds the current one. Name the project to export one on a server.

A `.nearhostrc` that is a link is written through, unless it leads outside the project's directory. Then `export` stops and names where the link leads. From Nearhost 0.8.0.

| Flag        | Effect                                                                     |
| ----------- | -------------------------------------------------------------------------- |
| `--dry-run` | Print the file instead of writing it. Warnings go to stderr, not the file. |
| `--force`   | Replace an existing `.nearhostrc`.                                         |

`--dry-run` prints the file even when one exists. Without `--force`, an existing file stops a write:

```text
nearhost: .nearhostrc already exists in /home/you/code/shop; run with --force to replace it, or --dry-run to see what would be written
```

The file follows the project's `.env` on another machine. See [Variables](https://nearhost.dev/pr-preview/pr-119/docs/reference/nearhostrc.md#variables).

- A port is written as `${VAR:-port}` when discovery finds a variable that sets it, and `.env` sets that variable to the same port or leaves it unset. A variable that `.env` sets to another port gives a plain number.
- The main name is written as `${VAR:-name}` only when a variable whose name ends in `_HOST` holds exactly that name. A variable such as `SESSION_DOMAIN` with the same value is not used, since on another machine it may hold a parent domain or a cookie's scope. With more than one `_HOST` variable, the first alphabetically wins.
- The main name is left out when it is the default, the directory's name followed by `.test`.
- `docker_clients: true` is written when the project has it.

Before writing, it checks that the file reads back to the same project. After writing, it records the file as approved, since it holds only what Nearhost already serves, so the project does not ask about it again. If a change to the old file was waiting for approval, the new file replaces it and the command says so. See [Approval](https://nearhost.dev/pr-preview/pr-119/docs/reference/nearhostrc.md#approval).

For a project called `shop` on server `mini`, with two web routes and a Vite route on loopback, whose `.env` has these lines:

```ini
APP_PORT=8010
ADMIN_PORT=8020
VITE_PORT=5173
APP_HOST=shop.example.com
SESSION_DOMAIN=shop.example.com
```

`nearhost export shop --dry-run` prints:

```yaml
# Written by nearhost export. Safe to edit and commit; see https://nearhost.dev/docs for the format.
version: 1
alias: ${APP_HOST:-shop.example.com}
routes:
  - port: ${VITE_PORT:-5173}
    label: vite (VITE_PORT)
    role: loopback
  - port: ${APP_PORT:-8010}
    label: app (APP_PORT)
    hosts: [api.example.com]
  - port: ${ADMIN_PORT:-8020}
    label: admin (ADMIN_PORT)
    hosts: [admin.example.com]
```

Without `--dry-run`, it prints where it wrote the file:

```text
Wrote /home/you/code/shop/.nearhostrc on server mini. Commit it so others get this setup when they add the project.
```

## nearhost ls

Lists the projects in the config, with their server, alias, whether they are enabled, and the routes that are not ignored.

## nearhost trust

Installs the local CA root into the system trust store, which asks for your password. It then reports on the browser stores that Firefox and Linux Chromium-based browsers use, and updates them when `certutil` is installed. Run it again at any time; it only does what is missing.

It runs `sudo` from `/usr/bin`, `/bin`, `/usr/local/bin` or `/run/wrappers/bin`, and only a copy owned by root. Without one, it stops and says so, unless you run it as root. From Nearhost 0.8.0.

On Windows it adds the root to your user's certificate store, which Windows confirms in a dialog of its own, with no password and no administrator rights. Every browser on Windows uses that store, Firefox from version 120, so there are no browser stores to update.

## nearhost untrust

Reverses `trust`: removes the local CA from the system and browser stores. It asks for your password, and runs `sudo` under the same rule as `trust`. On Windows it removes the root from your user's certificate store, with no password. Unless you pass `--delete-key`, the CA's key stays in its folder, so `nearhost trust` can add the same CA again. See [The local CA](https://nearhost.dev/pr-preview/pr-119/docs/concepts/tls-and-the-proxy.md#the-local-ca).

When the system store does not hold the CA, it prints `Nearhost Local CA was not in the trust store.`, asks for no password, cleans the browser stores and exits 0. It exits non-zero when the system still trusts the root afterwards, or when a browser store still trusts it or `certutil` could not reach one, and names those stores.

| Flag           | Effect                                                                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `--delete-key` | After untrusting, delete the CA's folder with its private key, the site certificates it issued, and any copy Nearhost 0.7 left. It asks first. |
| `-y`, `--yes`  | With `--delete-key`, delete without asking.                                                                                                    |

`--delete-key` refuses while a Nearhost runs, without a terminal unless you also pass `--yes`, and under `sudo` on another user's files. If untrusting fails in a way you can fix, it deletes nothing and says what to fix. If trust remains that Nearhost cannot remove, it deletes the key anyway, then fails, names the old root by fingerprint and serial number, and keeps a copy of its certificate in `old-roots`.

## nearhost hosts

- `apply` sets the nearhost block to the aliases read from stdin, one per line. It writes the file itself, so it runs as root: Nearhost calls it through `sudo`.
- `clean` removes the block, and asks for your password through `sudo`.

On Windows, Nearhost runs `apply` as administrator through User Account Control, and `clean` asks for your approval the same way. A hosts file with the read-only attribute is left as it is, with a message that says how to clear the attribute. See [The hosts file is read-only](https://nearhost.dev/pr-preview/pr-119/docs/troubleshooting/troubleshooting.md#the-hosts-file-is-read-only).

`apply` is left out of `nearhost --help` from Nearhost 0.8.0, because Nearhost runs it itself through `sudo`. Both take `--file <path>` to work on another file than `/etc/hosts`. See [The hosts file](https://nearhost.dev/pr-preview/pr-119/docs/concepts/the-hosts-file.md).

## nearhost doctor

Checks the setup and changes nothing, apart from creating `~/.nearhost` on each server for the agents check. Each line is `ok`, `warn` or `FAIL`, with a fix where there is one, and only a failure makes it exit 1. After the machine checks, it checks each enabled project's files and setup and lists what it finds. See [Project checks](#project-checks). An error there also makes it exit 1. It takes `--https-port`, `--http-port`, `--web-port` and `--no-hosts`, and `--json` prints all of it as one JSON object. See [JSON output](#json-output).

Each line prints as soon as its check finishes, so a slow server does not hold back the rest. At a terminal, a check that takes longer than 2 seconds prints `checking <name>…` on its own line to stderr. `--json` still prints one document at the end, with no such lines.

| Check                              | What it looks at                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `config`                           | Whether the config file reads and is valid.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `port 443`, `port 80`, `port 6327` | Whether the ports are free, and what holds them if not. 443 is checked for HTTP/3 too. 6327 is Nearhost's page, or the port `--web-port` gives, and is left out with `--web-port 0`. A busy 6327 only warns. The 6327 check is from Nearhost 0.8.0. On Windows, a port held by HTTP.sys says how to find the service that holds it. While Nearhost runs, a port it holds shows `in use by the running Nearhost` and passes. If no tool can name the holder while Nearhost runs, the check warns. |
| `privileged ports`                 | On Linux, whether the binary may bind ports below 1024.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `local CA`                         | Whether it exists, whether the system trusts it, and when it expires.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `old CA copy`                      | Only shown when `~/.config/nearhost/caddy` (or `$XDG_CONFIG_HOME/nearhost/caddy`), where Nearhost 0.7 and earlier kept the CA, is still there beside the new one. It warns, and the fix is to delete the old folder.                                                                                                                                                                                                                                                                             |
| `browser stores`                   | Whether the Firefox and Chromium stores trust it.                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `ssh agent`                        | On Windows, whether the ssh-agent service is running. Only keys with a passphrase need it, so a stopped or disabled service is a note, with the commands to start it.                                                                                                                                                                                                                                                                                                                            |
| `ssh`                              | On Windows, the version of `ssh.exe`. One older than the 9.5 that Windows 11 ships warns, and a missing one fails.                                                                                                                                                                                                                                                                                                                                                                               |
| `ssh vendor`                       | On Windows, where the `ssh` that Nearhost runs lives. One outside `%SystemRoot%\System32\OpenSSH` and `%ProgramFiles%\OpenSSH`, such as Git for Windows' ssh, warns with its path, and the fix is to put `%SystemRoot%\System32\OpenSSH` first on `PATH`.                                                                                                                                                                                                                                        |
| `firefox`                          | Only shown on Windows when Firefox is set not to read Windows' trusted roots. It warns, and names the setting to change.                                                                                                                                                                                                                                                                                                                                                                         |
| `aliases`                          | Only shown when a main name is not a valid domain. It fails, and the project does not start.                                                                                                                                                                                                                                                                                                                                                                                                     |
| `hosts block`                      | Whether `/etc/hosts` has every name it needs: main names and web hosts, less exact names outside `.test` whose DNS answers are all loopback addresses. A block from Nearhost 0.7 or earlier, with no `::1` lines, warns. `nearhost up` fixes it.                                                                                                                                                                                                                                                 |
| `server <name>`                    | Whether `ssh <host>` connects without a prompt, for each server.                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `agents on <name>`                 | Whether the server takes the socket coding agents reach Nearhost on. A refusal warns.                                                                                                                                                                                                                                                                                                                                                                                                            |

### Project checks

Each enabled project is checked where it runs: its `.nearhostrc`, its routes against what discovery finds in its files, the names it is served at, and its Compose file. Each finding has an id, a severity and a fix. In the text output an `error` shows as `FAIL`, a `warning` as `warn` and an `info` as `info`, with a `fix:` line under it and any snippet to paste under that. The fix's kind says who makes it:

- `project`: an edit to the project's own files.
- `nearhost`: Nearhost reads a file again, or you approve or change something in Nearhost.
- `manual`: something only you can do, such as starting the dev server or adding a DNS record.

| Finding                     | Severity               | Fix        | When it shows                                                                                                                                         |
| --------------------------- | ---------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nearhostrc.invalid`        | error                  | `project`  | The file has a mistake, such as a key or value Nearhost does not understand. The message gives the line.                                              |
| `nearhostrc.unset-variable` | error                  | `project`  | The file uses a variable that is not set and has no default. Set it in `.env.local` or `.env`, or give it one: `${NAME:-value}`.                      |
| `nearhostrc.version`        | error                  | `manual`   | The file's `version` is newer than this Nearhost reads. Run `nearhost update`.                                                                        |
| `nearhostrc.pending`        | warning                | `nearhost` | The file asks for changes that wait for your approval, which the message lists. Nearhost reads it again, and you approve them.                        |
| `nearhostrc.not-applied`    | warning                | `nearhost` | The file has changed since Nearhost last read it, and the change needs no approval. Nearhost reads it again.                                          |
| `nearhostrc.gone`           | warning                | `project`  | The file was deleted after it was approved. Nearhost serves what was approved until you restore it.                                                   |
| `routes.unserved-port`      | warning                | `nearhost` | A port looks like a web server, and the project has no route for it. Select the project, press `e` and add it as a web route.                         |
| `routes.unserved-host`      | warning                | `nearhost` | The project's settings name a host for one of its ports, and no web route serves it. Press `e` on the project, and the form adds it.                  |
| `routes.stale-port`         | info                   | `nearhost` | A web route's port matches nothing in the project's files any more. If the port changed, press `e` on the project and update it.                      |
| `routes.not-listening`      | info, or warning       | `manual`   | Nothing listens on a web route's port. Start the dev server on that port, or correct the port.                                                        |
| `hosts.unresolved`          | error                  | `nearhost` | A name does not resolve to this machine and is not in the hosts file. Starting the project adds it to `/etc/hosts`.                                   |
| `hosts.unresolved-pattern`  | error                  | `manual`   | A name the pattern matches does not resolve to this machine. Add a DNS record for the pattern that points at 127.0.0.1, or list exact hosts.          |
| `hosts.public`              | warning                | `manual`   | A name that does not end in `.test` resolves to a real address, so the real site is out of reach on this machine while the project is enabled.        |
| `hosts.overlap`             | warning                | `project`  | One of the project's patterns overlaps a different pattern of another enabled project. A name that both patterns match goes to the more specific one. |
| `docker.host-gateway`       | warning                | `project`  | A Compose service uses a name Nearhost serves, and its `extra_hosts` does not map that name to the host.                                              |
| `docker.ca`                 | warning                | `project`  | A Compose service calls a name Nearhost serves, and does not trust Nearhost's root certificate.                                                       |
| `docker.clients`            | warning, info on macOS | `project`  | A container calls a name Nearhost serves, and the project does not have `docker_clients: true`.                                                       |
| `advice.<id>`               | warning                | `project`  | An [advisory](https://nearhost.dev/pr-preview/pr-119/docs/reference/advisories.md) applies. The snippet is the change to make.                                                                |
| `presets.note`              | info                   | `manual`   | Discovery or a preset gave a warning, so some checks may be incomplete.                                                                               |
| `projects.unchecked`        | info                   | `manual`   | The project could not be checked: its server can't be reached, its directory is missing, or the checks took over 30 seconds.                          |

A few depend on the project:

- The `nearhostrc.*` findings follow [Approval](https://nearhost.dev/pr-preview/pr-119/docs/reference/nearhostrc.md#approval) and [When it is read](https://nearhost.dev/pr-preview/pr-119/docs/reference/nearhostrc.md#when-it-is-read).
- `routes.unserved-port`, `routes.unserved-host` and `routes.stale-port` are for a project without a `.nearhostrc`. A project with one takes its routes from the file.
- `routes.not-listening` and the `docker.*` findings are for a project on this machine. `routes.not-listening` is a warning only when Nearhost is running the project, which `nearhost doctor` does not know, so there it is always info.
- `nearhost doctor` leaves out `hosts.unresolved` for a name the `hosts block` check already names. With `--no-hosts` it is not checked at all.
- The `docker.*` findings read the Compose file and its override file as Compose does, and name the override when the service is defined there. A Compose file that is not valid YAML is reported, and a `COMPOSE_FILE` setting is noted. See [Discovery](https://nearhost.dev/pr-preview/pr-119/docs/concepts/discovery.md#what-presets-add).
- The `docker.*` findings come with the snippet to paste. [Callbacks from Docker containers to a local HTTPS domain](https://nearhost.dev/pr-preview/pr-119/docs/guides/container-callbacks.md) explains each one.

### JSON output

`--json` prints one object with two arrays, `checks` and `findings`, and exits as the text output does. Each check has `name`, `level` (`ok`, `warn` or `fail`), `detail` and `fix`. Each finding has:

- `id`, `severity` and `project`;
- `message`, what is wrong;
- `file` and `line`, where it is, when the finding points at a file;
- `fix`, with its `kind`, its `text` and any `snippet`.

`file`, `line` and `snippet` are left out when they are empty. A project's findings come worst first.

For a project whose `.nearhostrc` has a mistyped key, with a route that also serves a real name, the output starts like this, with the machine checks cut:

```json
{
  "checks": [
    {
      "name": "hosts block",
      "level": "fail",
      "detail": "missing api.local.example.com, shop.test, www.example.com",
      "fix": "Run `nearhost up`; it updates the block and asks for your password"
    }
  ],
  "findings": [
    {
      "id": "nearhostrc.invalid",
      "severity": "error",
      "project": "shop",
      "message": ".nearhostrc: line 5: key \"hostz\" is not understood by this version of Nearhost; update Nearhost, or remove it",
      "file": ".nearhostrc",
      "line": 5,
      "fix": {
        "kind": "project",
        "text": "Correct .nearhostrc."
      }
    },
    {
      "id": "hosts.public",
      "severity": "warning",
      "project": "shop",
      "message": "www.example.com is a real name that resolves to 203.0.113.10; while the project is enabled, the real site is out of reach on this machine",
      "fix": {
        "kind": "manual",
        "text": "Nothing to do if that is what you want; otherwise use a name that resolves to 127.0.0.1, or a .test name."
      }
    },
    {
      "id": "routes.not-listening",
      "severity": "info",
      "project": "shop",
      "message": "nothing listens on port 8010, which serves shop.test, api.local.example.com, www.example.com",
      "fix": {
        "kind": "manual",
        "text": "Start the project's dev server on port 8010, or correct the port."
      }
    }
  ]
}
```

`api.local.example.com` and `shop.test` do not resolve to this machine either, but the `hosts block` check already names them, so no `hosts.unresolved` finding repeats them. The exit status is 1. Coding agents run the same checks on one project through the [agent API](https://nearhost.dev/pr-preview/pr-119/docs/coding-agents/how-it-works.md#agent-api).

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

See [Presets and registries](https://nearhost.dev/pr-preview/pr-119/docs/concepts/presets-and-registries.md).

## nearhost update

Checks GitHub for the latest release and updates Nearhost the way it was installed. It shows what it will do and asks first.

| Installed with                                | What it does                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------- |
| Homebrew                                      | `brew upgrade --cask nearhost/tap/nearhost`                                     |
| npm, pnpm, bun                                | `npm install -g @nearhost/cli@latest`, or the pnpm or bun equivalent            |
| `go install`                                  | `go install github.com/nearhost/nearhost/cmd/nearhost@latest`                   |
| The shell installer                           | The installer again, with `NEARHOST_INSTALL_DIR` set to the binary's folder     |
| The PowerShell installer, or a zip on Windows | Downloads the release's zip from GitHub and replaces `nearhost.exe` where it is |

Run through `npx`, it tells you to run `npx @nearhost/cli@latest` instead, since npx fetches a fresh copy. On macOS and Linux, when the binary's folder is not writable, it prints the installer command with `sudo` rather than running anything. For the shell installer, it downloads the script to a file and runs it only once the whole script has arrived, and installs the version it checked.

After the update, it runs `nearhost version` on the copy your next command starts: the Homebrew link, the pnpm shim on your `PATH`, or the binary itself. If that copy is still the old version, it prints `The update ran, but <path> is still <old>. Run it again, or install by hand: <command>.` and exits 1. It does the same when that copy does not start or prints no version. A copy built with `go install` reports its release version, so it is checked the same way.

On Linux, replacing the binary drops its permission to bind ports 80 and 443. After any update, `nearhost update` prints the `setcap` command for the real binary file: the file behind Homebrew's link, or the platform package's binary behind pnpm's shim. It prints nothing when the binary keeps the capability, or when the system lets any user bind port 80. After a shell installer update, the installer prints the command as well.

A release shows on GitHub a few minutes before its files are uploaded. Until this system's file is there, `nearhost update` does not offer that release.

On Windows, `nearhost update` can replace the `nearhost.exe` it runs from. For a copy from the PowerShell installer or a zip it runs no other program: it downloads the release's zip itself, to `nearhost.exe.new` beside the running copy, and installs it only if it matches the release's `checksums.txt`. Only then does the running copy move aside for the new one, with retries while a virus scanner holds the file. A failed, cancelled or slow download leaves the running copy as it was; the download has 5 minutes. A Ctrl-C after the download waits until the swap finishes. If the update fails, you keep the copy you had, and the error says so. When you cannot write to the binary's folder, it prints the installer command to run in Windows Terminal opened as administrator, rather than running anything.

| Flag          | Effect                                                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `-y`, `--yes` | Update without asking.                                                                                                       |
| `--check`     | Only report. Exits 0 when up to date, 1 when a newer release is out, and 2 when the check failed, with the reason on stderr. |

At the `[Y/n]` question, an empty line is yes. End of input, or input that cannot be read, is No: nothing runs and the exit is 0. Without a terminal it asks nothing: it prints the command to run, or says to pass `--yes`, and exits 0.

Nearhost also checks for a new release at most once a day, in the background, and prints a line after the command when one is out. The interface shows it in its log. When the day's check has to ask GitHub, a command that has finished waits up to 2 seconds for the answer. Later commands that day read the answer from a cache and don't wait. Set `NEARHOST_NO_UPDATE_CHECK=1` to turn the check off.

## nearhost completion

Prints a completion script for `bash`, `zsh`, `fish` or `powershell`. `nearhost completion <shell> --help` says how to load it in that shell.

## nearhost version

Prints the version, as `nearhost 0.8.0`. From Nearhost 0.8.0, `nearhost --version` prints the same line.
