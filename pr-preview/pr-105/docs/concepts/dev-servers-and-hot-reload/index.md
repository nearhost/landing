# Dev servers and hot reload

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-105/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-105/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-105/docs/getting-started/install.md.

How assets and live reload reach your browser, and when a project needs a loopback forward.

A page served from `https://<alias>` usually needs a second thing to work: the dev server that builds its scripts and pushes live updates. There are two ways that server shows up, and Nearhost handles both.

## The dev server is the web app

A Vite, Next.js or similar project serves pages and assets from one port. Give that port the `web` role and you are done. Hot reload uses a WebSocket on the same origin, and the proxy passes WebSocket upgrades through.

Vite checks the `Host` header, so it needs the alias in `server.allowedHosts`. With the `nearhost/vite` preset enabled, Nearhost shows the exact lines to add. See [Advisories](https://nearhost.dev/pr-preview/pr-105/docs/reference/advisories.md).

## The dev server sits beside a backend

A backend framework renders the HTML, and the page loads its scripts from a separate dev server at an address like `http://localhost:5173`. Rails, Django and Laravel projects that use Vite all work this way.

That address is resolved by your browser, on your laptop. Nothing listens there, so scripts fail to load and hot reload never connects.

A `loopback` route fixes it. Nearhost forwards the same port number on your laptop to the dev server on the remote machine, so `localhost:5173` in the browser reaches port 5173 over there. The remote project needs no changes, as long as the page asks for `localhost`.

A Laravel project outside Sail whose Vite listens on `::1` writes `http://[::1]:5173` to `public/hot`. The forward answers on both `127.0.0.1` and `[::1]`, so the page reaches the dev server either way.

### Vite on `[::1]`

The forward answers on `[::1]` from Nearhost 0.7.0, on a laptop with the IPv6 loopback. Run `nearhost update` to get it. See [CLI](https://nearhost.dev/pr-preview/pr-105/docs/reference/cli.md#nearhost-update). With an older Nearhost, or on a laptop with IPv6 turned off, the forward answers on `127.0.0.1` only, and nothing answers `http://[::1]:5173`. Set `server.hmr.host` to `'localhost'` in `vite.config.js` and restart `npm run dev`, so that `public/hot` says `localhost` instead:

```js
export default defineConfig({
  // The rest of the config stays as it is.
  server: {
    hmr: { host: 'localhost' },
  },
});
```

Discovery proposes a loopback route only under Laravel Sail. For other backends, select the project, press `tab`, choose the dev server's route and press `space` to make it `loopback`. See [Routes and roles](https://nearhost.dev/pr-preview/pr-105/docs/concepts/routes-and-roles.md#changing-roles).

To see which forwards plain `ssh -L` would need for the same project, see [Vite hot reload fails over SSH port forwarding](https://nearhost.dev/pr-preview/pr-105/docs/guides/vite-hot-reload-over-ssh.md).

## What happens when a project starts

1. For a project on a server, Nearhost waits for its SSH connection. If the server cannot connect, the project does not start.
2. The hosts block is checked. It holds `127.0.0.1 <alias>` and `::1 <alias>` for every `.test` project, and for an enabled project with another [main name](https://nearhost.dev/pr-preview/pr-105/docs/reference/config.md#main-name) unless DNS already sends that name only to loopback. An enabled project's exact web hosts are listed the same way. Nearhost asks for your password only if it needs to change.
3. For a project on a server, one `-L` forward is added per `web` route, each on an ephemeral local port, and one per `loopback` route, on the same port locally. A local project needs no forwards.
4. The proxy rebuilds its Caddy config with the new site and applies it in-process.
5. The project's state becomes `running`.

A request to `https://myapp.test` reaches Caddy on 443, then the ephemeral local port, then the web port on the remote. A script tag pointing at `http://localhost:5173/...` reaches the loopback forward on 5173, then port 5173 on the remote. The hot reload client connects to the origin its script came from, so it works with no remote configuration.

## Example: Laravel Sail

Under Sail, `laravel-vite-plugin` writes `public/hot` as `http://localhost:<VITE_PORT>`. With the official presets trusted and `nearhost/sail` enabled, discovery reads the Compose file, makes the port published for container port 80 the `web` route, and proposes `VITE_PORT` as a `loopback` route. A Sail project then needs no manual setup. See [Presets and registries](https://nearhost.dev/pr-preview/pr-105/docs/concepts/presets-and-registries.md).

## Running several projects at once

A loopback route uses the same port number on both machines, so two running projects cannot share one. Give each project's dev server its own port. Nearhost warns you before the clash happens, and suggests a free port when the port comes from a variable. Adding a clashing project is refused unless you add it with `--disabled`. See [Advisories](https://nearhost.dev/pr-preview/pr-105/docs/reference/advisories.md).

If another program already holds the port on your laptop, the project goes into `error` and names the program. Its other routes still start.

## Reloads and reconnects

Starting or stopping a project reloads the proxy without closing open WebSockets, so hot reload in other tabs stays connected. If the SSH connection drops, Nearhost reconnects and puts every forward back. The project shows `degraded` meanwhile.
