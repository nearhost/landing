---
title: Advisories
description: The four advisories discovery can raise, when each appears and how to fix it.
sidebar:
  order: 4
---

Advisories are shown, never applied. Nearhost does not edit files on the remote machine. In the TUI they render in yellow beneath the routes, with a snippet you can copy by pressing `y`.

## Loopback port clash

Appears when another enabled project forwards the same loopback port. Only one project can bind it on your laptop, so give this one its own port. Nearhost suggests a free one:

```sh
VITE_PORT=5175
```

At start time the same clash is an error.

## Vite on the default port

Appears when Vite is present and nothing sets its port. Vite will use 5173, which every other Vite project also uses.

Set the port in the Vite config:

```ts
// vite.config.ts
export default defineConfig({
  server: {
    port: 5175,
  },
});
```

Under Laravel Sail, set it in `.env` instead:

```sh
VITE_PORT=5175
```

## allowedHosts missing

Appears when Vite serves the project directly and `server.allowedHosts` does not include the alias. Vite rejects requests for hostnames it does not know.

```ts
// vite.config.ts
export default defineConfig({
  server: {
    allowedHosts: ['myapp.test'],
  },
});
```

## APP_URL mismatch

Laravel only. Appears when `APP_URL` in `.env` is not `https://<alias>`. Generated links use that value, so set it to the alias:

```sh
APP_URL=https://myapp.test
```

See [Discovery](/docs/concepts/discovery/) for how advisories are produced.
