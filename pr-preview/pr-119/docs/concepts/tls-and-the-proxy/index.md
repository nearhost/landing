# TLS and the proxy

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-119/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-119/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-119/docs/getting-started/install.md.

How the embedded Caddy proxy and the local certificate authority serve each alias over HTTPS.

Caddy runs inside the Nearhost process, with its storage in Nearhost's data folder, under `nearhost/caddy`: `~/Library/Application Support/nearhost/caddy` on macOS, `~/.local/share/nearhost/caddy` on Linux and `%LOCALAPPDATA%\nearhost\caddy` on Windows, or `$XDG_DATA_HOME/nearhost/caddy` on any of them when that variable is set to an absolute path. It listens on 443 for HTTPS, on 80 only to redirect to HTTPS, with a 307 that browsers do not keep, and on 6327 for Nearhost's page. To use other ports, run Nearhost with `--https-port`, `--http-port` and `--web-port`.

It answers only this machine, and, for a project whose `.nearhostrc` sets `docker_clients`, containers on this machine's Docker networks. A request from another computer, or for a name Nearhost does not serve, has its connection closed with no answer.

While Nearhost runs, even with no projects, `https://nearhost.localhost:6327` shows Nearhost's own page. No project uses that port, and no project may use the name `nearhost.localhost`, so the page is there whatever the projects serve. `https://localhost:6327` shows the page too, without the document list. `localhost` on the HTTPS port belongs to projects: when no project serves it, `https://localhost` gets its connection closed, like any name Nearhost does not serve. `--web-port` moves the port, and `--web-port 0` turns the page off. If the page's port is taken, Nearhost starts without the page and says so, and `nearhost doctor` warns. Pass `--web-port` to choose another port. A taken HTTPS or HTTP port is different: Nearhost does not start the proxy. The page needs Nearhost 0.8.0 or later.

The page's port listens on the loopback addresses, `127.0.0.1` and `::1`, on every system, so another machine's connection to it is refused before anything is read. One exception: on macOS, a page port below 1024, given with `--web-port` while Nearhost is not root, listens on every address, because macOS lets such a program bind a low port only that way. The page still answers only this machine.

Current macOS, Windows 11, Linux with systemd-resolved, Chrome and Firefox resolve `nearhost.localhost` to this machine themselves. For older systems and resolvers that do not, Nearhost adds `nearhost.localhost` to [its block](https://nearhost.dev/pr-preview/pr-119/docs/concepts/the-hosts-file.md) each time it writes the block. It does not ask for your password for that line alone. If the name does not resolve, use `https://localhost:6327`. See [nearhost.localhost does not resolve](https://nearhost.dev/pr-preview/pr-119/docs/troubleshooting/troubleshooting.md#nearhostlocalhost-does-not-resolve).

The page lists the documents agents have shown only to a browser that holds its cookie, `__Host-nearhost`. The interface opens the page with a link that sets the cookie, and opening any document link sets it too, so the list appears in a browser that opened a document link, or opened the page from Nearhost's interface. Other browsers and programs see the page without the list. The cookie's value is a secret kept in `page-secret` in Nearhost's data folder, readable only by you. Nearhost sets and reads the cookie at `nearhost.localhost` only. At `https://localhost:6327` the page has no list, and a document link opened there sets no cookie. So a server or container you browse at `localhost` does not receive the cookie. One limit: browsers send a cookie to every port of its host, so a server you open at `nearhost.localhost` on another port receives it and can fetch the list.

## The local CA

The internal certificate authority, "Nearhost Local CA", is created the first time Nearhost starts. Nearhost never ships a shared key or a wildcard certificate, and Caddy never installs the authority by itself.

Trusting it puts its root into the system trust store, which asks for your password once: the System keychain on macOS, your distribution's certificate store on Linux. On Windows it goes into your user's certificate store, which Windows confirms in a dialog of its own, with no password, and every browser there uses that store. It also updates the separate stores that Firefox and Linux Chromium-based browsers use, when `certutil` is installed. If the system already trusts it, only the browser stores are updated, with no password.

### Where its key is kept

The CA's private key is in the `caddy` folder named above, under `pki/authorities/local`. Anyone who has it can sign certificates that your browser trusts, so keep that folder out of dotfiles repositories and shared backups. Your config, `~/.config/nearhost/config.yaml` (`%APPDATA%\nearhost\config.yaml` on Windows, or under `$XDG_CONFIG_HOME` when that is set), holds no keys and is safe to share.

From Nearhost 0.8.0 the key is in the data folder. Earlier versions kept it in `~/.config/nearhost/caddy`, or `$XDG_CONFIG_HOME/nearhost/caddy` when that variable is set. The next time you run `nearhost`, `nearhost up`, `nearhost trust` or `nearhost untrust`, Nearhost moves an existing old folder there, so the CA you already trust stays the same. It does not move it while another Nearhost is running. If a copy of the old folder is left behind, `nearhost doctor` warns with `old CA copy` and says which folder to delete.

Trust it from the welcome box the first time you start Nearhost, or at any time with `nearhost trust`. `nearhost untrust` removes the CA from the system and browser stores. It leaves the key's folder where it is, unless you add `--delete-key`, which then deletes the CA's folder with its key and the certificates it issued. See [`nearhost untrust`](https://nearhost.dev/pr-preview/pr-119/docs/reference/cli.md#nearhost-untrust). See [First run](https://nearhost.dev/pr-preview/pr-119/docs/getting-started/first-run.md) and, for Linux, Windows and Firefox, [Install](https://nearhost.dev/pr-preview/pr-119/docs/getting-started/install.md).

Home shows whether it is trusted and when it expires. The date turns amber in the last 30 days.

## Per-name certificates

Leaf certificates are issued automatically. Each exact name a project serves gets its own. A name under a wildcard pattern gets one the first time it is visited. Because the CA is created on your machine, nobody else holds a key that can sign for your `.test` names.

Each certificate lasts 7 days, signed by an intermediate that lasts 30 days. Caddy checks for renewals every minute, so after a laptop wakes from a long sleep, a certificate that is due is replaced within a minute, with no restart. At start, Nearhost removes the certificates and keys of names under a wildcard pattern that expired more than a day ago, since Caddy renews only names it still serves. A name visited again gets a new one.

## What the proxy sets

Each web route of a running project is served at its hosts, and the first one also at `https://<alias>`. Requests go to the route's local forward, or for a local project to its port.

- The `Host` header is passed through unchanged.
- `X-Forwarded-Proto: https` and `X-Forwarded-For` are set.
- `Via` names Nearhost and its version, as `1.1 Nearhost (0.8.0)`, on the request and the response. Entries from other proxies are kept. From Nearhost 0.8.0; earlier versions said `Caddy`.
- WebSocket upgrades pass through.
- Responses are not buffered.

## Reloads without dropping connections

Config changes apply through Caddy's in-process reload. Starting or stopping a project leaves the connections of other projects open, and open WebSockets, such as hot reload, stay connected.

The proxy also keeps the requests it passes on, so you can look at them and send them again. See [The request log](https://nearhost.dev/pr-preview/pr-119/docs/concepts/the-request-log.md).

If the browser still warns about the certificate, see [The CA is not trusted](https://nearhost.dev/pr-preview/pr-119/docs/troubleshooting/troubleshooting.md#the-ca-is-not-trusted). For why local dev wants a real HTTPS name, see [HTTPS on a local dev domain](https://nearhost.dev/pr-preview/pr-119/docs/guides/https-on-a-local-dev-domain.md).
