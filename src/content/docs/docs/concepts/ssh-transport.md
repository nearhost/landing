---
title: SSH transport
description: How Nearhost drives OpenSSH with one supervised control master per server.
sidebar:
  order: 3
---

Nearhost shells out to OpenSSH. Your `ssh_config` applies in full, and if `ssh <host>` works, Nearhost works.

## One master per server

Each remote server gets one OpenSSH ControlMaster process, supervised by Nearhost:

```sh
ssh -N -M -S ~/.config/nearhost/run/<server>.sock \
    -o BatchMode=yes -o ExitOnForwardFailure=yes \
    -o ServerAliveInterval=15 -o ServerAliveCountMax=3 <host>
```

Status is probed with `ssh -S <sock> -O check <host>`. The `local` server has a trivial transport with no forwards.

## Forwards added live

Forwards are added and removed on the running master, with no reconnect:

```sh
ssh -S <sock> -O forward -L 127.0.0.1:<local>:localhost:<remote> <host>
ssh -S <sock> -O cancel -L 127.0.0.1:<local>:localhost:<remote> <host>
```

OpenSSH reports a failure if the local port is in use.

## Reconnection and backoff

If the master exits, Nearhost relaunches it with exponential backoff from 1 to 30 seconds. After three consecutive authentication failures it stops retrying and the server shows the fix command.

On exit, Nearhost stops every master with `-O exit`. Stale sockets left by a crash are detected on startup with `-O check` and removed if dead.

## What is stored

Nothing beyond the host string. No keys, passwords or sockets are kept in `config.yaml`.
