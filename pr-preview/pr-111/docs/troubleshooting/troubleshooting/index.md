# Troubleshooting

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-111/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-111/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-111/docs/getting-started/install.md.

Symptoms Nearhost reports and the fix for each.

Every failure attaches to the thing that failed, with why it happened and how to fix it. A failure in one project or server never affects another. Home lists what needs you under problems. `nearhost doctor` checks most of the causes below at once.

## Port 443 or 80 already in use

The proxy does not start. Home shows `proxy down`, names the port and, where it can, the program holding it.

Quit that program, or run Nearhost with `--https-port` and `--http-port`. Another local proxy is the usual cause: nginx, Caddy, Herd or Valet. On Linux, also check that the binary may bind low ports. See [Install](https://nearhost.dev/pr-preview/pr-111/docs/getting-started/install.md).

If Home says the port needs permission to bind, nothing holds it, but this user may not use it. On Linux, the fix under it is the `setcap` command for the binary, as in [Allow binding ports 80 and 443](https://nearhost.dev/pr-preview/pr-111/docs/getting-started/install.md#allow-binding-ports-80-and-443); run it, then start Nearhost again. For an npm install, use the command `nearhost doctor` prints, which names the real binary. From Nearhost 0.8.0.

On Windows, a port held by `System (pid 4)` is held by HTTP.sys on behalf of a Windows service, often IIS, so there is no program to quit. To see which service registered it, run this in a terminal opened as administrator:

```powershell
netsh http show servicestate
```

Stop that service, for IIS with `net stop w3svc`, or run Nearhost with `--http-port` and `--https-port`.

## Port 6327 already in use

Nearhost starts, serves every project and leaves out Nearhost's page, and the log says `port 6327 is in use; serving without Nearhost's page`. `nearhost doctor` warns about it. Another Nearhost already running is the usual cause. Otherwise pass `--web-port` with a free port, or `--web-port 0` to turn off the page's own port, leaving it at `https://localhost`. From Nearhost 0.8.0.

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

## The password was cancelled

When the hosts block needs a project's alias, Nearhost asks for your password in a box. If you cancel it, or get it wrong three times, the project stays `stopped`, its alias is not added to `/etc/hosts`, and Home's `hosts` row shows it as missing.

On Windows, choosing No in the User Account Control prompt does the same.

Press `enter` on the project to try again. Or add the alias to `/etc/hosts` yourself and run Nearhost with `--no-hosts`. See [The hosts file](https://nearhost.dev/pr-preview/pr-111/docs/concepts/the-hosts-file.md).

## Too many password prompts

`sudo` remembers your password for a few minutes, so Nearhost usually asks once for several changes. If it asks in the terminal instead of the box, `sudo` is set to ask every time.

On a Mac you can use Touch ID instead of typing it. See [First run](https://nearhost.dev/pr-preview/pr-111/docs/getting-started/first-run.md#touch-id-on-a-mac).

On Windows, every change to the hosts file shows a User Account Control prompt, because Windows does not remember the approval. Changes happen only when a project starts and its names are missing, so most starts ask for nothing.

## No root-owned sudo

`nearhost trust`, `nearhost untrust` and changes to `/etc/hosts` stop with `no root-owned sudo in /usr/bin, /bin, /usr/local/bin or /run/wrappers/bin`. From Nearhost 0.8.0, Nearhost runs only a `sudo` in one of those folders that root owns, so a `sudo` elsewhere on your `PATH` is never handed your password. Install sudo there, or run the command as root.

## The CA is not trusted

The proxy still runs, but browsers warn about the certificate. Home shows `local CA ● not trusted. Run nearhost trust`. Run:

```sh
nearhost trust
```

Firefox, and Chromium-based browsers on Linux, need `certutil` too. See [Install](https://nearhost.dev/pr-preview/pr-111/docs/getting-started/install.md). The CA's expiry date turns amber 30 days before it runs out.

## Doctor warns about an old CA copy or a hosts block without IPv6

Both come from an upgrade, and both are warnings, not failures.

`old CA copy` means `~/.config/nearhost/caddy` (or `$XDG_CONFIG_HOME/nearhost/caddy`), where Nearhost 0.7 and earlier kept the local CA, is still there beside the new folder in Nearhost's data folder. It holds a copy of the CA's private key. Check that `nearhost doctor` shows the CA as trusted, then delete the old folder. See [The local CA](https://nearhost.dev/pr-preview/pr-111/docs/concepts/tls-and-the-proxy.md#the-local-ca).

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

On Windows, a key with a passphrase needs the ssh-agent service running, and Windows installs it disabled. `nearhost doctor` shows its state. See [OpenSSH](https://nearhost.dev/pr-preview/pr-111/docs/getting-started/install.md#openssh) to start it. If the server is reached through a `ProxyJump` host named by an alias, Windows 11's OpenSSH 9.5 does not resolve the alias: give `ProxyJump` the jump host's address instead.

## A server's ssh configuration sets a forward

On Windows only, Nearhost stops trying to connect to the server, which shows `auth failed` with a message such as `mini's ssh configuration sets localforward, which Nearhost can't keep out of its own connections on this system`. The `Host` entry Nearhost uses for that server sets `LocalForward`, `RemoteForward`, `DynamicForward`, `ForkAfterAuthentication yes` or `ClearAllForwardings yes`. Move those lines to a `Host` entry Nearhost does not use, then press `r` on the server. See [SSH transport](https://nearhost.dev/pr-preview/pr-111/docs/concepts/ssh-transport.md#on-windows).

## Agents unavailable on a server

The server's sshd refuses the socket coding agents reach Nearhost on, usually because `sshd_config` sets `AllowStreamLocalForwarding no`. Set it to `yes`, reload sshd and press `r` on the server. `nearhost doctor` shows the same check. See [When agents cannot reach Nearhost](https://nearhost.dev/pr-preview/pr-111/docs/coding-agents/troubleshooting.md).

## Agents on a server cannot reach a Windows laptop

The skill on the server says `this request has no valid Nearhost token: update the Nearhost skill on this machine`. A Windows laptop answers only requests that carry a token, which the skill sends with curl. The server needs curl 7.55 or later and a skill installed since Windows support. Run `npx skills add nearhost/nearhost -g` again on the server or, if you installed it as a Claude Code plugin, update the plugin from `/plugin`. See [Windows laptops](https://nearhost.dev/pr-preview/pr-111/docs/coding-agents/how-it-works.md#windows-laptops).

## A server shows dropped

You pressed `c` on it, which holds its connection closed. Its projects wait. Press `c` again to connect it.

## Discovery found nothing

The routes step says no ports were found and asks for the web port. Enter it, or from the command line use `nearhost add --web <port>`. If the project uses Compose, Vite or Laravel Sail, trust the official presets so discovery can read them. See [Discovery](https://nearhost.dev/pr-preview/pr-111/docs/concepts/discovery.md).

## Config file invalid

Nearhost exits naming the file and the problem, with the line for a YAML error. Fix it in `~/.config/nearhost/config.yaml`, or `%APPDATA%\nearhost\config.yaml` on Windows. `nearhost doctor` reports the same without exiting. See [config.yaml](https://nearhost.dev/pr-preview/pr-111/docs/reference/config.md).

## Windows stops nearhost.exe from starting

Microsoft Defender SmartScreen may stop it the first time it runs, because the binary is not code signed. Choose More info, then Run anyway.

If Smart App Control is on, Windows can block `nearhost.exe` outright, with no Run anyway, because the binary is not code signed. Nearhost cannot run on that machine until its Windows binaries are signed. See [SmartScreen](https://nearhost.dev/pr-preview/pr-111/docs/getting-started/install.md#smartscreen).

## The nearhost command is not found on Windows

The PowerShell installer adds its folder to your user `PATH`, and a terminal that was already open keeps its old `PATH`. Open a new terminal. If it is still not found, check that `%LOCALAPPDATA%\Programs\nearhost`, or the folder you installed into, is in your user `PATH`.
