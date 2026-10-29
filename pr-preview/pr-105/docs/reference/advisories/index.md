# Advisories

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-105/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-105/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-105/docs/getting-started/install.md.

The advice Nearhost gives about a project, when each appears and how to fix it.

Advisories are shown, never applied. Nearhost does not edit your project's files. In the interface they appear in amber boxes under a project's routes, and `y` copies their snippets. `nearhost add` prints each one as `Advisory (<id>): <message>`.

One advisory is built in. The others come from the official presets and appear only when that preset is enabled and applies to the project. Any preset can add its own, and a later preset can replace or remove an earlier one's by its id. See [Presets and registries](https://nearhost.dev/pr-preview/pr-105/docs/concepts/presets-and-registries.md).

## Loopback port clash

`loopback-clash`, built in. Appears when another enabled project forwards the same loopback port:

```text
Port 5173 is also forwarded to this machine by project "shop". Only one can bind it. Give this project its own port.
```

When the port comes from a variable, the snippet sets it to a free port:

```sh
VITE_PORT=5174
```

`nearhost add` refuses to save a project with a clash unless you add it with `--disabled`, and a config file with one does not load.

## Vite on the default port

`vite-default-port`, from `nearhost/vite`. Appears when the Vite config sets no `server.port`, unless it reads `VITE_PORT` and `.env` sets it. Any `server.port` counts, a number, an expression such as `Number(process.env.APP_VITE_PORT) || 5291` or the shorthand `server: { port }`, but not one that is commented out. A port whose value reads `VITE_PORT` counts only while `.env` sets `VITE_PORT`. Vite will use 5173, which other Vite projects also use, so set a port in the Vite config. The snippet suggests a free one:

```ts
// vite.config.ts
export default defineConfig({
  server: {
    port: 5174,
  },
});
```

Under Laravel Sail, `nearhost/sail` replaces it with the same advice for `.env`. `laravel-vite-plugin` reads `VITE_PORT` from `.env` or the environment, so the advice does not appear when the Compose file's `environment` sets `VITE_PORT` to a port other than 5173. A default under `ports`, such as `${VITE_PORT:-5176}`, does not count: it only maps the port, and Vite in the container still listens on 5173. Its snippet:

```sh
VITE_PORT=5174
```

## allowedHosts missing

`allowed-hosts`, from `nearhost/vite`. Appears when `server.allowedHosts` does not include the alias, unless Vite serves HTTPS itself or allows every host. Vite rejects requests for hostnames it does not know.

```ts
// vite.config.ts
export default defineConfig({
  server: {
    allowedHosts: ['myapp.test'],
  },
});
```

`nearhost/sail` turns it off, since under Sail the browser reaches Vite at `localhost`, not at the alias.

## APP_URL mismatch

`app-url`, from `nearhost/laravel`. Appears when `APP_URL` in `.env` is missing, is not `https://`, has a port, or names a host the project does not serve. Generated links use that value, so set it to one of the project's addresses, with `https` and no port. The suggested line keeps the host when the project serves it, and uses the alias otherwise:

```sh
APP_URL=https://myapp.test
```

See [Discovery](https://nearhost.dev/pr-preview/pr-105/docs/concepts/discovery.md) for how advisories are produced.
