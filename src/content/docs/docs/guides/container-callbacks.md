---
title: Callbacks from Docker containers to a local HTTPS domain
description: Let a Docker Compose service, such as a queue worker or a LocalStack job, call your app at its Nearhost HTTPS name on this machine.
sidebar:
  order: 7
---

:::note
This needs Nearhost 0.6.0 or later. Run `nearhost update` to get the latest. See [CLI](/docs/reference/cli/#nearhost-update).
:::

A service in your Compose file often calls the app back: a queue worker reports a finished job, or a LocalStack job delivers an event to a webhook. Point it at the app's Nearhost name, such as `https://api.local.example.io/webhooks/jobs`, and the call fails, even though the same URL works in your browser.

Three things stand between the container and Nearhost. The container cannot find the host, it does not trust the local certificate authority, and on Linux Nearhost does not let it in. Each is fixed once, in the project's files.

This works only for a project on this machine. A container on an SSH server cannot reach the proxy on your laptop.

## The example

The app listens on port 8000 and is served at `api.local.example.io`. Its `.nearhostrc`:

```yaml
version: 1
routes:
  - port: ${APP_PORT:-8000}
    label: app
    hosts: [api.local.example.io]
docker_clients: true
```

`docker_clients` is explained in [Being let in](#being-let-in). Its Compose file runs the app and a worker that calls it:

```yaml
services:
  app:
    build: .
    ports:
      - '${APP_PORT:-8000}:8000'
  worker:
    build: .
    command: ['./worker']
    environment:
      WEBHOOK_URL: https://api.local.example.io/webhooks/jobs
```

Nothing here depends on the stack. Any service that reads a URL naming a host Nearhost serves, from its `environment`, its `env_file` files, or the project's `.env` when it mounts the project directory, has the same three problems.

## Reaching the host

Nearhost puts `api.local.example.io` in your machine's hosts file, pointing at loopback. A container does not read that file, and inside it loopback is the container itself. So the name resolves to nothing, to the public internet, or, where DNS points it at 127.0.0.1, back to the container.

Map the name to the host with `extra_hosts`. `host-gateway` is Docker's name for the host's address as seen from a container:

```yaml
services:
  worker:
    extra_hosts:
      - 'api.local.example.io:host-gateway'
```

List every name the service calls. `nearhost doctor` reports a service that calls a name without this mapping, as `docker.host-gateway`, and its fix is this snippet for the names it found.

## Trusting the local CA

Nearhost's certificates are signed by its own local certificate authority. Your system trusts it, but a container has its own trust store, so the call fails with a certificate error.

Mount the root certificate into the container and point the service at it. The certificate is at `~/.config/nearhost/caddy/pki/authorities/local/root.crt`, or under `$XDG_CONFIG_HOME/nearhost` when that is set, and `nearhost doctor` prints the path on your machine. The doctor's snippet, for a Node service:

```yaml
services:
  worker:
    environment:
      NODE_EXTRA_CA_CERTS: /usr/local/share/ca-certificates/nearhost.crt
    volumes:
      - "${NEARHOST_CA_CERT:?set NEARHOST_CA_CERT to Nearhost's root certificate}:/usr/local/share/ca-certificates/nearhost.crt:ro"
```

Each developer sets `NEARHOST_CA_CERT` to the certificate's path in their shell profile, or in `.env` when the project does not commit `.env`, so the Compose file holds no one's path. Compose reads only `.env` and the shell, not `.env.local`.

`NODE_EXTRA_CA_CERTS` adds the certificate to Node's own. `SSL_CERT_FILE`, `AWS_CA_BUNDLE` and `REQUESTS_CA_BUNDLE` replace the default bundle instead, so point them at a bundle that includes the certificate, or have the image run `update-ca-certificates`.

`nearhost doctor` reports a service that calls a name Nearhost serves and does not trust the certificate, as `docker.ca`. A service that sets `SSL_CERT_FILE`, `NODE_EXTRA_CA_CERTS`, `AWS_CA_BUNDLE`, `REQUESTS_CA_BUNDLE` or `CURL_CA_BUNDLE`, or mounts the certificate's path, counts as set up.

## Being let in

Nearhost serves its projects only to this machine. A request from anywhere else is dropped without an answer. On Linux, a container's request comes from its address on a Docker network, not from loopback, so Nearhost drops it.

`docker_clients: true` in the project's [`.nearhostrc`](/docs/reference/nearhostrc/#docker-clients) serves the project to the networks the Docker daemon has on this machine as well. Nearhost asks Docker for them when the project starts, and again every 30 seconds while it runs, so a network Compose creates later is let in too. Until Docker first answers, it accepts requests from `172.16.0.0/12`, the block Docker's networks come from by default. The project's log says which networks it accepts requests from.

- It works only for a project on this machine. On a project on a server, the file is an error.
- It always needs your approval, as a real domain does. See [Approval](/docs/reference/nearhostrc/#approval).
- Other projects stay loopback-only. Only the project that opts in is served to Docker's networks.

With no `.nearhostrc` yet, `nearhost export` writes one from the project's current setup, and you add the line to it.

Docker Desktop on macOS already delivers container requests from 127.0.0.1, so this matters on Linux. On a Mac, the project is reached without it. Keep it in a committed `.nearhostrc` if anyone on the team uses Linux.

`nearhost doctor` reports a project whose containers call a name it serves without the opt-in, as `docker.clients`. It is a warning on Linux, and only a note on macOS.

## The finished Compose file

```yaml
services:
  app:
    build: .
    ports:
      - '${APP_PORT:-8000}:8000'
  worker:
    build: .
    command: ['./worker']
    environment:
      WEBHOOK_URL: https://api.local.example.io/webhooks/jobs
      NODE_EXTRA_CA_CERTS: /usr/local/share/ca-certificates/nearhost.crt
    extra_hosts:
      - 'api.local.example.io:host-gateway'
    volumes:
      - "${NEARHOST_CA_CERT:?set NEARHOST_CA_CERT to Nearhost's root certificate}:/usr/local/share/ca-certificates/nearhost.crt:ro"
```

Approve `api.local.example.io` and `docker_clients` when you add the project, or when Nearhost asks after the file changes. Then restart the worker with `docker compose up -d worker`.

## Check it works

Run `nearhost doctor`. After the machine checks, it lists what it finds in each enabled project. For the example before any of the fixes, with `docker_clients` not yet in its `.nearhostrc`, on a Mac, it reports:

```text
warn  shop             worker calls a name Nearhost serves, and does not trust Nearhost's root certificate
warn  shop             worker uses api.local.example.io, which a container resolves to itself or to the public internet, not to Nearhost
info  shop             a container calls a name Nearhost serves, and Nearhost does not accept requests from Docker's network
```

Each comes with its fix and a snippet to paste. These are `docker.ca`, `docker.host-gateway` and `docker.clients`, and `nearhost doctor --json` gives each finding's `id`. On Linux the last one is a warning too. When the project is fixed, none of them is shown. See [nearhost doctor](/docs/reference/cli/#nearhost-doctor).

The doctor only reads the files. To see the call work, run the worker and watch the request arrive in Nearhost.

## When a public tunnel is still the right tool

This is for services you run yourself, on this machine. A webhook from a real provider, such as a payment or source control service, comes from its servers, which cannot reach your laptop. Use a public tunnel, such as ngrok, for that. See [ngrok loads the page, but assets point at localhost](/docs/guides/ngrok-assets-on-localhost/).
