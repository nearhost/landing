---
title: Advisories
description: The four advisories discovery can raise, when each appears and how to fix it.
sidebar:
  order: 4
---

Advisories are shown, never applied. Nearhost does not edit files on the remote machine. In the project view they render in yellow beneath the routes, with their snippet.

## Loopback port clash

Appears when another enabled project uses the same loopback port. It suggests a distinct `VITE_PORT` value in `.env`:

```sh
VITE_PORT=5175
```

At start time the same clash is an error.

## Vite on default port

Appears when Vite is present but neither `VITE_PORT` nor `server.port` is set. Vite will use 5173 and is likely to clash with another project. The suggestion is the same:

```sh
VITE_PORT=5175
```

## allowedHosts missing

Appears when Vite is present, the project is not under Sail, and `server.allowedHosts` does not include the alias. Add it to `vite.config.js`:

```js
server: {
  allowedHosts: ['myapp.test'],
},
```

## APP_URL mismatch

Appears for a Laravel `.env` where `APP_URL` is not `https://<alias>`. It is informational and shows the value to set:

```sh
APP_URL=https://myapp.test
```

See [Discovery](/docs/concepts/discovery/) for how advisories are produced.
