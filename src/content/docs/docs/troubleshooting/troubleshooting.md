---
title: Troubleshooting
description: Symptoms Nearhost reports and the fix for each.
sidebar:
  order: 1
---

Every failure attaches to the thing that failed, with why it happened and how to fix it. A failure in one project or server never affects another. Home lists what needs you under problems. `nearhost doctor` checks most of the causes below at once.

## Port 443 or 80 already in use

The proxy does not start. Home shows `proxy down`, names the port and, where it can, the program holding it.

Quit that program, or run Nearhost with `--https-port` and `--http-port`. If the holder is `nearhost`, another Nearhost is running: stop it rather than moving ports. Another local proxy is the usual cause: nginx, Caddy, Herd or Valet. On Linux, also check that the binary may bind low ports. See [Install](/docs/getting-started/install/).

If Home says the port needs permission to bind, nothing holds it, but this user may not use it. On Linux, the fix under it is the `setcap` command for the binary, as in [Allow binding ports 80 and 443](/docs/getting-started/install/#allow-binding-ports-80-and-443); run it, then start Nearhost again. For an npm install, use the command `nearhost doctor` prints, which names the real binary. From Nearhost 0.8.0. `nearhost up` prints the same command under the error, followed by `Do not run nearhost with sudo.`

`nearhost doctor` run while Nearhost serves shows the ports Nearhost holds as `in use by the running Nearhost`, which passes. If no tool can name what holds a port while Nearhost runs, the check warns and suggests a command to find it.

On Windows, a port held by `System (pid 4)` is held by HTTP.sys on behalf of a Windows service, often IIS, so there is no program to quit. To see which service registered it, run this in a terminal opened as administrator:

```powershell
netsh http show servicestate
```

Stop that service, for IIS with `net stop w3svc`, or run Nearhost with `--http-port` and `--https-port`.

## Another Nearhost is already running

Nearhost stops at start with:

```text
Another Nearhost is already running (pid N). Stop it first.
```

Two Nearhosts would end each other's ssh connections, so only one runs at a time, whatever `--config` file each is given. The pid is left out when it is not known. Stop the other one, which may be an interface in another terminal or a `nearhost up` under a service manager, then start Nearhost again.

## nearhost up stops with nothing to serve

`nearhost up` prints its summary, then `Nothing can be served, so nearhost up is stopping.`, and exits 1. Every project failed to start, and none is waiting on a server that is still connecting. The summary names each project's error. Fix those, then start `up` again. It stops the same way when every change to the hosts block is refused.

## Nearhost without a terminal

Bare `nearhost` prints `nearhost needs a terminal for its interface. Use nearhost up to serve without one.` and exits 1. It was started from a service, a cron job, a script or a pipe, where there is no terminal for the interface. Run `nearhost up` there instead. On Windows the message adds `In Git Bash, run it through winpty or use Windows Terminal.`

`nearhost up` without a terminal cannot ask for your password. When the hosts block needs to change, it skips the change and prints, once:

```text
The hosts file needs sudo, and there is no terminal to ask in. Run nearhost up in a terminal once, or pass --no-hosts.
```

Run `nearhost up` once at a terminal so it can update the block, or add the names to the hosts file yourself and run with `--no-hosts`. Do not give Nearhost a passwordless `sudo` rule instead: its binary is usually writable by you, so the rule would give your account root.

`nearhost add` without a terminal cannot ask you to approve anything, so it adds nothing when the project asks for approval. `nearhost untrust --delete-key` refuses without a terminal unless you also pass `--yes`.

## Port 6327 already in use

Nearhost starts, serves every project and leaves out Nearhost's page, and the log says `port 6327 is in use; serving without Nearhost's page`. `nearhost doctor` warns about it. Another program holding the port is the usual cause. If it is another Nearhost, see [Another Nearhost is already running](#another-nearhost-is-already-running) and stop it. Otherwise pass `--web-port` with a free port, or `--web-port 0` to turn the page off. From Nearhost 0.8.0.

Without the page, an agent that asks to show a document is told `Nearhost's page isn't served: port 6327 wasn't available when Nearhost started`.

## nearhost.localhost does not resolve

Safari cannot find the server at `https://nearhost.localhost:6327`, or a command-line tool cannot resolve the name. Chrome and Firefox resolve `nearhost.localhost` themselves. Safari and those tools ask the system, which reads the hosts file, and the line for `nearhost.localhost` is not there yet.

Nearhost adds the line each time it writes [its block](/docs/concepts/the-hosts-file/), and does not ask for your password for that line alone. So the line is missing until a project's start next changes the block. With `--no-hosts`, or with no projects, Nearhost writes no block.

Until then, open `https://localhost:6327`. It shows the page without the document list. A document link works there too, with `localhost` in place of `nearhost.localhost`. To have the name now, add these lines to the hosts file yourself, outside Nearhost's block:

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

Press `enter` on the project to try again. Or add the alias to `/etc/hosts` yourself and run Nearhost with `--no-hosts`. See [The hosts file](/docs/concepts/the-hosts-file/).

## The hosts file is read-only

On Windows, a hosts file with the read-only attribute stops the change after the User Account Control prompt, and nothing changes on disk:

```text
<path> is read-only. Clear it with: attrib -r "<path>" (in an administrator terminal), or run with --no-hosts.
```

Nearhost does not clear the attribute itself, since a read-only hosts file is often set on purpose. Run the `attrib` command in Windows Terminal opened as administrator, or add the names yourself and run Nearhost with `--no-hosts`. A read-only file whose block is already up to date needs no change, so it causes no error.

## Too many password prompts

`sudo` remembers your password for a few minutes, so Nearhost usually asks once for several changes. If it asks in the terminal instead of the box, `sudo` is set to ask every time.

On a Mac you can use Touch ID instead of typing it. See [First run](/docs/getting-started/first-run/#touch-id-on-a-mac).

On Windows, every change to the hosts file shows a User Account Control prompt, because Windows does not remember the approval. Changes happen only when a project starts and its names are missing, so most starts ask for nothing.

## No root-owned sudo

`nearhost trust`, `nearhost untrust` and changes to `/etc/hosts` stop with `no root-owned sudo in /usr/bin, /bin, /usr/local/bin or /run/wrappers/bin`. From Nearhost 0.8.0, Nearhost runs only a `sudo` in one of those folders that root owns, so a `sudo` elsewhere on your `PATH` is never handed your password. Install sudo there, or run the command as root.

## The CA is not trusted

The proxy still runs, but browsers warn about the certificate. Home shows `local CA ● not trusted. Run nearhost trust`. Run:

```sh
nearhost trust
```

Firefox, and Chromium-based browsers on Linux, need `certutil` too. See [Install](/docs/getting-started/install/). The CA's expiry date turns amber 30 days before it runs out.

## Doctor warns about an old CA copy or a hosts block without IPv6

Both come from an upgrade, and both are warnings, not failures.

`old CA copy` means `~/.config/nearhost/caddy` (or `$XDG_CONFIG_HOME/nearhost/caddy`), where Nearhost 0.7 and earlier kept the local CA, is still there beside the new folder in Nearhost's data folder. It holds a copy of the CA's private key. Check that `nearhost doctor` shows the CA as trusted, then delete the old folder. See [The local CA](/docs/concepts/tls-and-the-proxy/#the-local-ca).

`hosts block` saying the block has no IPv6 (`::1`) entries means an older Nearhost wrote it. Run `nearhost up`, which rewrites the block with the `::1` lines and asks for your password.

## SSH keeps reconnecting

The server shows `reconnecting · attempt N · next in Ns`, and its projects show `degraded`. Caddy returns 502 meanwhile. Nearhost keeps trying by itself.

If it keeps failing, read the error on the server, then run `ssh <host>` in a terminal. When that connects, press `r` to reconnect now.

## Authentication failed

After three errors in a row that retrying cannot fix, such as `Permission denied` or a changed host key, Nearhost stops trying. The server shows `auth failed`, with the fix:

```sh
ssh <host>
```

Run it in a terminal and handle the host key, passphrase or `ssh-add` prompt. Then press `r`. On Home, `y` copies the command.

On Windows, a key with a passphrase needs the ssh-agent service running, and Windows installs it disabled. `nearhost doctor` shows its state. See [OpenSSH](/docs/getting-started/install/#openssh) to start it. If the server is reached through a `ProxyJump` host named by an alias, Windows 11's OpenSSH 9.5 does not resolve the alias: give `ProxyJump` the jump host's address instead.

## Doctor warns about the ssh vendor

On Windows only, `nearhost doctor` shows `ssh vendor` as `warn`, with the path of the `ssh` it found. That `ssh` is not Microsoft's OpenSSH in `%SystemRoot%\System32\OpenSSH` or `%ProgramFiles%\OpenSSH`. It is often Git for Windows' ssh, which reads another config and agent, so forwards can fail in confusing ways. Put `%SystemRoot%\System32\OpenSSH` first on your `PATH`, then open a new terminal. The warning does not change doctor's exit status.

## A server's ssh configuration sets a forward

On Windows only, Nearhost stops trying to connect to the server, which shows `auth failed` with a message such as `mini's ssh configuration sets localforward, which Nearhost can't keep out of its own connections on this system`. The `Host` entry Nearhost uses for that server sets `LocalForward`, `RemoteForward`, `DynamicForward`, `ForkAfterAuthentication yes` or `ClearAllForwardings yes`. Move those lines to a `Host` entry Nearhost does not use, then press `r` on the server. See [SSH transport](/docs/concepts/ssh-transport/#on-windows).

## Agents unavailable on a server

The server's sshd refuses the socket coding agents reach Nearhost on, usually because `sshd_config` sets `AllowStreamLocalForwarding no`. Set it to `yes`, reload sshd and press `r` on the server. `nearhost doctor` shows the same check. See [When agents cannot reach Nearhost](/docs/coding-agents/troubleshooting/).

## Agents on a server cannot reach a Windows laptop

The skill on the server says `this request has no valid Nearhost token: update the Nearhost skill on this machine`. A Windows laptop answers only requests that carry a token, which the skill sends with curl. The server needs curl 7.55 or later and a skill installed since Windows support. Run `npx skills add nearhost/nearhost -g` again on the server or, if you installed it as a Claude Code plugin, update the plugin from `/plugin`. See [Windows laptops](/docs/coding-agents/how-it-works/#windows-laptops).

## A server shows dropped

You pressed `c` on it, which holds its connection closed. Its projects wait. Press `c` again to connect it.

## Discovery found nothing

The routes step says no ports were found and asks for the web port. Enter it, or from the command line use `nearhost add --web <port>`. If the project uses Compose, Vite or Laravel Sail, trust the official presets so discovery can read them. See [Discovery](/docs/concepts/discovery/).

## Config file invalid

Nearhost exits naming the file and the problem, with the line for a YAML error. Fix it in `~/.config/nearhost/config.yaml`, or `%APPDATA%\nearhost\config.yaml` on Windows. `nearhost doctor` reports the same without exiting. See [config.yaml](/docs/reference/config/).

## Windows stops nearhost.exe from starting

Microsoft Defender SmartScreen may stop it the first time it runs, because the binary is not code signed. Choose More info, then Run anyway.

If Smart App Control is on, Windows can block `nearhost.exe` outright, with no Run anyway, because the binary is not code signed. Nearhost cannot run on that machine until its Windows binaries are signed. See [SmartScreen](/docs/getting-started/install/#smartscreen).

## An update ran but the version did not change

`nearhost update` prints `The update ran, but <path> is still <old>. Run it again, or install by hand: <command>.` and exits 1. The update command succeeded, but the copy your next command runs, at `<path>`, did not start, printed no version, or is still the old version. Run the command it prints, then check with `nearhost --version`.

## The nearhost command is not found on Windows

The PowerShell installer adds its folder to your user `PATH`, and a terminal that was already open keeps its old `PATH`. Open a new terminal. If it is still not found, check that `%LOCALAPPDATA%\Programs\nearhost`, or the folder you installed into, is in your user `PATH`.
