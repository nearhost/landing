# CLI

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-138/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-138/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-138/docs/getting-started/install.md.

Every nearhost command, its flags, and what nearhost doctor checks.

```text
nearhost                       the interface, on the background Nearhost
nearhost -d                    start Nearhost in the background, with no interface
nearhost stop                  stop the background Nearhost
nearhost status                what the background Nearhost serves (--json for JSON)
nearhost service install       start Nearhost at login, as a service
nearhost service uninstall     remove the service
nearhost daemon                the background Nearhost, run in the foreground; what a service runs
nearhost up [project...]       start projects without the interface, until Ctrl-C
nearhost add [path]            add a project, discovering its ports
nearhost export [project]      write a project's setup to its .nearhostrc
nearhost ls                    list projects
nearhost trust | untrust       the local CA in the system and browser stores
nearhost hosts update          bring the nearhost block in /etc/hosts up to date
nearhost hosts clean           remove the nearhost block from /etc/hosts
nearhost doctor                check ports, the CA, the hosts block, servers and projects
nearhost preset ...            presets, which say what a framework's ports mean
nearhost preset registry ...   the preset registries you trust
nearhost update                update to the latest release
nearhost completion <shell>    print a shell completion script
nearhost version               print the version (also nearhost --version)
```

Every command takes `--config <file>` to use another config file, and `--verbose` to show the code and the causes of an error, a warning or a note. A mistyped command gets a suggestion, under `Did you mean this?`, with the closest command names. From Nearhost 0.8.0.

A mistyped subcommand under `nearhost hosts`, `nearhost service`, `nearhost preset`, `nearhost preset registry` or `nearhost completion` is an error too. It names the command and the group, suggests the closest command when there is one, and exits 1, so `nearhost hosts clear` no longer looks like a clean that worked:

```text
Error: Unknown command "clear" for "nearhost hosts".

Did you mean this?

  clean
```

With no subcommand, each of them prints its help and exits 0.

## Errors, warnings and notes

Errors, warnings and notes go to stderr, so stdout holds only what the command prints when it works, for a pipe or `--json`. A blank line separates one from the next. An error starts with `Error:` and what happened. Under it come why, in plain words, the steps to fix it, each command on a line of its own so that you can copy it, and a pointer to `nearhost doctor` when it checks the cause. A warning starts with `Warning:`, and a note, which needs nothing done, with `Note:`. At a terminal the label is in colour, unless `NO_COLOR` is set. The text wraps to the terminal's width, but a command never does. A mistyped command, an unknown flag or an argument a command does not take is an error too, which says how to see what the command takes, as `nearhost <command> --help`.

With `--json`, which `nearhost status` and `nearhost doctor` take, each error, warning and note goes to stderr as one JSON object per line instead, with its `code`, `level`, `title` and, when it has them, `detail` and `fix`:

```json
{
  "code": "core.not-running",
  "level": "error",
  "title": "Nearhost is not running.",
  "fix": [
    { "text": "Start it in the background:", "command": "nearhost -d" },
    { "text": "Or open its interface:", "command": "nearhost" }
  ]
}
```

On Linux, for example, `nearhost service install` refuses a copy of `nearhost` that may not use ports 80 and 443, such as one you built yourself:

```text
Error: The service cannot run Nearhost from this copy yet.

On Linux, a program may use ports below 1024, such as 443 for HTTPS and
80 for HTTP, only when it has been given permission. The install script
gives it; a nearhost you build or copy yourself does not have it.

To give it permission, run:

  sudo setcap cap_net_bind_service=+ep '/home/you/go/bin/nearhost'

Then run nearhost service install again.

Run `nearhost doctor` to check this and the rest of what Nearhost needs.
```

`--verbose` adds the code on the line under the title, here `(service.cannot-bind)`, and ends with what caused it, on a `Cause:` line, when that adds to the title. A code names the problem wherever it shows up: in the core's log, in `nearhost doctor --verbose` and in the APIs. [Errors](https://nearhost.dev/pr-preview/pr-138/docs/reference/errors.md) lists every code.

If Nearhost itself fails unexpectedly, it prints `Error: Nearhost stopped unexpectedly.` with the path of a crash file, and asks you to report it at the Nearhost issues page with that file attached. Crash files are named `crash-<time>.log` and kept beside `core.log` in the config folder. A file holds Nearhost's version, the system, the time and where it failed, and nothing from your config.

## Exit status

These are the exit statuses a script can rely on:

| Command                     | Status | When                                                                                                                       |
| --------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------- |
| `nearhost`                  | 1      | There is no terminal. Use `nearhost -d` or `nearhost up` instead.                                                          |
|                             | 1      | `--config` names another file than the running Nearhost serves, or the running Nearhost speaks another version of its API. |
|                             | 130    | Ctrl-C interrupted it while it started Nearhost in the background.                                                         |
|                             | 1      | Quitting could not stop the background Nearhost, or could not leave it running, as you chose.                              |
| `nearhost -d`               | 1      | The background Nearhost stopped while starting, or had not answered after 15 seconds.                                      |
|                             | 130    | Ctrl-C interrupted it while it started Nearhost in the background.                                                         |
| `nearhost stop`             | 0      | Nearhost stopped, or was not running.                                                                                      |
|                             | 1      | Nearhost had not stopped after 35 seconds.                                                                                 |
| `nearhost status`           | 3      | Nearhost is not running.                                                                                                   |
| `nearhost service`          | 1      | `install` or `uninstall` failed, or this system has no service manager to use.                                             |
| `nearhost up`               | 1      | Nothing can be served once every project has tried to start.                                                               |
| `nearhost add`              | 130    | Ctrl-C or another stop signal interrupted it, and nothing was added.                                                       |
| `nearhost untrust`          | not 0  | While trust remains: a system or browser store still trusts the CA, or could not be reached.                               |
| `nearhost doctor`           | 1      | A check failed, or a project has an error. Warnings leave it at 0.                                                         |
| `nearhost update --check`   | 0      | Nearhost is up to date, including when the newest release has no files for it yet.                                         |
|                             | 1      | A newer release is out.                                                                                                    |
|                             | 2      | The check failed. The reason goes to stderr.                                                                               |
| `nearhost update`           | 1      | The update command ran, but the copy that runs next did not start, printed no version, or is still the old version.        |
|                             | 1      | With `--next` on a Homebrew copy when the newest is a beta, which Homebrew does not have.                                  |
| A mistyped command or group | 1      | The command, or a subcommand under `hosts`, `service`, `preset` or `completion`, does not exist.                           |

## nearhost

Opens the interface, at a terminal. The interface is a client of the background Nearhost, which serves your projects: with none running, `nearhost` starts one in the background first, then attaches to it. `q` asks whether to stop it or leave it running when the interface started it. See [First run](https://nearhost.dev/pr-preview/pr-138/docs/getting-started/first-run.md) and [Run Nearhost in the background](https://nearhost.dev/pr-preview/pr-138/docs/guides/run-in-the-background.md).

It needs a terminal: stdin and stdout must both be one. Without one, as in a cron job, a script or a pipe, it starts nothing, prints this to stderr and exits 1:

```text
Error: The interface needs a terminal, and there is none here.

Run it in the background:

  nearhost -d

Or serve without the interface:

  nearhost up
```

On Windows the message adds `In Git Bash, run it through winpty or use Windows Terminal.` `nearhost --help`, `-h` and `help` print the help and exit 0 without a terminal.

| Flag                  | Effect                                                                                                                     |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `-d`, `--detach`      | Start Nearhost in the background, with no interface. See [nearhost -d](#nearhost--d).                                      |
| `--https-port <port>` | Serve HTTPS on this port instead of 443.                                                                                   |
| `--http-port <port>`  | Redirect HTTP on this port instead of 80.                                                                                  |
| `--web-port <port>`   | Serve Nearhost's page at `https://nearhost.localhost:<port>` instead of 6327. `0` turns the page off. From Nearhost 0.8.0. |
| `--no-hosts`          | Leave `/etc/hosts` alone. Add the aliases yourself.                                                                        |
| `--no-capture`        | Keep no requests or responses in memory. See [The request log](https://nearhost.dev/pr-preview/pr-138/docs/concepts/the-request-log.md).                           |

The port flags, `--no-hosts` and `--no-capture` apply only when Nearhost starts. Given to an interface that finds one already running, they change nothing, and the interface says so in its log.

Only one Nearhost runs at a time. `nearhost` attaches to the one that runs, as long as it speaks the same version of the API. Otherwise it fails with `Nearhost in the background speaks a different version of its API.`, with the steps to stop it and open the interface again, and exits 1. When the one that runs is another release, as after an update, it asks `Nearhost in the background is <old>; this is <new>. Restart it now? [Y/n]`. A Nearhost started in a terminal is not offered a restart: a note says to restart it there. Nor is one whose service runs another copy of `nearhost`: it says so. A different `--config` file than the one it serves is refused with `Nearhost in the background serves <file>.`, and the steps: stop it with `nearhost stop` to use the other file, or open the interface on the file it serves. `nearhost up` and `nearhost daemon` stop with the error below, without the pid when it is not known. When the second one's ports are taken, it reports the ports first.

```text
Error: Another Nearhost is already running (pid 4121).

Stop it:

  nearhost stop

Or see what it serves:

  nearhost status
```

### nearhost -d

Starts the background Nearhost, with no interface and no terminal needed, and returns once it answers. It runs `nearhost daemon`, started in a session of its own with its output in the core log. It waits up to 15 seconds.

```text
Nearhost is running in the background (pid 4121). Stop it with nearhost stop.
```

| It prints                                                                                                       | When                                                                                                    |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `Nearhost is running in the background (pid N). Stop it with nearhost stop.`                                    | It started the core.                                                                                    |
| `Nearhost is running in the background as a service (pid N). Stop it with nearhost stop.`                       | It started the core through the installed service.                                                      |
| `Warning: Starting Nearhost through its service failed (<why>), so it was started directly.`                    | The service did not start the core, so it started one itself.                                           |
| `Note: You are not signed in to Windows, so the service could not start Nearhost, and it was started directly.` | On Windows with nobody signed in, as over SSH, the service's task cannot run, so it started one itself. |
| `Nearhost is already running in the background (pid N, started by <how>).`                                      | A core ran already. It starts nothing and exits 0.                                                      |
| `Nearhost is already running in a terminal (pid N).` and how to run it in the background instead                | `nearhost up`, or `nearhost daemon` by hand, runs already. It exits 0.                                  |
| `Error: Nearhost stopped while starting.`, then `The end of <path>:` and the last lines of the log              | The core stopped before it answered. It exits 1.                                                        |
| `Error: Nearhost stopped while starting.`, then `It stopped (<why>) before it wrote to <path>.`                 | The core stopped before it wrote to its log. It exits 1.                                                |
| `Error: Nearhost is still starting.` and the path of its log                                                    | The core had not answered after 15 seconds, and goes on starting. It exits 1.                           |
| `Error: Interrupted while Nearhost started in the background.` and what became of it                            | Ctrl-C stopped the wait. It exits 130.                                                                  |

The notes, the warning and the errors go to stderr. `<how>` says how the running core started: `by its service`, `with nearhost -d`, `by the interface` or `in a terminal`. It takes `--https-port`, `--http-port`, `--web-port`, `--no-hosts`, `--no-capture` and `--config`. With a service installed, a flag or `--config` makes Nearhost start the core directly, since the service has its own settings, and print `Note: A service is installed, but it runs with its own settings, so Nearhost was started directly with yours.` on stderr. See [Nearhost in the background does not start](https://nearhost.dev/pr-preview/pr-138/docs/troubleshooting/troubleshooting.md#nearhost-in-the-background-does-not-start) for an example.

## nearhost up

Starts the named projects, or every enabled project when none is named, and serves them until Ctrl-C. It takes the same five flags as `nearhost`.

```sh
nearhost up myapp
```

Ctrl-C, a SIGTERM and closing the terminal all stop it the same way. It stops the projects and their ssh connections, and waits at most 30 seconds for them. A second Ctrl-C stops at once. Started under `nohup`, it keeps running when the terminal closes. On Windows, closing the window gives it the few seconds Windows allows before it ends the process, and Ctrl-C there gives it the full shutdown.

With no project named, `up` applies a change to the config when the file is saved, as the background Nearhost does, so a project you add with `nearhost add` is served in a moment. With names, it reads the config once, when it starts: to serve another project, stop `up` and start it again.

`up` is the foreground way to run Nearhost, for scripts and for anyone who wants no background process. It answers coding agents too, through [Nearhost's page](https://nearhost.dev/pr-preview/pr-138/docs/concepts/tls-and-the-proxy.md): each request that needs your answer is printed with the link to answer it.

Once every project has tried to start, `up` checks that at least one is running, or is starting or reconnecting while it waits on its server. If none is, it prints the summary and `Nothing can be served, so nearhost up is stopping.`, stops as Ctrl-C does and exits 1, so a script sees the failure. It does the same when every change to the hosts block is refused.

When the hosts block needs to change, it asks for your password in the terminal. Without a terminal, as under CI or `nohup`, it cannot ask for your password, so it skips the hosts change and prints a warning, once: `Warning: The hosts file needs sudo, and there is no terminal to ask in.`, and the two ways round it: run `nearhost up` once in a terminal, or pass `--no-hosts`. To run Nearhost under a service manager, use `nearhost service install`: it runs the background Nearhost, which never asks for sudo, and `nearhost hosts update` brings the block up to date in a terminal. Do not give Nearhost a passwordless `sudo` rule to get around this: its binary is usually writable by you, so the rule would give your account root. On Windows, the change goes through a User Account Control prompt, with no password.

On Linux, when this user may not bind port 80 or 443, `up` stops with the `setcap` command for its binary:

```text
Error: HTTPS port 443 needs permission to bind.

On Linux, a program may use ports below 1024, such as 443 for HTTPS and
80 for HTTP, only when it has been given permission. The install script
gives it; a nearhost you build or copy yourself does not have it.

To give it permission, run:

  sudo setcap cap_net_bind_service=+ep '/home/you/go/bin/nearhost'

Then start Nearhost again. Do not run nearhost with sudo.

Run `nearhost doctor` to check this and the rest of what Nearhost needs.
```

When another program holds the port, it says so instead: quit that program, or pass `--https-port` and `--http-port`.

## nearhost daemon

Runs the background Nearhost in the foreground, with no interface: it serves every enabled project, applies changes to the config as they are saved, and logs to `core.log` in the config folder, which is where its standard output and error go too. It takes `--https-port`, `--http-port`, `--web-port`, `--no-hosts` and `--no-capture`, as `nearhost` does. It is what `nearhost -d` and a service start, so you rarely run it yourself.

It never asks for sudo or a User Account Control approval. When the hosts block needs a change, the projects that need it stay stopped. The log says `the hosts file needs updating, and Nearhost in the background never asks for sudo.`, and `nearhost status` warns `Warning: <project> waits for the hosts file to be updated.`; both give `nearhost hosts update` to run in a terminal. See [nearhost hosts](#nearhost-hosts).

`--started-by <how>`, left out of `nearhost daemon --help`, records what started it: `foreground`, the default, `detached`, `tui` or `service`. `nearhost -d`, the interface and a service pass it. It is what `nearhost status`, `nearhost doctor` and Nearhost's page report, and it changes how the core is treated. A `service` core exits 0 when another Nearhost runs, and `nearhost update` restarts it through the service manager. A `tui` core is the one the interface may stop when you quit. Pass it by hand only to reproduce how one of those starts behaves.

Started by a service, it exits 0 with `info [core.already-running] Another Nearhost is already running, so this service start does nothing.` in the log when one runs already, so the service manager sees no failure. Run by hand with one running, it stops as `nearhost up` does.

## nearhost stop

Stops the running Nearhost, whoever started it, and waits until it has stopped serving and let go of its ports, so it can be started again at once. A `nearhost up` in another terminal stops too.

```text
Stopped.
```

With nothing running it prints `Nearhost is not running.` and exits 0. It waits up to 35 seconds, then fails with `Error: Nearhost has not stopped after 35s.` and the path of the core log, which says why. A service does not start the core again after a stop, because the stop is a clean exit: the core stays stopped until you start it with `nearhost` or `nearhost -d`, or log in again.

## nearhost status

Shows the running Nearhost: its version, what started it, each server and project it serves, what waits for your answer and the page's address.

```text
Nearhost 0.16.0 is running (pid 4121, started by its service at 2026-11-23 09:12:40).

SERVER  STATE      MESSAGE
local   connected

PROJECT  STATE    URL                 MESSAGE
myapp    running  https://myapp.test

Waiting for your answer:
  Claude Code on mini asks to open port 5173: https://nearhost.localhost:6327/approve/k3f9q2

Page: https://nearhost.localhost:6327
```

The `Waiting for your answer` list is left out when nothing waits. With no project served, a note says `No projects are being served.`, with `nearhost add <path>` as the step to add one.

Notes go to stderr, so they stay out of a pipe. When a newer release is out, one says `Note: Nearhost <version> is available.`, with the command to update, or, when this copy is already that release, `Note: This copy is <version>; restart Nearhost to run it.`, with the commands to stop and start it. A Nearhost started by `nearhost up` with project names gets `Note: Nearhost serves the projects it was started with and does not reload the config.` At a terminal, the page's address carries the key that lets your browser see the project list and the approvals, so do not paste it where others can read it. Piped, it is plain.

`--json` prints the same as one JSON object:

```json
{
  "info": {
    "api": 1,
    "version": "0.15.0",
    "pid": 4121,
    "started": "2026-11-23T09:12:40.724259857Z",
    "startedBy": "service",
    "reloads": true
  },
  "servers": [{ "name": "local", "state": "connected", "message": "" }],
  "projects": [{ "name": "myapp", "state": "running", "message": "", "url": "https://myapp.test" }],
  "approvals": [],
  "page": "https://nearhost.localhost:6327"
}
```

`startedBy` is `foreground` for `nearhost up` and `nearhost daemon` run by hand, `detached` for `nearhost -d`, `tui` for a core the interface started, and `service`. `page` is empty when the page is off, and `update` appears only when a newer release is out. Each entry in `approvals` has `id`, `summary` and `url`. A server or project with a problem, such as a project in `error`, also has `problem`: the problem as a message, with its `code`, `level`, `title` and, when it has them, `detail` and the `fix` steps. Its `title` is the `message`.

With no Nearhost running, `nearhost status` prints this to stderr and exits 3. When a service is installed, it adds `A service is installed, and nearhost -d starts it.` under the title. With `--json` the error goes to stderr as one line of JSON, as in [Errors, warnings and notes](#errors-warnings-and-notes), so standard output stays JSON or nothing.

```text
Error: Nearhost is not running.

Start it in the background:

  nearhost -d

Or open its interface:

  nearhost
```

## nearhost service

`nearhost service install` and `nearhost service uninstall` manage a service that starts the background Nearhost when you log in: a launchd agent on macOS, a systemd user service on Linux and a logon task in Task Scheduler on Windows 11. See [Run Nearhost in the background](https://nearhost.dev/pr-preview/pr-138/docs/guides/run-in-the-background.md#start-it-at-login) for what each writes and what environment it carries. Where there is no service manager to use, they exit 1 with `Nearhost cannot be a service on this system.`, as services are supported on macOS, on Linux with systemd, and on Windows 11. On Linux when `systemctl --user` does not answer, as in a container, they exit 1 with `This system has no systemd user manager, so Nearhost cannot be a service here.`, and say to run `nearhost -d` from your shell's startup instead.

### nearhost service install

Installs the service, or brings it up to date, so that it runs this copy of `nearhost` with your `PATH` and Docker settings. Run it as yourself: as root it fails with `Install the service as yourself, not as root.`, since the service runs as the user who installs it, and exits 1. It refuses a copy that will not last, such as one run by `npx` or `go run`, and says how to install one. On Linux it refuses a copy that may not use ports 80 and 443, with the `setcap` command to run first, as in [Errors, warnings and notes](#errors-warnings-and-notes).

| Flag          | Effect                                                                            |
| ------------- | --------------------------------------------------------------------------------- |
| `-y`, `--yes` | Restart the running service's Nearhost without asking, when the settings changed. |

It prints notes to stderr first, when there are any: about a copy under an nvm or fnm Node version, and about `SSH_AUTH_SOCK`. Then one of:

| It prints                                                                                                                                                                                          | When                                                                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `The Nearhost service is installed and up to date.`                                                                                                                                                | Nothing changed. Nothing else is done.                                                                                                                                                     |
| `Installed the Nearhost service. It starts at login and runs <path>.` then `Nearhost is running now (pid N).`                                                                                      | The service is new or changed, and no core ran. It starts one.                                                                                                                             |
| `Installed the Nearhost service. ...` then `The service's settings changed. Restart Nearhost now to apply them? Open passthroughs close. [Y/n]`                                                    | The service's own core ran. `Restarted Nearhost with the new settings.` follows a yes, and `The new settings apply from Nearhost's next start.` a no, or no terminal. `--yes` answers yes. |
| `Installed the Nearhost service. ...` and `Nearhost is already running (started by <how>), so the service takes over from your next login. To hand over now, run nearhost stop, then nearhost -d.` | A core that is not the service's ran. It is left running.                                                                                                                                  |

### nearhost service uninstall

Stops the Nearhost that the service started, and removes the service. A Nearhost started any other way is left running.

| It prints                                                                                                | When                                                           |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `Removed the Nearhost service.`                                                                          | The service was removed, and no core of its ran.               |
| `Removed the Nearhost service. Stopped Nearhost, which it ran.`                                          | The service's core ran, and was stopped first.                 |
| `No Nearhost service is installed.`                                                                      | There was none. It exits 0.                                    |
| `Warning: The Nearhost service cannot be read, so it is removed as it is.`, on stderr, with why under it | The definition was edited by hand. It is removed all the same. |

## nearhost add

Adds a project. It discovers the routes from the project's files, prints them and saves the project. At a terminal it asks when it needs to: whether to trust the official presets, which suggested presets to enable, which port is the web app, whether to add a server it does not know, and whether to approve hosts, a main name or Docker access that the project's `.nearhostrc` or presets ask for, and loopback ports that its `.nearhostrc` adds. Without a terminal it stops rather than approve them. It starts nothing and changes no file in the project.

Approval asks about each item on its own, as `<item>: approve? [y/N]`. Before it asks about a host or a main name, it says what approving a name does. A no drops that host, loopback port or `docker_clients`, and the add goes on. A refused main name falls back to the `.test` one, and the summary names what was left out. Nearhost asks about a refused item from the `.nearhostrc` again when it next reviews the project. See [Approval](https://nearhost.dev/pr-preview/pr-138/docs/reference/nearhostrc.md#approval).

Its last line says whether the Nearhost already running picks the project up. With the interface open, the background Nearhost running, or `nearhost up` with no project named, it says `The running Nearhost picks it up in a moment.` Under `nearhost up` with names, it says to stop `up` and start it again. With nothing running, it says to start it with `nearhost up`. When it cannot tell which kind of Nearhost runs, it says to stop it and start it again if the project does not appear. A project added with `--disabled` is not started: the interface lists it, and the line says `The running Nearhost serves it once it is enabled in the config.`

When the interface or the background Nearhost runs, `add` first brings the hosts block up to date, as `nearhost hosts update` does, since that Nearhost never asks for sudo. If that fails, or there is no terminal, it warns `Warning: The running Nearhost serves the project once the hosts file is up to date.`, with the command to run in a terminal: `nearhost hosts update`.

Ctrl-C, or any other signal that `nearhost up` stops on, ends the add cleanly: it closes the ssh connection, removes its temporary folder, saves nothing, prints `Error: Interrupted, so the project was not added.` and exits 130. A second Ctrl-C ends it at once.

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

See [Add a project](https://nearhost.dev/pr-preview/pr-138/docs/getting-started/add-a-project.md).

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
Error: .nearhostrc already exists in /home/you/code/shop.

Replace it:

  nearhost export shop --force

Or see what would be written:

  nearhost export shop --dry-run
```

The file follows the project's `.env` on another machine. See [Variables](https://nearhost.dev/pr-preview/pr-138/docs/reference/nearhostrc.md#variables).

- A port is written as `${VAR:-port}` when discovery finds a variable that sets it, and `.env` sets that variable to the same port or leaves it unset. A variable that `.env` sets to another port gives a plain number.
- The main name is written as `${VAR:-name}` only when a variable whose name ends in `_HOST` holds exactly that name. A variable such as `SESSION_DOMAIN` with the same value is not used, since on another machine it may hold a parent domain or a cookie's scope. With more than one `_HOST` variable, the first alphabetically wins.
- The main name is left out when it is the default, the directory's name followed by `.test`.
- `docker_clients: true` is written when the project has it.

Before writing, it checks that the file reads back to the same project. After writing, it records the file as approved, since it holds only what Nearhost already serves, so the project does not ask about it again. If a change to the old file was waiting for approval, the new file replaces it and the command says so. See [Approval](https://nearhost.dev/pr-preview/pr-138/docs/reference/nearhostrc.md#approval).

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

Lists the projects in the config, with their server, alias, whether they are enabled, and the routes that are not ignored. With no projects, it prints nothing on standard output, and a note says `No projects yet.` with `nearhost add <path>` as the step.

## nearhost trust

Installs the local CA root into the system trust store, which asks for your password. It then reports on the browser stores that Firefox and Linux Chromium-based browsers use, and updates them when `certutil` is installed. Run it again at any time; it only does what is missing.

It runs `sudo` from `/usr/bin`, `/bin`, `/usr/local/bin` or `/run/wrappers/bin`, and only a copy owned by root. Without one, it stops and says so, unless you run it as root. From Nearhost 0.8.0.

On Windows it adds the root to your user's certificate store, which Windows confirms in a dialog of its own, with no password and no administrator rights. Every browser on Windows uses that store, Firefox from version 120, so there are no browser stores to update.

## nearhost untrust

Reverses `trust`: removes the local CA from the system and browser stores. It asks for your password, and runs `sudo` under the same rule as `trust`. On Windows it removes the root from your user's certificate store, with no password. Unless you pass `--delete-key`, the CA's key stays in its folder, so `nearhost trust` can add the same CA again. See [The local CA](https://nearhost.dev/pr-preview/pr-138/docs/concepts/tls-and-the-proxy.md#the-local-ca).

When the system store does not hold the CA, it prints `Nearhost Local CA was not in the trust store.`, asks for no password, cleans the browser stores and exits 0. It exits non-zero when the system still trusts the root afterwards, or when a browser store still trusts it or `certutil` could not reach one, and names those stores.

| Flag           | Effect                                                                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `--delete-key` | After untrusting, delete the CA's folder with its private key, the site certificates it issued, and any copy Nearhost 0.7 left. It asks first. |
| `-y`, `--yes`  | With `--delete-key`, delete without asking.                                                                                                    |

`--delete-key` refuses while a Nearhost runs, without a terminal unless you also pass `--yes`, and under `sudo` on another user's files. If untrusting fails in a way you can fix, it deletes nothing and says what to fix. If trust remains that Nearhost cannot remove, it deletes the key anyway, then fails, names the old root by fingerprint and serial number, and keeps a copy of its certificate in `old-roots`.

## nearhost hosts

- `apply` sets the nearhost block to the aliases read from stdin, one per line. It writes the file itself, so it runs as root: Nearhost calls it through `sudo`.
- `update` brings the block up to date for every enabled project, as `nearhost up` does when it starts, then tells the running Nearhost, which starts the projects that were waiting for it. It asks for your password through `sudo`. It prints `Updated /etc/hosts.` or `/etc/hosts is already up to date.` Without a terminal, when it needs a password, it fails with `Error: The hosts file needs sudo, and there is no terminal to ask in.` and says to run it in a terminal. It takes no `--file`. The background Nearhost never asks for sudo, so this is how its projects get their names. See [Run Nearhost in the background](https://nearhost.dev/pr-preview/pr-138/docs/guides/run-in-the-background.md#the-hosts-file).
- `clean` removes the block, and asks for your password through `sudo`.

On Windows, Nearhost runs `apply` as administrator through User Account Control, and `update` and `clean` ask for your approval the same way. A hosts file with the read-only attribute is left as it is, with a message that says how to clear the attribute. See [The hosts file is read-only](https://nearhost.dev/pr-preview/pr-138/docs/troubleshooting/troubleshooting.md#the-hosts-file-is-read-only).

`apply` is left out of `nearhost --help` from Nearhost 0.8.0, because Nearhost runs it itself through `sudo`. `apply` and `clean` take `--file <path>` to work on another file than `/etc/hosts`. See [The hosts file](https://nearhost.dev/pr-preview/pr-138/docs/concepts/the-hosts-file.md).

`apply` is the step that writes the file, so it is the one to run by hand when you want to see why a hosts update fails. `--file` points it at a copy, which needs no root:

```sh
printf 'myapp.test\napi.myapp.test\n' | nearhost hosts apply --file ./hosts-copy
```

It takes two more flags, which the Windows elevator uses:

| Flag              | What it does                                                                     |
| ----------------- | -------------------------------------------------------------------------------- |
| `--input <file>`  | Read the aliases from this file instead of stdin. It reads at most 1 MiB.        |
| `--report <file>` | When `apply` fails, write the error's text to this file, for the caller to show. |

Run as root or administrator, `apply` refuses both flags on macOS and Linux. On Windows it takes them only for an `input` and a `report` file in a folder Nearhost made for the run. It exits 3 when it refuses them, so the caller can tell that no report came back.

## nearhost doctor

Checks the setup and changes nothing, apart from creating `~/.nearhost` on each server for the agents check. It asks the running core what it can reach from where it runs, which a service can differ in from your shell. Each line is `ok`, `warn`, `FAIL` or `info` (a note that needs nothing done), with a fix where there is one, and only a failure makes it exit 1. After the machine checks, it checks each enabled project's files and setup and lists what it finds. See [Project checks](#project-checks). An error there also makes it exit 1. It takes `--https-port`, `--http-port`, `--web-port` and `--no-hosts`, and `--json` prints all of it as one JSON object. See [JSON output](#json-output).

`--verbose` adds a `code:` line under each row that did not pass, with the code an error about the same problem has. See [Errors](https://nearhost.dev/pr-preview/pr-138/docs/reference/errors.md).

```text
FAIL  privileged ports not root and the binary lacks cap_net_bind_service
      fix: `sudo setcap cap_net_bind_service=+ep '/home/you/go/bin/nearhost'`
      code: port.needs-permission
```

Each line prints as soon as its check finishes, so a slow server does not hold back the rest. At a terminal, a check that takes longer than 2 seconds prints `checking <name>…` on its own line to stderr. `--json` still prints one document at the end, with no such lines.

| Check                              | What it looks at                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `core`                             | Whether the background Nearhost runs, its version and what started it: `<version>, started by <how> (pid N)`. Not running is a note. A core of another release than this `nearhost`, or one that speaks another version of its API, warns, and the fix is `nearhost stop`, then `nearhost -d`.                                                                                                                                                                                                                                                                                                                                                           |
| `core: browser`                    | Whether the core can open links, which it does for an always-allowed document and a Yes on the page. It warns when the core runs outside your desktop session (on macOS, outside the Aqua session; on Windows, outside your sign-in session), or, on Linux, has no `DISPLAY` or `WAYLAND_DISPLAY`, or no `xdg-open`. On a server with no desktop it warns, which is right.                                                                                                                                                                                                                                                                               |
| `core: ssh agent`                  | Whether the core's `SSH_AUTH_SOCK` answers. It warns when the socket cannot be reached, and notes when none is set, since `IdentityAgent` in `~/.ssh/config` may supply one. Not shown on Windows, where `ssh agent` below is checked.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `core: docker`                     | Whether `docker` is on the core's `PATH` and answers `docker version`. A note when it is not on `PATH`, since only Docker projects need it; a warning when it does not answer, or takes over 5 seconds.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `core: ssh`                        | The `ssh` the core finds. A core with none fails.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `service`                          | Whether the login service is installed, runs this copy and is running. Not installed is a note. The check is left out on a system with no service manager, and is a note on Linux without a systemd user manager. It warns for a service that runs another copy of `nearhost`, one whose log folder is missing, one whose definition cannot be read, and one that is installed while no Nearhost runs. On Windows, when the service is starting a core again after it stopped, it warns `installed; it is starting Nearhost again after it stopped`. While a Nearhost started another way runs, it notes that the service takes over at your next login. |
| `core: environment`                | A note, `not checked: <why>`, when the core cannot answer what it can reach, as an older core cannot.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `config`                           | Whether the config file reads and is valid. When it cannot be read, `hosts block` and `servers` say `not checked: the config could not be read`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `port 443`, `port 80`, `port 6327` | Whether the ports are free, and what holds them if not. 443 is checked for HTTP/3 too. 6327 is Nearhost's page, or the port `--web-port` gives, and is left out with `--web-port 0`. A busy 6327 only warns. The 6327 check is from Nearhost 0.8.0. On Windows, a port held by HTTP.sys says how to find the service that holds it. While Nearhost runs, a port it holds shows `in use by the running Nearhost` and passes. If no tool can name the holder while Nearhost runs, the check warns.                                                                                                                                                         |
| `privileged ports`                 | On Linux, whether the binary may bind ports below 1024.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `local CA`                         | Whether it exists, whether the system trusts it, and when it expires.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `old CA copy`                      | Only shown when `~/.config/nearhost/caddy` (or `$XDG_CONFIG_HOME/nearhost/caddy`), where Nearhost 0.7 and earlier kept the CA, is still there beside the new one. It warns, and the fix is to delete the old folder.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `browser stores`                   | Whether the Firefox and Chromium stores trust it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `ssh agent`                        | On Windows, whether the ssh-agent service is running. Only keys with a passphrase need it, so a stopped or disabled service is a note, with the commands to start it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `ssh`                              | On Windows, the version of `ssh.exe`. One older than the 9.5 that Windows 11 ships warns, and a missing one fails.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `ssh vendor`                       | On Windows, where the `ssh` that Nearhost runs lives. One outside `%SystemRoot%\System32\OpenSSH` and `%ProgramFiles%\OpenSSH`, such as Git for Windows' ssh, warns with its path, and the fix is to put `%SystemRoot%\System32\OpenSSH` first on `PATH`.                                                                                                                                                                                                                                                                                                                                                                                                |
| `firefox`                          | Only shown on Windows when Firefox is set not to read Windows' trusted roots. It warns, and names the setting to change.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `host patterns`                    | Only shown when an exact host of one enabled project falls under a pattern of another. It warns: requests for that host go to the project that names it exactly.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `loopback ports`                   | Only shown when an enabled project has a loopback route on Nearhost's own HTTPS, HTTP or page port. It fails: that route is not forwarded.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `aliases`                          | Only shown when a main name is not a valid domain. It fails, and the project does not start.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `hosts block`                      | Whether `/etc/hosts` has every name it needs: main names and web hosts, less exact names outside `.test` whose DNS answers are all loopback addresses. A block from Nearhost 0.7 or earlier, with no `::1` lines, warns. `nearhost hosts update` fixes it.                                                                                                                                                                                                                                                                                                                                                                                               |
| `server <name>`                    | Whether `ssh <host>` connects without a prompt, for each server.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `agents on <name>`                 | Whether the server takes the socket coding agents reach Nearhost on. A refusal warns.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

### Project checks

Each enabled project is checked where it runs: its `.nearhostrc`, its routes against what discovery finds in its files, the names it is served at, and its Compose file. Each finding has an id, a severity and a fix. Its id is its code in [Errors](https://nearhost.dev/pr-preview/pr-138/docs/reference/errors.md). In the text output an `error` shows as `FAIL`, a `warning` as `warn` and an `info` as `info`, with a `fix:` line under it and any snippet to paste under that. The fix's kind says who makes it:

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
| `hosts.dns-unchecked`       | info                   | `manual`   | Nearhost could not ask DNS directly, so it did not check whether real-domain names resolve elsewhere.                                                 |
| `hosts.overlap`             | warning                | `project`  | One of the project's patterns overlaps a different pattern of another enabled project. A name that both patterns match goes to the more specific one. |
| `docker.host-gateway`       | warning                | `project`  | A Compose service uses a name Nearhost serves, and its `extra_hosts` does not map that name to the host.                                              |
| `docker.ca`                 | warning                | `project`  | A Compose service calls a name Nearhost serves, and does not trust Nearhost's root certificate.                                                       |
| `docker.clients`            | warning, info on macOS | `project`  | A container calls a name Nearhost serves, and the project does not have `docker_clients: true`.                                                       |
| `docker.compose-parse`      | warning                | `project`  | The Compose file is not valid YAML, so its services were not checked.                                                                                 |
| `docker.compose-depth`      | warning                | `project`  | The Compose file nests or repeats `<<` merges too deeply to check, so its services were not checked.                                                  |
| `docker.compose-file`       | info                   | `manual`   | `COMPOSE_FILE` is set, and Nearhost checked only the Compose files Compose reads by default. Check the ones it names yourself.                        |
| `advice.<id>`               | warning                | `project`  | An [advisory](https://nearhost.dev/pr-preview/pr-138/docs/reference/advisories.md) applies. The snippet is the change to make.                                                                |
| `presets.note`              | info                   | `manual`   | Discovery or a preset gave a warning, so some checks may be incomplete.                                                                               |
| `projects.unchecked`        | info                   | `manual`   | The project could not be checked: its server can't be reached, its directory is missing, or the checks took over 30 seconds.                          |

A few depend on the project:

- The `nearhostrc.*` findings follow [Approval](https://nearhost.dev/pr-preview/pr-138/docs/reference/nearhostrc.md#approval) and [When it is read](https://nearhost.dev/pr-preview/pr-138/docs/reference/nearhostrc.md#when-it-is-read).
- `routes.unserved-port`, `routes.unserved-host` and `routes.stale-port` are for a project without a `.nearhostrc`. A project with one takes its routes from the file.
- `routes.not-listening` and the `docker.*` findings are for a project on this machine. `routes.not-listening` is a warning only when Nearhost is running the project, which `nearhost doctor` does not know, so there it is always info.
- `nearhost doctor` leaves out `hosts.unresolved` for a name the `hosts block` check already names. With `--no-hosts` it is not checked at all.
- The `docker.*` findings read the Compose file and its override file as Compose does, and name the override when the service is defined there. A Compose file that is not valid YAML is reported as `docker.compose-parse`, and a `COMPOSE_FILE` setting is noted as `docker.compose-file`. See [Discovery](https://nearhost.dev/pr-preview/pr-138/docs/concepts/discovery.md#what-presets-add).
- The `docker.*` findings come with the snippet to paste. [Callbacks from Docker containers to a local HTTPS domain](https://nearhost.dev/pr-preview/pr-138/docs/guides/container-callbacks.md) explains each one.

### JSON output

`--json` prints one object with two arrays, `checks` and `findings`, and exits as the text output does. Each check has `name`, `level` (`ok`, `warn`, `fail` or `info`), `detail` and `fix`. A check that did not pass also has `code` and `steps`, its fix as a list of steps, each with its `text` and any `command`. Each finding has:

- `id`, `severity` and `project`;
- `message`, what is wrong;
- `file` and `line`, where it is, when the finding points at a file;
- `fix`, with its `kind`, its `text` and any `snippet`;
- `code`, the same as `id`, and `title`, the message as a sentence;
- `detail`, why, when there is more to say than the title;
- `steps`, the fix as steps, as a check has them.

`file`, `line`, `snippet` and `detail` are left out when they are empty. A project's findings come worst first.

For a project whose `.nearhostrc` has a mistyped key, with a route that also serves a real name, the output starts like this, with the machine checks cut:

```json
{
  "checks": [
    {
      "name": "hosts block",
      "level": "fail",
      "detail": "missing api.local.example.com, shop.test, www.example.com",
      "fix": "Run `nearhost hosts update`; it updates the block and asks for your password",
      "code": "hosts.needs-update",
      "steps": [
        {
          "text": "Run `nearhost hosts update`; it updates the block and asks for your password"
        }
      ]
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
      },
      "code": "nearhostrc.invalid",
      "title": ".nearhostrc: line 5: key \"hostz\" is not understood by this version of Nearhost; update Nearhost, or remove it.",
      "steps": [
        {
          "text": "Correct .nearhostrc."
        }
      ]
    },
    {
      "id": "hosts.public",
      "severity": "warning",
      "project": "shop",
      "message": "www.example.com is a real name that resolves to 203.0.113.10; while the project is enabled, the real site is out of reach on this machine",
      "fix": {
        "kind": "manual",
        "text": "Nothing to do if that is what you want; otherwise use a name that resolves to 127.0.0.1, or a .test name."
      },
      "code": "hosts.public",
      "title": "www.example.com is a real name that resolves to 203.0.113.10; while the project is enabled, the real site is out of reach on this machine.",
      "steps": [
        {
          "text": "Nothing to do if that is what you want; otherwise use a name that resolves to 127.0.0.1, or a .test name."
        }
      ]
    },
    {
      "id": "routes.not-listening",
      "severity": "info",
      "project": "shop",
      "message": "nothing listens on port 8010, which serves shop.test, api.local.example.com, www.example.com",
      "fix": {
        "kind": "manual",
        "text": "Start the project's dev server on port 8010, or correct the port."
      },
      "code": "routes.not-listening",
      "title": "nothing listens on port 8010, which serves shop.test, api.local.example.com, www.example.com.",
      "steps": [
        {
          "text": "Start the project's dev server on port 8010, or correct the port."
        }
      ]
    }
  ]
}
```

`api.local.example.com` and `shop.test` do not resolve to this machine either, but the `hosts block` check already names them, so no `hosts.unresolved` finding repeats them. The exit status is 1. Coding agents run the same checks on one project through the [agent API](https://nearhost.dev/pr-preview/pr-138/docs/coding-agents/how-it-works.md#agent-api).

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

`preset list` warns on stderr about a trusted registry it cannot read, and leaves out its presets. `preset update` warns on stderr about each preset it could not update, as `Warning: <name>: not updated: <why>.`, and when any failed it ends with `Error: <n> of <m> presets could not be updated.` and exits 1.

## nearhost preset registry

| Command                                     | What it does                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------- |
| `nearhost preset registry add <owner/repo>` | Trust the registry in a public GitHub repository. `--as <alias>` names it.            |
| `nearhost preset registry list`             | The trusted registries and their cached indexes.                                      |
| `nearhost preset registry remove <alias>`   | Stop trusting a registry, once none of its presets are enabled. Their files are kept. |

See [Presets and registries](https://nearhost.dev/pr-preview/pr-138/docs/concepts/presets-and-registries.md).

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

After the update, it runs `nearhost version` on the copy your next command starts: the Homebrew link, the pnpm shim on your `PATH`, or the binary itself. If that copy is still the old version, it fails with `Error: The update ran, but <path> is still <old>.`, with the command to install by hand, and exits 1. It does the same when that copy does not start or prints no version. A copy built with `go install` reports its release version, so it is checked the same way.

On Linux, replacing the binary drops its permission to bind ports 80 and 443. After any update, `nearhost update` prints the `setcap` command for the real binary file: the file behind Homebrew's link, or the platform package's binary behind pnpm's shim. It prints nothing when the binary keeps the capability, or when the system lets any user bind port 80. After a shell installer update, the installer prints the command as well.

When a background Nearhost runs, the update restarts it on the new binary, so the update does not leave an old core serving. A core that a service started comes back through the service, and any other as if started by `nearhost -d`, with the same config file and flags. When the restart would close open passthroughs or forwards, it asks `Restart Nearhost now to run <version>? This closes <n> passthroughs for a moment. [Y/n]` first, and `--yes` answers yes. Without a terminal, or on a no, it leaves the core and prints `Note: Nearhost in the background still runs <old>.`, with the commands to restart it when you are ready. After a restart it prints `Restarted Nearhost (pid N); it now runs <version>.` An interface open on that Nearhost closes first, with `The open nearhost window will close; open nearhost again.` On Linux, when the new binary cannot yet bind ports 80 and 443, it leaves the running Nearhost and says to run the `setcap` command first. Nearhost in a terminal, as `nearhost up` runs, is left for you to restart there. A service that runs another copy of `nearhost` is left too, with the command that points it at this one: `nearhost service install`. See [Run Nearhost in the background](https://nearhost.dev/pr-preview/pr-138/docs/guides/run-in-the-background.md#updating).

A release shows on GitHub a few minutes before its files are uploaded. Until this system's file is there, `nearhost update` does not offer that release.

On Windows, `nearhost update` can replace the `nearhost.exe` it runs from. For a copy from the PowerShell installer or a zip it runs no other program: it downloads the release's zip itself, to `nearhost.exe.new` beside the running copy, and installs it only if it matches the release's `checksums.txt`. Only then does the running copy move aside for the new one, with retries while a virus scanner holds the file. A failed, cancelled or slow download leaves the running copy as it was; the download has 5 minutes. A Ctrl-C after the download waits until the swap finishes. If the update fails, you keep the copy you had, and the error says so. When you cannot write to the binary's folder, it prints the installer command to run in Windows Terminal opened as administrator, rather than running anything.

| Flag          | Effect                                                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `-y`, `--yes` | Update without asking.                                                                                                       |
| `--check`     | Only report. Exits 0 when up to date, 1 when a newer release is out, and 2 when the check failed, with the reason on stderr. |
| `--next`      | Update to the newest beta, or to the newest release when no beta is newer. Works with `--check` and `--yes`.                 |

With `--next` it looks at betas as well as releases, takes the highest version that has a file for this system, and installs that exact version: `@nearhost/cli@<version>` for npm, pnpm and bun, `@v<version>` for `go install`, `NEARHOST_VERSION=v<version>` for the shell installer, and that version's zip on Windows. Run through `npx`, it tells you to run `npx @nearhost/cli@next`. Betas are not published to Homebrew, so when the newest is a beta, a Homebrew copy installs nothing: it says to run `brew uninstall --cask nearhost`, then install the beta with npm or the shell installer, and to run `nearhost service install` if a service runs Nearhost, and exits 1. When the newest is a release, it runs `brew upgrade` as usual. Once a copy runs a beta, a plain `nearhost update` follows newer betas and then the release, and stays on releases from there.

With `--check`, up to date prints to stdout, as in `nearhost 0.15.0 is the latest.` A newer release is a note on stderr, `Note: nearhost <new> is available; this is <old>, installed with <how>.`, with the command to update, and the exit status is 1 so that a script can tell. A check that fails prints `Error: Nearhost could not find out whether a newer release is out.`, with the reason under it, such as GitHub not answering.

At the `[Y/n]` question, an empty line is yes. End of input, or input that cannot be read, is No: nothing runs and the exit is 0. Without a terminal it asks nothing: it prints the command to run, or says to pass `--yes`, and exits 0.

Nearhost also checks for a new release at most once a day, in the background, and prints a note to stderr after the command when one is out: `Note: A new nearhost is available: <old> → <new>.`, with the command to update. The interface shows it in its log, and the background Nearhost says so in its log, in `nearhost status` and on its page. When the day's check has to ask GitHub, a command that has finished waits up to 2 seconds for the answer. Later commands that day read the answer from a cache and don't wait. Set `NEARHOST_NO_UPDATE_CHECK=1` to turn the check off.

## nearhost completion

Prints a completion script for `bash`, `zsh`, `fish` or `powershell`. `nearhost completion <shell> --help` says how to load it in that shell.

## nearhost version

Prints the version, as `nearhost 0.8.0`. From Nearhost 0.8.0, `nearhost --version` prints the same line.

## Environment variables

These change what Nearhost does. Set them in the shell that runs it. On macOS and Linux, a service gets only the ones `nearhost service install` copies from the shell it runs in: `XDG_CONFIG_HOME` and `XDG_DATA_HOME` here, with `PATH`, `DOCKER_HOST`, `DOCKER_CONTEXT` and `SSH_AUTH_SOCK`. On Windows, the service's task gets your user's environment variables, as set in Windows, not the shell's.

| Variable                   | What it does                                                                                                                                                                                                                                                                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `XDG_CONFIG_HOME`          | Where the config folder is, when it is an absolute path. See [Config](https://nearhost.dev/pr-preview/pr-138/docs/reference/config.md).                                                                                                                                                                                                                                                |
| `XDG_DATA_HOME`            | Where the data folder, with the local certificate authority, is, when it is an absolute path. See [Beside the config](https://nearhost.dev/pr-preview/pr-138/docs/reference/config.md#beside-the-config).                                                                                                                                                                              |
| `NEARHOST_NO_UPDATE_CHECK` | `1` turns off the daily check for a new release. See [nearhost update](#nearhost-update).                                                                                                                                                                                                                                                      |
| `NEARHOST_TRANSPORT`       | `per-process` makes Nearhost on macOS and Linux reach servers the way it does on Windows: one `ssh` process per forward instead of one shared ControlMaster connection per server. Use it to rule the ControlMaster out when a server's connection misbehaves. Any other value is ignored. See [SSH transport](https://nearhost.dev/pr-preview/pr-138/docs/concepts/ssh-transport.md). |

The installers take `NEARHOST_VERSION`, `NEARHOST_INSTALL_DIR`, `NEARHOST_NO_PATH` and `NEARHOST_SKIP_SETCAP`: see [Install](https://nearhost.dev/pr-preview/pr-138/docs/getting-started/install.md). The coding agent skill takes `NEARHOST_SOCKET`: see [How it works](https://nearhost.dev/pr-preview/pr-138/docs/coding-agents/how-it-works.md). Projects that call back into Nearhost from a container use `NEARHOST_CA_CERT`: see [Container callbacks](https://nearhost.dev/pr-preview/pr-138/docs/guides/container-callbacks.md).
