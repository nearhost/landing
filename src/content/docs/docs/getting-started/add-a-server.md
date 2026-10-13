---
title: Add a server
description: Register a remote machine that Nearhost reaches through your existing SSH setup.
sidebar:
  order: 3
---

A server is a remote machine you can reach with OpenSSH. Nearhost shells out to `ssh`, so it honours your whole `ssh_config`, including `Include`, `Match`, `ProxyJump` and `IdentityAgent`.

The `local` server always exists, needs no configuration, and cannot be removed or renamed.

## Before you start

`ssh <host>` must work without prompting. Nearhost checks this with:

```sh
ssh -o BatchMode=yes -o ConnectTimeout=10 <host> true
```

Run the same command yourself first. If it exits 0, Nearhost can use the host.

## From the TUI

Press `n` and choose **server**. The wizard replaces the main panel and keeps the sidebar visible.

1. Pick a host alias from `~/.ssh/config`, or type `user@host[:port]`. Wildcard hosts are not listed.
2. Name the server. The name is free text.
3. Nearhost runs the check above and shows the result.

## What Nearhost stores

Only the host string, as `ssh_host` in `~/.config/nearhost/config.yaml`. No keys, passwords or sockets are stored.

```yaml
servers:
  - name: mini
    ssh_host: mini
```

## If the check fails

The TUI shows OpenSSH's stderr verbatim, with the instruction to run `ssh <host>` in a terminal. That is where OpenSSH handles unknown host keys, `ssh-add` and similar. Fix it there, then retry the check.

Nothing is installed on the remote machine.
