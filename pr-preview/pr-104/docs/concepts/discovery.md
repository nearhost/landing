# Discovery

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-104/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-104/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-104/docs/getting-started/install.md.

How Nearhost reads a project's files to propose routes without running anything.

Discovery takes a server and a path, reads the project's files and proposes routes with labels and roles, plus advisories. It saves typing. It is not a requirement: a project it knows nothing about works once you give its web port.

Discovery only reads. No command runs on the remote machine. On a server the files are read over SFTP, through an SSH connection of discovery's own. On `local` they are read from disk.

## The .env rule

Without presets, Nearhost reads `.env`, then `.env.local`, and the later file wins. A port variable is any variable with `PORT` or `PORTS` as one of its parts, split on `_` or `-`, whose value is a whole number from 1 to 65535. `APP_PORT`, `FORWARD_DB_PORT` and `vite-port` all count.

Each one becomes a route labelled with the rest of its name and the variable itself:

```text
  8080  app (APP_PORT)
  3307  forward-db (FORWARD_DB_PORT)
```

When several variables hold the same port, the first in alphabetical order names it and the others are added in brackets.

With no registry trusted, this is all discovery does, and it makes no network request.

## What presets add

Each enabled preset that applies to the project adds to what is found. See [Presets and registries](https://nearhost.dev/pr-preview/pr-104/docs/concepts/presets-and-registries.md).

- **Compose files.** A preset that asks for Compose ports, such as `nearhost/compose` or `nearhost/sail`, makes discovery read the first of `docker-compose.yml`, `docker-compose.yaml`, `compose.yml` and `compose.yaml`. Each published TCP port becomes a route, labelled with its service, or `service (VAR)` when a variable sets it. `${VAR}`, `${VAR:-default}`, `${VAR-default}` and `$VAR` are filled in from the `.env` files, never from your shell. Ranges, UDP ports and ports that are not published are skipped. Without such a preset the Compose file is not read, and Nearhost says so.
- **Other files.** A preset can scan files such as `vite.config.ts` for values with a regular expression, and check `package.json` for a dependency. Nothing is executed, and JavaScript is not parsed.
- **Labels and roles.** A preset can relabel a port variable, propose a route as `loopback`, and hint which port should be the web route.
- **Advice.** Most advisories come from presets. See [Advisories](https://nearhost.dev/pr-preview/pr-104/docs/reference/advisories.md).

## Who claims a port

Each port is claimed once, by the first source that finds it:

1. Compose's published ports, when a preset asked for them.
2. Each preset that applies, in the order they declare.
3. The `.env` rule, for ports nothing else claimed.

A later preset can replace an earlier one's route or advice by using the same id, or remove it.

## Roles

Every proposed route starts as `ignore`, unless a preset proposes `loopback`. Then one route is made `web`, in this order:

1. A route a preset prefers as the web route.
2. A Compose port whose container port is 80.
3. A route a preset offers as a fallback, such as Vite's configured port.
4. The only route, when no preset recognised the project.

If none of these applies, the interface asks you for the web port, and `nearhost add` asks at a terminal or needs `--web <port>`. See [Routes and roles](https://nearhost.dev/pr-preview/pr-104/docs/concepts/routes-and-roles.md).

## When something cannot be read

A file that does not exist is skipped. A file that exists but cannot be read stops discovery with its error, rather than being treated as absent. If nothing at all is found, the interface asks for the web port.
