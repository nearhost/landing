---
title: Install
description: Install the Nearhost binary on macOS or Linux, including the extra steps Linux needs.
sidebar:
  order: 1
---

Nearhost is one static binary for macOS and Linux, on Apple silicon, Intel and ARM. Pick whichever of these fits how you install tools.

## Shell installer

```sh
curl -fsSL https://nearhost.dev/install.sh | sh
```

The script detects your OS and CPU, downloads the matching release from GitHub, verifies its checksum and installs to `/usr/local/bin` when that is writable, otherwise to `~/.local/bin`. It never runs `sudo` on its own.

## Homebrew

```sh
brew install nearhost/tap/nearhost
```

## npm

```sh
npx @nearhost/cli
```

The `@nearhost/cli` package downloads the matching binary on install, so `npx` runs the real thing.

## Linux setup

Linux needs three things that macOS handles with a single prompt. `nearhost doctor` checks all of them.

### Allow binding ports 80 and 443

Nearhost serves HTTPS on 443 and redirects 80. A normal user cannot bind those ports, so grant the binary that one capability:

```sh
sudo setcap cap_net_bind_service=+ep "$(command -v nearhost)"
```

Run it again after each upgrade, because replacing the binary clears the capability. The shell installer prints this command for you.

### Trust the certificate authority

```sh
nearhost trust
```

This adds the Nearhost Local CA to the system trust store and asks for your password through `sudo`. It uses your distribution's own tool:

| Distribution   | Command it runs          |
| -------------- | ------------------------ |
| Debian, Ubuntu | `update-ca-certificates` |
| Fedora, RHEL   | `update-ca-trust`        |
| openSUSE       | `update-ca-certificates` |
| Arch           | `trust extract-compat`   |

### Trust it in your browser

Firefox and Chromium-based browsers on Linux keep their own certificate databases and ignore the system store. Nearhost fills them in when `certutil` is installed:

```sh
sudo apt install libnss3-tools   # Debian, Ubuntu
sudo dnf install nss-tools       # Fedora, RHEL
```

Then run `nearhost trust` again. It prints whether the browser stores were updated. Restart the browser afterwards.

## macOS and Firefox

`nearhost trust` adds the CA to the System keychain, which Safari and Chrome use. Firefox keeps its own store. To cover it, install `certutil` and run trust again:

```sh
brew install nss
nearhost trust
```

## Next

Run `nearhost` to start the one-screen first-run setup. See [First run](/docs/getting-started/first-run/).
