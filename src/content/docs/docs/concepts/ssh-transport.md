---
title: SSH transport
description: How Nearhost drives OpenSSH with one supervised control master per server.
sidebar:
  order: 5
---

Nearhost shells out to OpenSSH, so your `ssh_config` applies. If `ssh <host>` works without a prompt, Nearhost works.

## One master per server

Each remote server gets one OpenSSH ControlMaster process, supervised by Nearhost and started when a project there first needs it:

```sh
ssh -N -M -S ~/.config/nearhost/run/<server>.sock \
    -o BatchMode=yes -o ExitOnForwardFailure=yes \
    -o ServerAliveInterval=15 -o ServerAliveCountMax=3 \
    -o ControlPersist=no -o ClearAllForwardings=yes \
    -o RemoteCommand=none <host>
```

The last three options keep the master to Nearhost's own forwards: `LocalForward` and `RemoteForward` lines in your config are left out, and a `RemoteCommand` is not run. The `local` server needs no transport.

Discovery and the add forms open a separate connection of their own, so reading a project's files never disturbs a running one.

## Forwards added live

Forwards are added and removed on the running master, with no reconnect:

```sh
ssh -S <sock> -O forward -L 127.0.0.1:<local>:localhost:<remote> <host>
ssh -S <sock> -O cancel -L 127.0.0.1:<local>:localhost:<remote> <host>
```

[Forward several ports over SSH without retyping -L](/docs/guides/forward-ports-over-ssh/) compares this with the ways to do it by hand.

Nearhost keeps the list of forwards each server should have. After a reconnect it puts them all back before the server shows as connected. A forward that fails, because something on your laptop holds the port, puts its project in `error` with the name of the program.

## The agent socket

Each master also forwards a Unix socket back to the laptop, at `~/.nearhost/<id>.sock` on the server, so that a coding agent there reaches Nearhost. It is added after the master connects and again after each reconnect, and a server that refuses it only loses that: its projects serve as usual. See [Use a coding agent](/docs/getting-started/use-a-coding-agent/).

## Reconnection and backoff

If the master exits, Nearhost starts it again, waiting 1 second, then twice as long each time, up to 30 seconds. A master that does not connect within 20 seconds is stopped and tried again. While it waits, the server shows `reconnecting · attempt 3 · next in 8s`, and its projects show `degraded`.

Some errors do not go away by retrying: `Permission denied`, a host key that failed or changed, and too many authentication failures. After three of those in a row, Nearhost stops and the server shows `auth failed`, with the fix: run `ssh <host>` once in a terminal, then press `r`.

## Reconnecting and dropping

On a server's row in the interface:

- `r` reconnects now, without waiting for the next attempt. On Home, `r` does this for every server that cannot connect.
- `c` drops the connection and holds it closed. Its projects keep their sites and show `degraded`, and starting one there is refused until you press `c` again to connect.

## Shutting down

On exit, Nearhost stops every master with `-O exit`, and stops it outright if it has not gone after 3 seconds. A socket left by a crash is checked before each start, and cleared.

## What is stored

Nothing beyond the host string. No keys, passwords or sockets are kept in `config.yaml`.
