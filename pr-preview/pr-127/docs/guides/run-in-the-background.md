# Run Nearhost in the background

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-127/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-127/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-127/docs/getting-started/install.md.

Keep your projects served with no terminal open, with nearhost -d or a service that starts at login, and what the background Nearhost does when it needs you.

`nearhost up` serves until you press Ctrl-C. `nearhost` opens an interface on the background Nearhost, starting one if none runs, and when you quit it asks whether to stop it or leave it serving. That background process, called the core in these pages, serves your projects whether or not a terminal is open. Start it by hand with `nearhost -d`, or install a service that starts it each time you log in.

The core is the one Nearhost that serves: the proxy, the projects, the ssh connections, [Nearhost's page](https://nearhost.dev/pr-preview/pr-127/docs/concepts/tls-and-the-proxy.md) and the socket coding agents reach. The interface, `nearhost status` and the page are ways to look at it and answer it.

## Start it, check it, stop it

```sh
nearhost -d
```

This starts the core with no interface and returns once it answers. It prints:

```text
Nearhost is running in the background (pid 4121). Stop it with nearhost stop.
```

With no core running, `nearhost -d` waits up to 15 seconds for it. If the core stops while starting, `nearhost -d` prints `Error: Nearhost stopped while starting.` with the end of its log, and exits 1. If it is still starting when the wait is over, it says `Error: Nearhost is still starting.` with the path of its log, and exits 1, and the core goes on starting. Ctrl-C during the wait exits 130, and says whether the core goes on starting. Run again with a core already running, it starts nothing and says how that one was started:

```text
Nearhost is already running in the background (pid 4121, started by detached).
```

If the running one is a `nearhost up` in a terminal, it says so and tells you to stop it first.

It takes the same `--https-port`, `--http-port`, `--web-port`, `--no-hosts` and `--no-capture` flags as `nearhost`, and `--config`. They apply only when the core starts. See [CLI](https://nearhost.dev/pr-preview/pr-127/docs/reference/cli.md#nearhost--d).

With a [service](#start-it-at-login) installed, `nearhost -d` starts the core through the service, and says `Nearhost is running in the background as a service (pid 4121). Stop it with nearhost stop.` The service has its own settings, so when you give `--config` or one of those flags, Nearhost starts the core directly with yours, and says `Note: A service is installed, but it runs with its own settings, so Nearhost was started directly with yours.` on stderr.

`nearhost status` shows what the core serves:

```text
Nearhost 0.15.0 is running (pid 4121, started by detached at 2026-11-23 09:12:40).

SERVER  STATE      MESSAGE
local   connected

PROJECT  STATE    URL                 MESSAGE
myapp    running  https://myapp.test

Page: https://nearhost.localhost:6327
```

It lists each server and project, any request from a coding agent that waits for your answer, and the address of the page. At a terminal the page's address carries the key that lets your browser see the project list and the approvals. `nearhost status --json` prints the same as JSON. When no core is running, it says `Error: Nearhost is not running.`, with the commands to start one, and exits 3, so a script can tell. Notes about the core, such as a newer release, go to stderr.

`nearhost stop` asks the core to stop and waits until its ports are free again:

```text
Stopped.
```

Stopping a core that is not running is no failure: it prints `Nearhost is not running.` and exits 0. A `nearhost up` in another terminal stops too.

You never restart the core to pick up a change to the config. It watches `config.yaml` and applies a change when the file is saved, so `nearhost add`, `nearhost preset enable` and an edit by hand all take effect in a moment.

## Open the interface on it

`nearhost` opens the interface as a client of the core. With no core running it starts one in the background first, then shows it. With one running, whoever started it, it attaches to that one. Several interfaces can follow the same core.

What quitting does depends on who started the core:

- **The interface started it, and it is the only interface open.** Pressing `q` asks `Stop Nearhost, or leave it running in the background?`, with `Stop` and `Leave running` as buttons and a `Don't ask again` box. Ticking the box saves your choice as [`keep_running`](https://nearhost.dev/pr-preview/pr-127/docs/reference/config.md) in the config, and quitting does not ask again. To be asked again, remove the key.
- **Anything else started it.** `nearhost -d`, a service, or another interface that is still open. Quitting leaves it running and says `Nearhost is still running in the background. Stop it with nearhost stop.`
- **Ctrl-C, or the terminal closing,** never asks, as no one may be there to answer. Where `q` would ask, it stops the core.

When the core runs another release than the `nearhost` you opened, which is what happens after an update, the interface asks `Nearhost in the background is <old>; this is <new>. Restart it now? [Y/n]`. A core started in a terminal, or by a service that runs another copy of `nearhost`, is not restarted for you: the interface says how to. `nearhost --config <file>` refuses when the running core serves another file. See [Updating](#updating).

## Nearhost's page

The core serves [Nearhost's page](https://nearhost.dev/pr-preview/pr-127/docs/concepts/tls-and-the-proxy.md) at `https://nearhost.localhost:6327`, or on the port `--web-port` gives, for as long as it runs. With no interface open, it is the place to look and to answer:

- **Status.** The servers with their health, the projects with their state and address, the open passthroughs, and the core's version and when it started.
- **Waiting for your answer.** Each request from a coding agent has its own page, with the same choices as the interface's prompt: Yes, No, and Always allow where it applies. Each change to a project's `.nearhostrc` that needs your approval has one too, with Approve and Decline. The first answer wins, whether it comes from the page or the interface.
- **Documents** that agents have shown.

The page shows its project list and approvals only to a browser that holds its cookie. `nearhost status` prints the address that sets it when you run it at a terminal, and the interface opens the page with the same kind of link. An approval link on its own, without the cookie, shows nothing and approves nothing.

A request to add a project is the exception. The page shows what the agent proposes and lets you decline it; to accept it, run `nearhost`, where the add form opens filled in. See [Coding agents](https://nearhost.dev/pr-preview/pr-127/docs/coding-agents.md).

## Start it at login

```sh
nearhost service install
```

This installs a service for your user that runs `nearhost daemon`, the core with no interface, and starts it. It starts again at each login. Run it as yourself, not as root. On the first install it prints `Installed the Nearhost service. It starts at login and runs <path>.` and starts the core. If another Nearhost already runs, the service leaves it and takes over at your next login; run `nearhost stop`, then `nearhost -d`, to hand over now.

| System     | What is written                                                                                 | Where it runs                               |
| ---------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------- |
| macOS      | A launchd agent, `~/Library/LaunchAgents/dev.nearhost.core.plist`                               | In your login session                       |
| Linux      | A systemd user unit, `~/.config/systemd/user/nearhost.service`, enabled with `systemctl --user` | Under your user manager                     |
| Windows 11 | A Task Scheduler task named `Nearhost`, which runs at your logon                                | In your interactive session, with no window |

Linux needs systemd with a user manager. Without one, `service install` says so; run `nearhost -d` from your shell's startup instead.

The service runs the copy of `nearhost` that you ran `service install` from, at that path. It refuses a copy that will not be there at your next login: one fetched by `npx`, `bunx` or `pnpm dlx` for a single run, one built by `go run`, and one inside Homebrew's versioned folder, which the next upgrade removes. The message says how to install a lasting copy. On Linux it also refuses a copy that may not use ports 80 and 443, such as one you built yourself, and gives the `setcap` command to run first. See [Errors, warnings and notes](https://nearhost.dev/pr-preview/pr-127/docs/reference/cli.md#errors-warnings-and-notes). A copy under an nvm Node version runs from there, so install the service again if you change your default Node version.

If the core fails, the service manager starts it again. systemd gives up after five tries in a minute, and Task Scheduler after three tries a minute apart. A clean `nearhost stop` is not a failure, so the core stays stopped until you start it again or log in.

Run it again at any time. When nothing changed it says `The Nearhost service is installed and up to date.` and does nothing else. When something did, such as your `PATH`, it brings the service up to date. If the service's core is running, it asks `The service's settings changed. Restart Nearhost now to apply them? Open passthroughs close. [Y/n]`. Answer no, or run it without a terminal, and the new settings apply at the next start. `--yes` restarts without asking.

```sh
nearhost service uninstall
```

This stops the core the service started, if it is running, and removes the service. A core you started with `nearhost -d` or the interface is left running. It prints `Removed the Nearhost service.`, with `Stopped Nearhost, which it ran.` after it when it stopped one, or `No Nearhost service is installed.` when there is none.

### What the service carries from your shell

A service does not get your shell's environment, so `service install` writes what Nearhost needs into the service.

- **macOS and Linux:** `PATH`, so the service finds `ssh`, `docker` and the tools projects run, and `DOCKER_HOST`, `DOCKER_CONTEXT`, `XDG_CONFIG_HOME` and `XDG_DATA_HOME` when they are set. Nearhost keeps its config and its data in the folders the last two name, so a service without them would serve another config than the one you edit.
- **Linux:** `DISPLAY`, `WAYLAND_DISPLAY` and `DBUS_SESSION_BUS_ADDRESS`, when your session's differ from the user manager's, so the core can open links in your browser. The unit is wanted by `graphical-session.target` when a desktop session is running, and by `default.target` otherwise.
- **`SSH_AUTH_SOCK`,** when it points into your home folder or your runtime folder, where it lasts. When the service manager already gives the service the same socket, as launchd does for the system's agent, nothing is written. When it points somewhere that changes at each login, such as an agent that ssh forwarded to this shell, `service install` warns `Warning: SSH_AUTH_SOCK here (<path>) changes at each login, so the service cannot use it.` and writes nothing. When it is not set, it notes `Note: SSH_AUTH_SOCK is not set here, so the service uses the agent your login session provides.` Either way, set `IdentityAgent` in `~/.ssh/config` to an agent socket that lasts. Nearhost runs your `ssh`, so the setting applies as it does in a terminal.
- **Windows:** nothing is written. The task runs with your own environment, through `conhost.exe --headless`, so no console window opens and none stays on your screen.

`nearhost doctor` checks the core's view of this. See [What doctor says](#what-doctor-says).

A service on Linux runs while you are logged in. Nearhost does not turn on lingering (`loginctl enable-linger`), so the core stops when your last session ends, and starts again at your next login. Run `loginctl enable-linger` yourself if you want it to run without a session.

On macOS, run `nearhost service install` from Terminal on the Mac's desktop, not over SSH. The service then runs in your desktop session, where it can open links.

## The hosts file

The core never asks for your password and never raises a User Account Control prompt: a prompt with no one at the terminal, or a dialog at login with no context, is not a thing Nearhost does. When a project's names are missing from the [hosts file](https://nearhost.dev/pr-preview/pr-127/docs/concepts/the-hosts-file.md), the core leaves the project stopped and says so:

```text
docdemo  stopped  https://docdemo.test  project "docdemo"'s hosts are not resolvable: the hosts file was not updated (the hosts file needs updating, and Nearhost in the background never asks for sudo.)
```

`nearhost status` also warns `Warning: docdemo waits for the hosts file to be updated.`, and the core's log has the same refusal with `Fix: nearhost hosts update` under it. Run `nearhost hosts update` in a terminal. It asks for your password through `sudo` (on Windows, for your approval in a User Account Control prompt), brings the block up to date for every enabled project, and tells the core, which starts the projects that were waiting. `nearhost add` does the same at its end, and so does the interface, with its password box.

Most starts need no change: the hosts file is only changed when a project's names are new, so a service that starts at login finds the block right after the first time.

The core does not trust the local certificate authority for you either. If browsers warn about the certificate, run `nearhost trust` once in a terminal. The core's log says so when the CA is not trusted.

## The core's log

The core writes to `core.log` in the config folder: `~/.config/nearhost/core.log`, `%APPDATA%\nearhost\core.log` on Windows, or under `XDG_CONFIG_HOME` when that is set to an absolute path. Each line has a timestamp. It holds what `nearhost up` prints, a line for each request from a coding agent with the link to answer it, and why the core stopped. An error, a warning or a note is a block of lines: the first has its level and its code in brackets, and the lines under it, indented, say why, how to fix it and what caused it. Look the code up in [Errors](https://nearhost.dev/pr-preview/pr-127/docs/reference/errors.md).

```text
2026-11-25T14:29:57Z error [port.needs-permission] HTTPS port 443 needs permission to bind.
2026-11-25T14:29:57Z   On Linux, a program may use ports below 1024, such as 443 for HTTPS and 80 for HTTP, only when it has been given permission. The install script gives it; a nearhost you build or copy yourself does not have it.
2026-11-25T14:29:57Z   Fix: sudo setcap cap_net_bind_service=+ep '/home/you/go/bin/nearhost'
2026-11-25T14:29:57Z   Then start Nearhost again. Do not run nearhost with sudo.
2026-11-25T14:29:57Z   Run `nearhost doctor` to check this and the rest of what Nearhost needs.
2026-11-25T14:29:57Z   Cause: HTTPS port 443 needs permission to bind: listen tcp :443: bind: permission denied
```

When the core crashes, the log has it as an error with the code `crash`, with the path of a crash file, `crash-<time>.log` beside `core.log`, that holds the details. Attach that file when you report it.

At 5 MiB the log is set aside as `core.log.1`, replacing the older one, and a new `core.log` starts. That happens while the core runs, so the log never grows without bound: the two files together stay near 10 MiB at most.

## Updating

`nearhost update` replaces the binary as it always has, and then restarts the core on the new one, so the update is not left half done. A core that a service started comes back through the service. Any other core comes back started by `nearhost -d`, with the same config file, ports and flags as before.

- **Open passthroughs and forwards close for a moment.** When there are any, it asks first, as `Restart Nearhost now to run <version>? This closes 2 passthroughs for a moment. [Y/n]`. `--yes` restarts without asking. Without a terminal, or when you answer no, it leaves the core as it is, and says `Note: Nearhost in the background still runs <old>.`, with the commands to restart it when you are ready. With nothing to close it restarts at once, and prints `Restarted Nearhost (pid <pid>); it now runs <version>.`
- **A core started by the interface closes the interface.** The open `nearhost` window ends, and you open it again.
- **A core in a terminal is yours to restart,** with Ctrl-C and then the command you started it with.
- **A service that runs another copy** of nearhost than the one you updated is left running. Run `nearhost service install` from the copy you use to bring the service across.
- **On Linux,** when the update drops the binary's permission to bind ports 80 and 443, it prints the `setcap` command first and leaves the core running until you have run it.

The core also looks for a new release once a day, and says so in the log, the interface, `nearhost status` and the page. `NEARHOST_NO_UPDATE_CHECK=1` turns that off.

## What doctor says

[`nearhost doctor`](https://nearhost.dev/pr-preview/pr-127/docs/reference/cli.md#nearhost-doctor) asks the running core what it can reach from where it runs, which can differ from what your shell can reach.

| Line              | What it tells you                                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| `core`            | Whether a core is running, its version and what started it. A core of another release than your `nearhost` warns. |
| `core: browser`   | Whether the core can open links. A warning means it runs outside your desktop session.                            |
| `core: ssh agent` | Whether the agent socket the core has answers. It explains servers that will not connect. Not shown on Windows.   |
| `core: docker`    | Whether `docker` is on the core's `PATH` and answers.                                                             |
| `core: ssh`       | Where the core finds `ssh`.                                                                                       |
| `service`         | Whether a service is installed, runs this copy and is running.                                                    |

On a machine with no desktop, such as a server you reach over SSH, `core: browser` warns because there is no display. That is right: there is nothing to open links in.

Each warning has a fix beside it. Most come to running `nearhost service install` again from a shell where the thing works, then `nearhost stop` and `nearhost -d`.

## On Windows

Windows 11 has all of this: `nearhost -d`, `nearhost stop`, `nearhost status` and the logon task. From Nearhost 0.16.0 the Windows binaries are code signed, so it all runs where Smart App Control is on. Windows blocks an earlier, unsigned release there outright, so update first. See [Code signing](https://nearhost.dev/pr-preview/pr-127/docs/getting-started/install.md#code-signing).
