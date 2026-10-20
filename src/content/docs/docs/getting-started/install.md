---
title: Install
description: Install the Nearhost binary on macOS or Linux, including the extra steps Linux needs.
sidebar:
  order: 1
---

Nearhost is one static binary for macOS and Linux, built for amd64 and arm64. Pick whichever of these fits how you install tools.

## Shell installer

```sh
curl -fsSL https://nearhost.dev/install.sh | sh
```

The script detects your OS and CPU, downloads the matching release from GitHub, verifies its checksum and installs to `/usr/local/bin` when that is writable, otherwise to `~/.local/bin`. It tells you when that folder is not on your `PATH`.

Three environment variables change what it does:

| Variable               | Effect                                                   |
| ---------------------- | -------------------------------------------------------- |
| `NEARHOST_VERSION`     | Install this release instead of the latest, as `v0.7.0`. |
| `NEARHOST_INSTALL_DIR` | Install into this folder.                                |
| `NEARHOST_SKIP_SETCAP` | Set to `1` to skip the Linux port step below.            |

Check the install with:

```sh
nearhost version
```

## Homebrew

```sh
brew install nearhost/tap/nearhost
```

## From source

With Go 1.26 or later:

```sh
go install github.com/nearhost/nearhost/cmd/nearhost@latest
```

## npm

```sh
npx @nearhost/cli
```

or `npm install -g @nearhost/cli` to keep the `nearhost` command. npm installs the binary for your machine as a platform package, such as `@nearhost/cli-linux-x64`, with no install script, so pnpm, bun and `--ignore-scripts` work too.

## Updating

```sh
nearhost update
```

updates Nearhost the way you installed it, after asking. See [`nearhost update`](/docs/reference/cli/#nearhost-update).

## Linux setup

Linux needs three things that macOS handles with a single prompt. `nearhost doctor` checks all of them.

### Allow binding ports 80 and 443

Nearhost serves HTTPS on 443 and redirects 80. A normal user cannot bind those ports, so grant the binary that one capability:

```sh
sudo setcap cap_net_bind_service=+ep "$(command -v nearhost)"
```

Run it again after each upgrade, because replacing the binary clears the capability. `nearhost update` prints the command when it is needed. The shell installer prints this command for you. Run from a downloaded copy at a terminal, rather than through `curl | sh`, it asks whether to run it, and only uses `sudo` if you say yes.

Installed from npm, `command -v nearhost` finds the Node launcher rather than the binary, so run the command `nearhost doctor` prints instead: it names the binary itself.

### Trust the certificate authority

```sh
nearhost trust
```

This adds the Nearhost Local CA to the system trust store and asks for your password through `sudo`. It uses your distribution's own tool:

| Distribution   | Command it runs           |
| -------------- | ------------------------- |
| Debian, Ubuntu | `update-ca-certificates`  |
| Fedora, RHEL   | `update-ca-trust extract` |
| openSUSE       | `update-ca-certificates`  |
| Arch           | `trust extract-compat`    |

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

Run `nearhost`. The first time, it offers to trust the certificate authority for you. See [First run](/docs/getting-started/first-run/).
