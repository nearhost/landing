# Troubleshooting

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-142/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-142/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-142/docs/getting-started/install.md.

Symptoms Nearhost reports and the fix for each.

Every failure attaches to the thing that failed, with why it happened and how to fix it. Each has a code, which `--verbose` shows and the core's log always does: look it up in [Errors](https://nearhost.dev/pr-preview/pr-142/docs/reference/errors.md). A failure in one project or server never affects another. Home lists what needs you under problems. `nearhost doctor` checks most of the causes below at once.

## Port 443 or 80 already in use

The proxy does not start. Home shows `proxy down`, names the port and, where it can, the program holding it.

Quit that program, or run Nearhost with `--https-port` and `--http-port`. If the holder is `nearhost`, another Nearhost is running: stop it rather than moving ports. Another local proxy is the usual cause: nginx, Caddy, Herd or Valet. On Linux, also check that the binary may bind low ports. See [Install](https://nearhost.dev/pr-preview/pr-142/docs/getting-started/install.md).

If Home says the port needs permission to bind, nothing holds it, but this user may not use it. On Linux, the fix under it is the `setcap` command for the binary, as in [Allow binding ports 80 and 443](https://nearhost.dev/pr-preview/pr-142/docs/getting-started/install.md#allow-binding-ports-80-and-443); run it, then start Nearhost again. For an npm install, use the command `nearhost doctor` prints, which names the real binary. From Nearhost 0.8.0. `nearhost up` stops with the same command in its error, as in [nearhost up](https://nearhost.dev/pr-preview/pr-142/docs/reference/cli.md#nearhost-up), and so does the core's log when Nearhost runs in the background.

`nearhost doctor` run while Nearhost serves shows the ports Nearhost holds as `in use by the running Nearhost`, which passes. If no tool can name what holds a port while Nearhost runs, the check warns and suggests a command to find it.

On Windows, a port held by `System (pid 4)` is held by HTTP.sys on behalf of a Windows service, often IIS, so there is no program to quit. To see which service registered it, run this in a terminal opened as administrator:

```powershell
netsh http show servicestate
```

Stop that service, for IIS with `net stop w3svc`, or run Nearhost with `--http-port` and `--https-port`.

## Another Nearhost is already running

`nearhost up` and `nearhost daemon` stop at start with:

```text
Error: Another Nearhost is already running (pid N).

Stop it:

  nearhost stop

Or see what it serves:

  nearhost status
```

`nearhost` opens the interface on the one that runs instead, and `nearhost -d` says it is already running.

Two Nearhosts would end each other's ssh connections, so only one runs at a time, whatever `--config` file each is given. The pid is left out when it is not known. Run `nearhost status` to see what runs and what started it, and `nearhost stop` to stop it, whether it runs in the background, was started by a service, or is a `nearhost up` in another terminal. Then start Nearhost again. A service starts the background Nearhost at login, so after `nearhost stop` it stays stopped until you start it again or log in.

## Nearhost in the background does not start

`nearhost -d` prints `Error: Nearhost stopped while starting.` with the last lines of the core's log, and exits 1. Those lines say why it stopped, often a port in use or a config error. On Linux, a copy of `nearhost` that may not use ports 80 and 443 stops like this:

```text
Error: Nearhost stopped while starting.

The end of /home/you/.config/nearhost/core.log:

  2026-11-25T14:29:57Z nearhost <version> starting (pid 4121, started by detached)
  2026-11-25T14:29:57Z error [port.needs-permission] HTTPS port 443 needs permission to bind.
  2026-11-25T14:29:57Z   On Linux, a program may use ports below 1024, such as 443 for HTTPS and 80 for HTTP, only when it has been given permission. The install script gives it; a nearhost you build or copy yourself does not have it.
  2026-11-25T14:29:57Z   Fix: sudo setcap cap_net_bind_service=+ep '/home/you/go/bin/nearhost'
  2026-11-25T14:29:57Z   Then start Nearhost again. Do not run nearhost with sudo.
  2026-11-25T14:29:57Z   Run `nearhost doctor` to check this and the rest of what Nearhost needs.
  2026-11-25T14:29:57Z   Cause: HTTPS port 443 needs permission to bind: listen tcp :443: bind: permission denied
```

If it prints `Error: Nearhost is still starting.`, it has not answered in 15 seconds and goes on starting: read the log it names. The log is `core.log` in the config folder. See [The core's log](https://nearhost.dev/pr-preview/pr-142/docs/guides/run-in-the-background.md#the-cores-log).

## A service's Nearhost cannot open links, reach ssh or Docker

A service does not run with your shell's environment. `nearhost doctor` shows it as a warning on `core: browser`, `core: ssh agent` or `core: docker`, with the fix beside it, and on `service` when the service's log folder is missing. Most come to running `nearhost service install` again from a shell where the thing works. See [What doctor says](https://nearhost.dev/pr-preview/pr-142/docs/guides/run-in-the-background.md#what-doctor-says).

## A project waits for the hosts file

Nearhost in the background never asks for your password, so a project whose names are missing from `/etc/hosts` stays stopped under `nearhost -d` or a service. `nearhost status` warns `Warning: <project> waits for the hosts file to be updated.` and the log says the hosts file needs updating, both with `nearhost hosts update` to run in a terminal, and `nearhost add` ends with `Warning: The running Nearhost serves the project once the hosts file is up to date.` and the same command.

Run `nearhost hosts update` in a terminal. It updates the block, then tells Nearhost, which starts the project. Opening `nearhost` does the same, asking for the password in its box. See [The hosts file](https://nearhost.dev/pr-preview/pr-142/docs/guides/run-in-the-background.md#the-hosts-file).

## nearhost up stops with nothing to serve

`nearhost up` prints its summary, then `Nothing can be served, so nearhost up is stopping.`, and exits 1. Every project failed to start, and none is waiting on a server that is still connecting. The summary names each project's error. Fix those, then start `up` again. It stops the same way when every change to the hosts block is refused.

## Nearhost without a terminal

Bare `nearhost` prints `Error: The interface needs a terminal, and there is none here.`, with the commands below, and exits 1. It was started from a cron job, a script or a pipe, where there is no terminal for the interface. Run `nearhost -d` there to serve in the background, or `nearhost up` to serve in the foreground. To start Nearhost at login, use `nearhost service install`. On Windows the message adds `In Git Bash, run it through winpty or use Windows Terminal.`

`nearhost up` without a terminal cannot ask for your password. When the hosts block needs to change, it skips the change and prints, once:

```text
Warning: The hosts file needs sudo, and there is no terminal to ask in.

Run it once in a terminal, where sudo can ask for your password:

  nearhost up

Or serve without updating the hosts file:

  nearhost up --no-hosts
```

Run `nearhost up` once at a terminal so it can update the block, or add the names to the hosts file yourself and run with `--no-hosts`. Do not give Nearhost a passwordless `sudo` rule instead: its binary is usually writable by you, so the rule would give your account root.

`nearhost add` without a terminal cannot ask you to approve anything, so it adds nothing when the project asks for approval. `nearhost untrust --delete-key` refuses without a terminal unless you also pass `--yes`.

## Port 6327 already in use

Nearhost starts, serves every project and leaves out Nearhost's page, and the log has the warning `port 6327 is in use; serving without Nearhost's page (pass --web-port to choose another)`. The reason after the port number varies: it may name the program holding the port, or read `needs permission to bind` or `is not available`. `nearhost doctor` warns about it. Another program holding the port is the usual cause. If it is another Nearhost, see [Another Nearhost is already running](#another-nearhost-is-already-running) and stop it. Otherwise pass `--web-port` with a free port, or `--web-port 0` to turn the page off. From Nearhost 0.8.0.

Without the page, an agent that asks to show a document is told `Nearhost's page isn't served: port 6327 wasn't available when Nearhost started`.

## nearhost.localhost does not resolve

A browser or a command-line tool cannot find `https://nearhost.localhost:6327`. Current macOS, Windows 11, Linux with systemd-resolved, Chrome and Firefox resolve `nearhost.localhost` themselves. An older system, or a resolver that does not, needs the name in the hosts file.

Open `https://localhost:6327` instead. It shows the page without the document list. A document link works there too, with `localhost` in place of `nearhost.localhost`.

Nearhost adds the line for `nearhost.localhost` each time it writes [its block](https://nearhost.dev/pr-preview/pr-142/docs/concepts/the-hosts-file.md), and does not ask for your password for that line alone, so the line arrives when a project's start next changes the block. With `--no-hosts`, or with no projects, Nearhost writes no block. Then add these lines to the hosts file yourself, outside Nearhost's block:

```text
127.0.0.1 nearhost.localhost
::1 nearhost.localhost
```

## A loopback port is already bound

The project goes into `error`, naming the port and the program holding it on this machine. Its other routes still start.

Stop that program, or move the project's dev server to another port and edit the route. For Vite that is `server.port` in the Vite config, or `VITE_PORT` under Laravel Sail. Then press `enter` on the project to start it again.

From Nearhost 0.7.0, on a laptop with the IPv6 loopback, a loopback forward answers on `[::1]` as well as `127.0.0.1`, so a program listening on either address holds the port. The usual one is a Vite dev server running on your laptop, which often listens on `::1` alone. To see every program on the port the error names, on both addresses, run this with that port in place of `<port>`:

```sh
lsof -nP -iTCP:<port> -sTCP:LISTEN
```

On Windows, in PowerShell:

```powershell
Get-NetTCPConnection -State Listen -LocalPort <port> | Select-Object LocalAddress, OwningProcess
```

On older versions, such a program could answer the browser in the forward's place, so the page loaded your laptop's scripts instead of the server's. Run `nearhost update` to get the check.

On Windows, a program can bind a port that another already holds. Before each forward, Nearhost checks the port with exclusive use, so a program that holds it on `127.0.0.1` puts the project into `error` as above, rather than sharing the port with the forward.

## The password was cancelled

When the hosts block needs a project's alias, Nearhost asks for your password in a box. If you cancel it, or get it wrong three times, the project stays `stopped`, its alias is not added to `/etc/hosts`, and Home's `hosts` row shows it as missing.

On Windows, choosing No in the User Account Control prompt does the same.

Press `enter` on the project to try again. Or add the alias to `/etc/hosts` yourself and run Nearhost with `--no-hosts`. See [The hosts file](https://nearhost.dev/pr-preview/pr-142/docs/concepts/the-hosts-file.md).

## The hosts file is read-only

On Windows, a hosts file with the read-only attribute stops the change after the User Account Control prompt, and nothing changes on disk:

```text
Error: <path> is read-only.

Clear the read-only attribute in an administrator terminal:

  attrib -r "<path>"

Then start the project again to retry.

Or serve without updating it:

  nearhost --no-hosts
```

Under `nearhost up`, the steps after `attrib` say to start `nearhost up` again, or to run `nearhost up --no-hosts`. For Nearhost in the background, they say to run `nearhost hosts update` from a terminal once the attribute is cleared.

Nearhost does not clear the attribute itself, since a read-only hosts file is often set on purpose. Run the `attrib` command in Windows Terminal opened as administrator, or add the names yourself and run Nearhost with `--no-hosts`. A read-only file whose block is already up to date needs no change, so it causes no error.

## Too many password prompts

`sudo` remembers your password for a few minutes, so Nearhost usually asks once for several changes. If it asks in the terminal instead of the box, `sudo` is set to ask every time.

On a Mac you can use Touch ID instead of typing it. See [First run](https://nearhost.dev/pr-preview/pr-142/docs/getting-started/first-run.md#touch-id-on-a-mac).

On Windows, every change to the hosts file shows a User Account Control prompt, because Windows does not remember the approval. Changes happen only when a project starts and its names are missing, so most starts ask for nothing.

## No root-owned sudo

`nearhost trust`, `nearhost untrust` and changes to `/etc/hosts` stop with `no root-owned sudo in /usr/bin, /bin, /usr/local/bin or /run/wrappers/bin`. From Nearhost 0.8.0, Nearhost runs only a `sudo` in one of those folders that root owns, so a `sudo` elsewhere on your `PATH` is never handed your password. Install sudo there, or run the command as root.

## The CA is not trusted

The proxy still runs, but browsers warn about the certificate. Home shows `local CA ● not trusted. Run nearhost trust`. Run:

```sh
nearhost trust
```

Firefox, and Chromium-based browsers on Linux, need `certutil` too. See [Install](https://nearhost.dev/pr-preview/pr-142/docs/getting-started/install.md). The CA's expiry date turns amber 30 days before it runs out.

## Doctor warns about an old CA copy or a hosts block without IPv6

Both come from an upgrade, and both are warnings, not failures.

`old CA copy` means `~/.config/nearhost/caddy` (or `$XDG_CONFIG_HOME/nearhost/caddy`), where Nearhost 0.7 and earlier kept the local CA, is still there beside the new folder in Nearhost's data folder. It holds a copy of the CA's private key. Check that `nearhost doctor` shows the CA as trusted, then delete the old folder. See [The local CA](https://nearhost.dev/pr-preview/pr-142/docs/concepts/tls-and-the-proxy.md#the-local-ca).

`hosts block` saying the block has no IPv6 (`::1`) entries means an older Nearhost wrote it. Run `nearhost hosts update` in a terminal, which rewrites the block with the `::1` lines and asks for your password.

## SSH keeps reconnecting

The server shows `reconnecting · attempt N · next in Ns`, and its projects show `degraded`. Caddy returns 502 meanwhile. Nearhost keeps trying by itself.

If it keeps failing, read the error on the server, then run `ssh <host>` in a terminal. When that connects, press `r` to reconnect now.

## Authentication failed

After three errors in a row that retrying cannot fix, such as `Permission denied` or a changed host key, Nearhost stops trying. The server shows `auth failed`, with the fix:

```sh
ssh <host>
```

Run it in a terminal and handle the host key, passphrase or `ssh-add` prompt. Then press `r`. On Home, `y` copies the command.

On Windows, a key with a passphrase needs the ssh-agent service running, and Windows installs it disabled. `nearhost doctor` shows its state. See [OpenSSH](https://nearhost.dev/pr-preview/pr-142/docs/getting-started/install.md#openssh) to start it. If the server is reached through a `ProxyJump` host named by an alias, Windows 11's OpenSSH 9.5 does not resolve the alias: give `ProxyJump` the jump host's address instead.

## Doctor warns about the ssh vendor

On Windows only, `nearhost doctor` shows `ssh vendor` as `warn`, with the path of the `ssh` it found. That `ssh` is not Microsoft's OpenSSH in `%SystemRoot%\System32\OpenSSH` or `%ProgramFiles%\OpenSSH`. It is often Git for Windows' ssh, which reads another config and agent, so forwards can fail in confusing ways. Put `%SystemRoot%\System32\OpenSSH` first on your `PATH`, then open a new terminal. The warning does not change doctor's exit status.

## A server's ssh configuration sets a forward

On Windows only, Nearhost stops trying to connect to the server, which shows `auth failed` with a message such as `mini's ssh configuration sets localforward, which Nearhost can't keep out of its own connections on this system`. The `Host` entry Nearhost uses for that server sets `LocalForward`, `RemoteForward`, `DynamicForward`, `ForkAfterAuthentication yes` or `ClearAllForwardings yes`. Move those lines to a `Host` entry Nearhost does not use, then press `r` on the server. See [SSH transport](https://nearhost.dev/pr-preview/pr-142/docs/concepts/ssh-transport.md#on-windows).

## Agents unavailable on a server

The server's sshd refuses the socket coding agents reach Nearhost on, usually because `sshd_config` sets `AllowStreamLocalForwarding no`. Set it to `yes`, reload sshd and press `r` on the server. `nearhost doctor` shows the same check. See [When agents cannot reach Nearhost](https://nearhost.dev/pr-preview/pr-142/docs/coding-agents/troubleshooting.md).

## Agents on a server cannot reach a Windows laptop

The skill on the server says `this request has no valid Nearhost token: update the Nearhost skill on this machine`. A Windows laptop answers only requests that carry a token, which the skill sends with curl. The server needs curl 7.55 or later and a skill installed since Windows support. Run `npx skills add nearhost/nearhost -g` again on the server or, if you installed it as a Claude Code plugin, update the plugin from `/plugin`. See [Windows laptops](https://nearhost.dev/pr-preview/pr-142/docs/coding-agents/how-it-works.md#windows-laptops).

## The control socket path is too long for ssh

A project on a server goes into `error` with `control socket path <path> is too long for ssh: it is N bytes and at most M bytes fit; the run directory <dir> is too long, set a shorter XDG_CONFIG_HOME`. ssh's control socket lives in the `run` folder beside the config, and a long home or config path leaves no room for it. Set `XDG_CONFIG_HOME` to a shorter path, move the `nearhost` folder that holds your config there, then start Nearhost again.

## A server shows dropped

You pressed `c` on it, which holds its connection closed. Its projects wait. Press `c` again to connect it.

## Discovery found nothing

The routes step says no ports were found and asks for the web port. Enter it, or from the command line use `nearhost add --web <port>`. If the project uses Compose, Vite or Laravel Sail, trust the official presets so discovery can read them. See [Discovery](https://nearhost.dev/pr-preview/pr-142/docs/concepts/discovery.md).

## Config file invalid

Nearhost does not start, and names the file and the problem, with the line for a YAML error. Under `nearhost -d` it shows as `Error: Nearhost stopped while starting.` with the end of the core's log. A Nearhost already running keeps serving the last good config and says so in its log. Fix it in `~/.config/nearhost/config.yaml`, or `%APPDATA%\nearhost\config.yaml` on Windows. `nearhost doctor` reports the same without exiting. See [config.yaml](https://nearhost.dev/pr-preview/pr-142/docs/reference/config.md).

## Windows stops nearhost.exe from starting

Releases before 0.16.0 are not code signed. Where Smart App Control is on, Windows blocks them outright, with no Run anyway. Elsewhere, SmartScreen may stop one downloaded in a browser the first time it runs: choose More info, then Run anyway. Updating to 0.16.0 or later, which is signed, fixes both.

A signed copy from a zip downloaded in a browser can still meet SmartScreen on its first run while the certificate builds a reputation. It names ECS Software Consulting Ltd. as the publisher: choose More info, then Run anyway. If Windows blocks a copy that should be signed, check its signature as [Code signing](https://nearhost.dev/pr-preview/pr-142/docs/getting-started/install.md#code-signing) shows. A copy whose status is not `Valid` is not one Nearhost published.

## An update ran but the version did not change

`nearhost update` prints `Error: The update ran, but <path> is still <old>.`, with the command to install by hand, and exits 1. The update command succeeded, but the copy your next command runs, at `<path>`, did not start, printed no version, or is still the old version. Run the command it prints, then check with `nearhost --version`.

## The nearhost command is not found on Windows

The PowerShell installer adds its folder to your user `PATH`, and a terminal that was already open keeps its old `PATH`. Open a new terminal. If it is still not found, check that `%LOCALAPPDATA%\Programs\nearhost`, or the folder you installed into, is in your user `PATH`.
