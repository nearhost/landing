---
title: CLI
description: Every nearhost subcommand and what nearhost doctor checks.
sidebar:
  order: 1
---

```text
nearhost                    TUI
nearhost up [project...]    headless: start projects, run until Ctrl-C
nearhost add [path]         non-interactive add using discovery defaults
nearhost ls                 print projects and states
nearhost trust | untrust    local CA in the keychain
nearhost hosts apply|clean  hosts block (apply reads aliases from stdin)
nearhost doctor             checks: ports 80/443 free, CA trusted, hosts
                            block present, each server reachable, Linux
                            port binding capability
```

## nearhost

Starts the TUI. On first run it shows the setup screen. See [First run](/docs/getting-started/first-run/).

## nearhost up

Starts the named projects without the TUI and runs until Ctrl-C.

```sh
nearhost up myapp
```

## nearhost add

Non-interactive add. Runs discovery on `[path]` and accepts its defaults. See [Add a project](/docs/getting-started/add-a-project/).

## nearhost ls

Prints projects and their states.

## nearhost trust

Installs the local CA root into the system trust store, with one password prompt. It then reports on the browser stores that Firefox and Linux Chromium-based browsers use, and updates them when `certutil` is installed. Run it again at any time; it only does what is missing.

## nearhost untrust

Reverses `trust`.

## nearhost hosts

`apply` reads the aliases from stdin, one per line, and rewrites the Nearhost block in `/etc/hosts`. `clean` removes the block. Both prompt for sudo. See [The hosts file](/docs/concepts/the-hosts-file/).

## nearhost doctor

Reports:

- ports 80 and 443 are free
- the CA is trusted
- the hosts block is present
- each server is reachable
- on Linux, the port binding capability is set
