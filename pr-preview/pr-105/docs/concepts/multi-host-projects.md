# Multi-host projects

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-105/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-105/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-105/docs/getting-started/install.md.

How one project serves several web routes, each at hosts of its own, and where those hosts come from.

A project can serve more than one name. An app, its WebSocket server and its file store can each answer at a host of their own, all from one project in Nearhost.

## Several web routes

A project can have several `web` routes. The first is the primary: it is served at the project's [main name](https://nearhost.dev/pr-preview/pr-105/docs/reference/config.md#main-name), and at any hosts you give it too. Every other web route is served only at its own hosts, so it needs at least one.

You give a route hosts in three ways:

- **In the interface.** On the routes step of the add or edit form, choose a web route and press `h`. Type its hosts separated by spaces, and press `enter`.
- **On the command line.** `nearhost add --host <host>` adds a host to the primary web route. Repeat it for more.
- **In the project's files.** A [`.nearhostrc`](https://nearhost.dev/pr-preview/pr-105/docs/reference/nearhostrc.md#keys) lists hosts for each route, and presets can find them in `.env`. See [Hosts from presets](#hosts-from-presets).

In the routes view on the main screen, `w` makes a route web. If it has no hosts, it becomes the primary. Other web routes with no hosts become `ignore`, so a route with hosts of its own keeps serving them.

## Host patterns

A host is an exact name, such as `api.local.example.com`, or a pattern with `*` in place of one label, such as `*.status.local.example.com`.

- `*` stands for exactly one label. `*.status.local.example.com` matches `eu.status.local.example.com`, but not `status.local.example.com` or `a.eu.status.local.example.com`.
- `*` can be the leftmost label or one in the middle, as in `internal.*.local.example.com`.
- The part to the right of the last `*` must be at least two labels, and more than a public suffix. A pattern that is only wildcards is refused, and so are `*.test`, `*.com` and `*.co.uk`. `*.myapp.test` is allowed.
- `localhost` is allowed as an exact host. Any other name needs at least two labels, and an IP address is refused.
- Hosts are lowercase.

## Which route answers

When several hosts match a name, the most specific one answers:

1. An exact host beats any pattern.
2. Among patterns, the one with more fixed labels wins, so `internal.*.local.example.com` beats `*.*.local.example.com`.
3. Patterns with as many fixed labels are taken in lexical order.

A host can be served by only one enabled project. Two exact hosts clash when they are the same name, and two patterns when they are written the same. An exact host under another project's pattern does not clash, because the exact host wins. Saving an enabled project, or starting one, that would serve a host another enabled project serves is refused with `host <host> is already served by project "<other>"`. `nearhost doctor` warns, as `hosts.overlap`, when a pattern overlaps another project's without being the same.

## Certificates and DNS

Each exact host gets its own certificate. A name under a pattern gets one the first time it is visited. See [TLS and the proxy](https://nearhost.dev/pr-preview/pr-105/docs/concepts/tls-and-the-proxy.md#per-name-certificates).

An exact host goes in the hosts file while its project is enabled. One that does not end in `.test` is left out when DNS already points it only at loopback addresses, and `localhost` is never added. Patterns never go in the hosts file, because the file cannot hold them, so a pattern's names need DNS that points them at this machine. `nearhost doctor` reports a pattern that does not resolve here as `hosts.unresolved-pattern`. See [The hosts file](https://nearhost.dev/pr-preview/pr-105/docs/concepts/the-hosts-file.md).

## What needs approval

A host that does not end in `.test`, any pattern and `localhost` wait for your approval before they are served. A host you type with `--host` or `h` is approved by typing it. See [Approval](https://nearhost.dev/pr-preview/pr-105/docs/reference/nearhostrc.md#approval).

## Hosts from presets

A preset can name hosts as well as ports. The [`nearhost/sail`](https://nearhost.dev/pr-preview/pr-105/docs/concepts/presets-and-registries.md#the-official-presets) preset reads them from `.env`:

| Variable                          | Served on the port in          |
| --------------------------------- | ------------------------------ |
| `APP_URL`                         | `APP_PORT`, or 80              |
| `REVERB_HOST`                     | `FORWARD_REVERB_PORT`, or 8080 |
| `FILES_URL`, `MINIO_URL`, or both | `FORWARD_MINIO_PORT`, or 9000  |

Only the host is taken from each value. A port in the URL is ignored, and the route's port comes from the variable beside it. The Reverb and MinIO hosts are read only when their port variable is set in `.env` or named in the Compose file.

- Inference never proposes `localhost`, an IP address or a name without a dot. A malformed name is left out with a warning.
- A route that has inferred hosts becomes a web route. A `loopback` route cannot have hosts, so they are dropped with a warning.
- A `.nearhostrc` that lists a route wins over the hosts presets found for it. See [Keys](https://nearhost.dev/pr-preview/pr-105/docs/reference/nearhostrc.md#keys).
- `nearhost add` leaves out an inferred host that another enabled project already serves, with a note: `Not serving <host>: project "<other>" already serves it.` A later web route left with no hosts becomes `ignore`. A project added with `--disabled` keeps them, since it serves nothing yet. The interface does not leave them out: it refuses to save, and you remove the host with `h`.

Inferred hosts are fixed when the project is added or edited. Changing `APP_URL` later does not change what is served. Editing the project, with `e` in the interface, adds any newly inferred hosts to a saved web route and never removes a saved one. `nearhost doctor` reports a host the project's settings name that no web route serves, as `routes.unserved-host`, and tells you to edit the project.

## Where the URLs show

The project view in the interface lists every URL under the project's name. A pattern is shown dim, since a browser cannot open it. For a coding agent, `/nearhost status` reports the main URL as `url`, and every URL the project serves, the main one first, as `urls`. See [Add a project from an agent](https://nearhost.dev/pr-preview/pr-105/docs/coding-agents/add-a-project.md).

## An example

A Sail project with an app, Reverb and MinIO, whose Compose file publishes `APP_PORT`, `FORWARD_REVERB_PORT` and `FORWARD_MINIO_PORT`, has this in its `.env`:

```ini
APP_URL=https://shop.local.example.com
APP_PORT=8010
REVERB_HOST=ws.shop.local.example.com
FORWARD_REVERB_PORT=8090
FILES_URL=https://files.shop.local.example.com:9010
FORWARD_MINIO_PORT=9010
```

With `nearhost/sail` enabled, `nearhost add` asks you to approve the three hosts, since none ends in `.test`. Nearhost then serves:

| URL                                    | Port |
| -------------------------------------- | ---- |
| `https://shop.test`                    | 8010 |
| `https://shop.local.example.com`       | 8010 |
| `https://ws.shop.local.example.com`    | 8090 |
| `https://files.shop.local.example.com` | 9010 |

`shop.test` is the main name, so it is served on the primary route with the app's own host. Add the project with `--alias shop.local.example.com` to make the real name the main one.
