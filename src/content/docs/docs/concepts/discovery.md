---
title: Discovery
description: How Nearhost reads a project's files to propose routes without running anything.
sidebar:
  order: 2
---

Discovery takes a server and a path, reads the project's files and returns proposed routes with labels and roles, plus advisories. On a remote server the files are read over SFTP through the server's SSH master. No shell commands run on the remote machine. For `local` they are read from disk.

## What is read, in order

Later sources override the labels of earlier ones.

1. `.env`, then `.env.local`.
2. `docker-compose.yml`, `docker-compose.yaml`, `compose.yml`, `compose.yaml`.
3. `vite.config.js`, `vite.config.ts`, `vite.config.mjs`, `vite.config.mts`.
4. `package.json`. Only the presence of a `vite` dependency is used.

## Sail variables

These variables map to labels:

- `APP_PORT`
- `VITE_PORT`
- `FORWARD_DB_PORT`
- `FORWARD_REDIS_PORT`
- `FORWARD_MAILPIT_PORT`
- `FORWARD_MAILPIT_DASHBOARD_PORT`
- `FORWARD_MEILISEARCH_PORT`
- `FORWARD_TYPESENSE_PORT`
- `FORWARD_MINIO_PORT`
- `FORWARD_MINIO_CONSOLE_PORT`
- `FORWARD_MONGODB_PORT`

When a variable is absent but its service is present in Compose, the default from the Sail stubs applies.

## Compose ports

Each `ports:` entry is parsed for its host port. The `${VAR:-default}` syntax is resolved against the values in `.env`. A literal port is labelled with its service name.

## Vite config

The file is scanned with regular expressions for `server.port`, `server.hmr`, `server.allowedHosts` and `server.https`. No JavaScript is executed or parsed.

## When nothing is found

Anything unrecognised is still listed, with the role `ignore`. If discovery finds nothing at all, the add-project wizard in the TUI, once it ships, lets you enter ports by hand.

Discovery also produces advisories, which are shown and never applied. See [Advisories](/docs/reference/advisories/).
