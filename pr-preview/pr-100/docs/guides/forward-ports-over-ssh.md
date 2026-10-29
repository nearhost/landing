# Forward several ports over SSH without retyping -L

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-100/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-100/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-100/docs/getting-started/install.md.

Ways to reach a remote app, its asset server and its other ports from your laptop over SSH, from stacked -L flags to forwards added to a running connection, and what each leaves for you to do.

A web project on a remote machine rarely uses one port. There is the app, the asset dev server, perhaps a mail catcher or a queue dashboard, and the next project wants the same set again. Typing one `-L` flag per port works until the connection drops, a port changes, or a second project needs a port the first one already holds.

## Stack the flags on one connection

One `ssh` command takes as many `-L` flags as you need. `-N` keeps it to forwarding, with no remote shell:

```sh
ssh -N -L 8000:localhost:8000 -L 5173:localhost:5173 -L 8025:localhost:8025 myserver
```

Each flag reads `local port:host:remote port`, and the host is resolved on the server, so `localhost` means the server itself. Your laptop listens on loopback only, unless you set `GatewayPorts`.

## Put them in your SSH config

`LocalForward` lines in `~/.ssh/config` set the same forwards whenever you connect:

```
Host myserver
  LocalForward 8000 localhost:8000
  LocalForward 5173 localhost:5173
  LocalForward 8025 localhost:8025
  ExitOnForwardFailure yes
  ServerAliveInterval 15
```

`ExitOnForwardFailure` makes `ssh` stop when a port is taken on your laptop, rather than connect without that forward. `ServerAliveInterval` makes a dead connection end, after about 45 seconds with the default `ServerAliveCountMax` of 3, instead of hanging. The catch: every interactive `ssh myserver` now tries the same ports, and the second one fails while the first is open. A separate `Host` alias just for the forwards avoids that.

## Add forwards to a running connection

With connection sharing, one master connection carries every session to a server, and `ssh -O` changes its forwards while it runs:

```
Host myserver
  ControlMaster auto
  ControlPath ~/.ssh/cm-%C
  ControlPersist 10m
```

```sh
ssh -O forward -L 5173:localhost:5173 myserver   # add a forward
ssh -O cancel -L 5173:localhost:5173 myserver    # remove it
```

No reconnect, and no restart of the forwards already open. Nothing re-adds them if the master exits, though.

## Use one SOCKS proxy instead

`ssh -N -D 1080 myserver` opens a SOCKS proxy, and a browser set to use it reaches every port on the server's network. But Chrome and Firefox send `localhost` straight to your own machine, never through the proxy, so a dev server that listens only on the server's loopback stays out of reach. It also proxies every site the browser opens, unless you set it per profile.

## What every plain-SSH option leaves to you

- **Reconnecting.** When the connection drops, the forwards go with it. `autossh` or a shell loop brings back a fixed set.
- **Port clashes.** Two projects that both use 5173 cannot both forward it to 5173 on your laptop. Change one project's port, or forward it to another local port where the page does not hard-code it.
- **The address.** Each app is `http://localhost:<port>`. Cookies ignore the port, so every project shares one cookie jar and signing in to one can sign you out of another, and an OAuth callback or cookie domain set up for a real name does not match. See [HTTPS on a local dev domain](https://nearhost.dev/pr-preview/pr-100/docs/guides/https-on-a-local-dev-domain.md).

## How Nearhost does it

New to Nearhost? [Install it](https://nearhost.dev/pr-preview/pr-100/docs/getting-started/install.md) and [add a server](https://nearhost.dev/pr-preview/pr-100/docs/getting-started/add-a-server.md) first.

Nearhost uses the same OpenSSH mechanism as above: one supervised master per server, with forwards added and cancelled with `-O forward` and `-O cancel` as projects start and stop. On top of that:

- **It finds the ports.** It reads them from the project's `.env`, and presets add Docker Compose, Vite and Laravel Sail. You choose which port is the web app, which need the same port on your laptop, and which to ignore.
- **It reconnects.** If the master exits, Nearhost starts it again with backoff and puts every forward back before the server shows as connected.
- **It warns about clashes** before they happen, and suggests a free port when the port comes from a variable.
- **It gives each project a name.** The web port is served at a trusted `https://myapp.test`, so you stop tracking which port is which project.

See [SSH transport](https://nearhost.dev/pr-preview/pr-100/docs/concepts/ssh-transport.md) for the exact commands it runs, and [Routes and roles](https://nearhost.dev/pr-preview/pr-100/docs/concepts/routes-and-roles.md) for how ports become routes.

> **Checked against:** These, on 2026-10-20:
>
> - [OpenSSH: ssh(1)](https://man.openbsd.org/ssh), for `-L`, `-N`, `-D` and `-O`
> - [OpenSSH: ssh_config(5)](https://man.openbsd.org/ssh_config), for `LocalForward`, `GatewayPorts`, `ExitOnForwardFailure`, `ServerAliveInterval` and the `Control*` options
> - [Chromium: proxy support](https://chromium.googlesource.com/chromium/src/+/HEAD/net/docs/proxy.md), for the implicit `localhost` bypass
>
> If something here no longer matches, please [open an issue](https://github.com/nearhost/landing/issues).
