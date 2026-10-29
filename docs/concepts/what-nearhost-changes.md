# What Nearhost changes on your machine

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/docs/getting-started/install/ becomes https://nearhost.dev/docs/getting-started/install.md.

Every file, privilege, port and network request Nearhost uses on your laptop and your servers, and how to undo each one.

Nearhost asks for your password, trusts a certificate authority and edits `/etc/hosts`, so you should know exactly what it does. This page lists all of it, on your laptop and on your servers, and how to undo each part. The other concept pages explain the reasons; this one is the inventory.

## Files on your laptop

| Path                                                                                                | What it holds                                                                                                                                       |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `~/.config/nearhost/`                                                                               | `config.yaml` with your servers and projects, a lock file, an install id, presets you enabled, cached registry indexes, and `run/` with SSH sockets |
| `~/Library/Application Support/nearhost/caddy` (macOS)<br />`~/.local/share/nearhost/caddy` (Linux) | The local certificate authority, its private key and the certificates it signed, readable only by you                                               |
| `~/.cache/nearhost/update.json`                                                                     | When Nearhost last checked for a new release                                                                                                        |
| `~/.nearhost/`                                                                                      | The socket coding agents on this machine use, readable only by you                                                                                  |

An absolute `XDG_CONFIG_HOME`, `XDG_DATA_HOME` or `XDG_CACHE_HOME` moves the first three. The install id is six random characters plus a hash of the machine id. It never leaves your machine.

Nearhost writes no log files. Its log is shown in the interface, or printed by `nearhost up`. Nearhost writes nothing to your projects unless you run `nearhost export`, which writes a `.nearhostrc`. A coding agent edits files itself, not through Nearhost.

## What runs as root

Nearhost never runs as root itself. It uses `sudo` for two things, and from Nearhost 0.8.0 only the `sudo` in a system directory, such as `/usr/bin`, never one found on your `PATH`.

- **The hosts file.** When a project starts and the [block Nearhost owns](https://nearhost.dev/docs/concepts/the-hosts-file.md) in `/etc/hosts` is not what it should be, Nearhost runs its own binary as root, `sudo nearhost hosts apply --file /etc/hosts`, which rewrites that block and nothing else. If `sudo` still holds your password from the last few minutes, this happens without asking again. `--no-hosts` turns it off.
- **Trusting the certificate authority.** Only when you run `nearhost trust` or accept the welcome box. On macOS it adds the root certificate to the System keychain with `security add-trusted-cert`. On Linux it copies the certificate into your distribution's anchors folder and runs `update-ca-certificates`, `update-ca-trust` or `trust extract-compat`. When `certutil` is installed, it also updates the stores that Firefox and, on Linux, Chromium-based browsers keep for themselves, as you, with no password.

On Linux, binding ports 80 and 443 needs `cap_net_bind_service`. Nearhost itself never sets it. The install script offers to run `sudo setcap` when you run a downloaded copy from a terminal, and asks first. Through `curl | sh`, or `nearhost update`, it only prints the command, as `nearhost doctor` does.

## The certificate authority

Nearhost creates its certificate authority on your machine the first time it starts: an ECDSA P-256 root, valid for ten years, with an intermediate that renews every week. Certificates for your names last 12 hours and renew automatically. Nearhost issues them only for names you serve.

Nothing limits the root to `.test`, the same as mkcert's root. Anyone with its private key could make certificates your browser trusts for any domain. The key never leaves the `caddy` folder above, and that folder is readable only by you, but keep it out of dotfiles repositories and shared backups. See [TLS and the proxy](https://nearhost.dev/docs/concepts/tls-and-the-proxy.md).

## Ports on your laptop

While Nearhost runs, it listens on:

- **443** for HTTPS, over TCP and, for HTTP/3, UDP
- **80**, only to redirect to HTTPS
- **6327** for [Nearhost's page](https://nearhost.dev/docs/concepts/tls-and-the-proxy.md)
- one port on `127.0.0.1` per forwarded route, and for a `loopback` route the same port on `::1` too, when the machine has IPv6 loopback

The first three listen on every interface, because macOS lets a program that is not root bind a low port only that way. They answer only this machine: another computer's connection is closed before it gets a certificate or a response. A project with `docker_clients` in its [`.nearhostrc`](https://nearhost.dev/docs/reference/nearhostrc.md) is also answered for your Docker networks. Until Docker first reports them, Nearhost uses Docker's default range, `172.16.0.0/12`, which some home and office networks share.

`--https-port`, `--http-port` and `--web-port` move the ports, and `--web-port 0` turns the page off. When Nearhost quits, all of them close.

## Network requests

Nearhost makes these requests and no others. It has no telemetry, no analytics and no account.

- **SSH to your servers**, through your own `ssh` and `~/.ssh/config`.
- **The update check.** At most once a day, `GET https://api.github.com/repos/nearhost/nearhost/releases/latest`. Set `NEARHOST_NO_UPDATE_CHECK=1` to turn it off.
- **Preset registries.** Only registries you have chosen to trust, from `raw.githubusercontent.com`, when you add a project or manage presets. Each preset is checked against the hash in the registry's index. With no trusted registry, Nearhost requests nothing. See [Presets and registries](https://nearhost.dev/docs/concepts/presets-and-registries.md).
- **DNS.** To decide which names need a hosts entry, Nearhost asks your configured nameserver for names that do not end in `.test`.
- **Docker**, through its local socket, for projects with `docker_clients`.
- **`nearhost update`**, only when you run it. It asks GitHub for the latest release, then runs your package manager or the install script, which download it.

## Requests through the proxy

To show request bodies and send requests again, Nearhost keeps recent requests and responses in memory while it runs: the last thousand or so, bodies up to 64 KiB, 32 MiB in all. They are never written to disk and are gone when Nearhost quits. The log hides `Cookie` and `Authorization` headers. `--no-capture` turns capture off. See [The request log](https://nearhost.dev/docs/concepts/the-request-log.md).

## On your servers

Nearhost installs nothing on a server and opens no ports there. It runs your `ssh`, and through that connection it:

- runs `true` once to check that the connection works
- forwards each route's port to your laptop
- reads files over SFTP: `.env`, `.env.local`, `.nearhostrc`, Compose files and any files an enabled preset names
- creates `~/.nearhost`, readable only by you, with a socket for coding agents on the server

When Nearhost quits, the forwards and the connection close. `~/.nearhost` stays, and may hold a stale socket that the next connection replaces. A `.nearhostrc` written by `nearhost export` stays in the project. See [SSH transport](https://nearhost.dev/docs/concepts/ssh-transport.md).

## What coding agents can do

A coding agent reaches Nearhost through a socket that only your user can open, and sees only the projects of the machine it runs on. Without asking you, it can list those projects, run `nearhost doctor` on a folder, and ask Nearhost to reload a project's `.nearhostrc`. Nearhost applies changes such as ports and new `.test` hosts straight away and saves them to `config.yaml`; the agent never edits that file itself. Anything else, including other domains, wildcards, `localhost` and `docker_clients`, waits for you to approve it. See [How agents reach Nearhost](https://nearhost.dev/docs/coding-agents/how-it-works.md).

## Undo everything

1. Run `nearhost untrust` to stop your system and browsers trusting the certificate authority.
2. Run `nearhost hosts clean` to remove the block from `/etc/hosts`.
3. On Linux, the port capability goes with the binary when you uninstall it. To drop it and keep Nearhost, run `sudo setcap -r` on the binary `nearhost doctor` names.
4. Uninstall Nearhost the way you installed it, such as `brew uninstall nearhost` or `npm uninstall -g @nearhost/cli`.
5. Delete `~/.config/nearhost`, the data folder that holds `caddy`, `~/.cache/nearhost` and `~/.nearhost`.
6. On each server, delete `~/.nearhost`, and any `.nearhostrc` you no longer want.

Run steps 1 and 2 before step 4, while the `nearhost` command still exists.

## Reporting a problem

If you find a way around any of this, report it privately, as the [security policy](https://github.com/nearhost/nearhost/security/policy) explains. Please don't open a public issue.
