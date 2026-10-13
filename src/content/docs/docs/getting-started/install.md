---
title: Install
description: Install the Nearhost binary on macOS or Linux.
sidebar:
  order: 1
---

:::note[Planned]
This describes behaviour from the Nearhost design that is not in a release yet.
:::

Nearhost is one static binary. Pick whichever of these fits how you install tools.

## Shell installer

```sh
curl -fsSL https://nearhost.dev/install.sh | sh
```

The script detects your OS and CPU, downloads the matching release from GitHub, verifies its checksum and installs to `/usr/local/bin` when that is writable, otherwise to `~/.local/bin`.

## Homebrew

```sh
brew install nearhost/tap/nearhost
```

## npm

```sh
npx @nearhost/cli
```

The `@nearhost/cli` package downloads the matching binary on install, so `npx` runs the real thing.

## Linux and ports 80 and 443

Nearhost serves HTTPS on 443 and redirects 80. On Linux a normal user cannot bind those ports. Either run the installer, which offers to set the capability, or do it yourself:

```sh
sudo setcap cap_net_bind_service=+ep "$(command -v nearhost)"
```

`nearhost doctor` reports whether the capability is present.

## Next

Run `nearhost` to start the one-screen first-run setup. It installs the local certificate authority and explains the two prompts you will see. See [First run](/docs/getting-started/first-run/).
