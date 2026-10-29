# Routes and roles

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/docs/getting-started/install/ becomes https://nearhost.dev/docs/getting-started/install.md.

How each discovered port becomes a web, loopback or ignored route.

A project has a list of routes. Each route is a port on the server, a role and a label. The role decides what Nearhost does with the port.

```yaml
routes:
  - port: 8080
    role: web
    label: 'app'
  - port: 5173
    role: loopback
    label: 'Vite (vite.config)'
  - port: 5432
    role: ignore
    label: 'db'
```

## web

Served through the proxy. A project has at least one. The first is served at `https://<alias>`, and each later one only at hosts of its own, so it needs at least one.

Discovery proposes one: a route a preset prefers, then a Compose port mapped to container port 80, then a route a preset offers as a fallback, such as Vite's configured port, then a project's only port. See [Discovery](https://nearhost.dev/docs/concepts/discovery.md#roles). You can move the role to any route.

For a project on a server, Nearhost picks an ephemeral local port for the forward and the proxy sends requests for the alias to it. For a local project the proxy sends them straight to the port.

## loopback

A raw TCP forward to `127.0.0.1:<port>` on the laptop, using the same port number as the remote. From Nearhost 0.7.0, it answers on `[::1]:<port>` too. Use it for a dev server whose URLs point at `localhost`, such as Vite behind a backend framework.

A loopback route means nothing for local projects, because the port is already local, so a local route is either `web` or `ignore`. See [Dev servers and hot reload](https://nearhost.dev/docs/concepts/dev-servers-and-hot-reload.md) for when you need one.

## ignore

Discovered and listed, not forwarded. Discovery proposes every route as `ignore` unless it is the web route or a preset proposes `loopback`. In a project's panel, ignored routes fold into one line with their ports, such as `3 ignored: 3306 6379 1025`. Press `i` to list them, and `i` again to fold them.

## Changing roles

In the interface, select the project and press `tab` to move into its routes. Choose a route with `↑` and `↓`, then:

- `space` switches it between `loopback` and `ignore`
- `w` makes it a web route, the primary if it has no hosts, and other web routes with no hosts become `ignore`

Press `tab` or `esc` when you are done. The change is saved and applied at once. `e` on the project reads its files again and walks through the routes step of the form. From the command line, `nearhost add --web <port>` chooses the web route.

## Uniqueness rules

- Aliases must be unique across projects, ignoring case.
- Loopback ports must be unique across enabled projects. Adding a project whose loopback port another enabled project uses is refused, and a config file with such a clash does not load.
- Each project has at least one `web` route. Every web route after the first needs at least one host.
