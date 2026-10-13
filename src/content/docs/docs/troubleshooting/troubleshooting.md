---
title: Troubleshooting
description: Symptoms Nearhost reports and the fix for each.
sidebar:
  order: 1
---

:::note[Planned]
This describes behaviour from the Nearhost design that is not in a release yet.
:::

Every failure attaches to the thing that failed and shows the underlying message plus one fix action. A failure in one project or server never affects another. `nearhost doctor` checks most of the causes below at once.

## Port 443 or 80 already in use

The proxy refuses to start. Home names the port and, where available, the owning process.

Stop whatever holds the port. Herd, Valet and nginx are the usual causes. On Linux, also check that the binary may bind low ports. See [Install](/docs/getting-started/install/).

## A loopback port is already bound

The project enters `error` and shows the port and process. Its other routes still start.

Stop the process, or give the project a distinct `VITE_PORT` in `.env` and edit the route.

## Sudo declined

The project stays `stopped` with "alias not resolvable, press enter to retry". Press `enter` on the project and approve the sudo prompt. See [The hosts file](/docs/concepts/the-hosts-file/).

## Keychain trust declined

The proxy still runs. Home shows the CA as untrusted with the `nearhost trust` hint. Run:

```sh
nearhost trust
```

## SSH keeps reconnecting

The server shows `reconnecting` with backoff and its projects show `degraded`. Caddy returns 502 meanwhile.

Read the last error on the server view, then run `ssh <host>` in a terminal. When it connects, press `r` to reconnect.

## Authentication failed three times

Nearhost stops retrying after three consecutive authentication failures. The server shows the fix command. Run `ssh <host>` in a terminal and handle the host key, passphrase or `ssh-add` prompt. Then press `r`.

## Discovery found nothing

The wizard allows manual port entry. Add the ports and their roles yourself. See [Discovery](/docs/concepts/discovery/).

## Config file invalid

Nearhost exits with the YAML error and line. Fix that line in `~/.config/nearhost/config.yaml`. See [config.yaml](/docs/reference/config/).
