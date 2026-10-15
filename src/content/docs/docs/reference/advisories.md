---
title: Advisories
description: The advice Nearhost gives about a project, when each appears and how to fix it.
sidebar:
  order: 4
---

Advisories are shown, never applied. Nearhost does not edit your project's files. In the interface they appear in amber boxes under a project's routes, and `y` copies their snippets. `nearhost add` prints each one as `Advisory (<id>): <message>`.

One advisory is built in. The others come from the official presets and appear only when that preset is enabled and applies to the project. Any preset can add its own, and a later preset can replace or remove an earlier one's by its id. See [Presets and registries](/docs/concepts/presets-and-registries/).

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

`vite-default-port`, from `nearhost/vite`. Appears when the Vite config sets no `server.port`, unless it reads `VITE_PORT` and `.env` sets it. Vite will use 5173, which other Vite projects also use, so set a port in the Vite config. The snippet suggests a free one:

```ts
// vite.config.ts
export default defineConfig({
  server: {
    port: 5174,
  },
});
```

Under Laravel Sail, `nearhost/sail` replaces it with the same advice for `.env`:

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

`app-url`, from `nearhost/laravel`. Appears when `APP_URL` in `.env` is missing or is not `https://<alias>`. Generated links use that value, so set it to the alias:

```sh
APP_URL=https://myapp.test
```

See [Discovery](/docs/concepts/discovery/) for how advisories are produced.
