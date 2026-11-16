---
title: Install
description: Install the Nearhost binary on macOS, Linux or Windows, including the extra steps Linux and Windows need.
sidebar:
  order: 1
---

Nearhost is one static binary for macOS, Linux and Windows 11, built for amd64 and arm64. Pick whichever of these fits how you install tools.

## Shell installer

On macOS and Linux:

```sh
curl -fsSL https://nearhost.dev/install.sh | sh
```

The script detects your OS and CPU, downloads the matching release from GitHub, verifies its checksum and installs to `/usr/local/bin` when that is writable, otherwise to `~/.local/bin`. It tells you when that folder is not on your `PATH`.

Three environment variables change what it does:

| Variable               | Effect                                                   |
| ---------------------- | -------------------------------------------------------- |
| `NEARHOST_VERSION`     | Install this release instead of the latest, as `v0.8.0`. |
| `NEARHOST_INSTALL_DIR` | Install into this folder.                                |
| `NEARHOST_SKIP_SETCAP` | Set to `1` to skip the Linux port step below.            |

Check the install with:

```sh
nearhost --version
```

`nearhost --version` needs Nearhost 0.8.0 or later. `nearhost version` prints the same, and works on releases before 0.8.0 too.

## PowerShell installer

On Windows, in PowerShell:

```powershell
irm https://nearhost.dev/install.ps1 | iex
```

The script detects your CPU, downloads the matching release from GitHub, verifies its checksum and installs `nearhost.exe` to `%LOCALAPPDATA%\Programs\nearhost`. It adds that folder to your user `PATH`, so open a new terminal before you run `nearhost`: a terminal that is already open keeps its old `PATH`. It runs in Windows PowerShell 5.1 and PowerShell 7, and if anything fails it stops with the reason and leaves an existing install as it was.

These environment variables change what it does. Set them before the command; a variable stays set for the rest of that PowerShell window:

```powershell
$env:NEARHOST_VERSION='v<version>'; irm https://nearhost.dev/install.ps1 | iex
```

| Variable               | Effect                                                       |
| ---------------------- | ------------------------------------------------------------ |
| `NEARHOST_VERSION`     | Install this release instead of the latest, as `v<version>`. |
| `NEARHOST_INSTALL_DIR` | Install into this folder.                                    |
| `NEARHOST_NO_PATH`     | Set to `1` to leave your `PATH` alone.                       |

## Windows zip

Each release on [GitHub](https://github.com/nearhost/nearhost/releases) has a zip for each Windows build, `nearhost_<version>_windows_amd64.zip` and `nearhost_<version>_windows_arm64.zip`. Each holds `nearhost.exe`, `LICENSE` and `README.md`. Extract `nearhost.exe` to a folder on your `PATH`, or add its folder to your `PATH` in Settings, then open a new terminal.

To check the zip against the release's `checksums.txt`, print its SHA-256 hash and compare it with the zip's line there. PowerShell prints it in capitals and the file in lower case, which is the same hash:

```powershell
Get-FileHash nearhost_<version>_windows_amd64.zip
```

## Homebrew

On macOS and Linux:

```sh
brew install nearhost/tap/nearhost
```

## From source

With Go:

```sh
go install github.com/nearhost/nearhost/cmd/nearhost@latest
```

Nearhost needs Go 1.27.3 or later, the version the release binaries are built with. Go 1.21 to 1.27.2 downloads it first, unless `GOTOOLCHAIN` forbids it (some distributions' Go packages set it to `local`). Then install Go 1.27.3 or later yourself.

## npm

```sh
npx @nearhost/cli
```

or `npm install -g @nearhost/cli` to keep the `nearhost` command. This works the same in PowerShell on Windows. npm installs the binary for your machine as a platform package, such as `@nearhost/cli-linux-x64` or `@nearhost/cli-win32-x64`, with no install script, so pnpm, bun and `--ignore-scripts` work too.

## Verifying a download

The shell and PowerShell installers check the archive against the release's `checksums.txt`. They do not check the attestation. Releases also carry build provenance attestations, and you can check any file you downloaded with the GitHub CLI:

```sh
gh attestation verify <file> --repo nearhost/nearhost
```

Each archive comes with a software bill of materials, `<archive>.sbom.json`, listing the modules it was built from. The attestation covers the archives, their SBOMs and `checksums.txt`. From Nearhost 0.8.0.

The macOS binaries are signed with a Developer ID certificate and notarised by Apple, so Gatekeeper runs them however you download them. A copy downloaded in a browser may need an internet connection the first time it runs, while macOS checks the notarisation with Apple. From Nearhost 0.9.0.

The Windows binaries are not signed. See [SmartScreen](#smartscreen) below.

## Updating

```sh
nearhost update
```

updates Nearhost the way you installed it, after asking. On Windows, for a copy from the PowerShell installer or a zip, `nearhost update` runs the PowerShell installer again into the same folder. See [`nearhost update`](/docs/reference/cli/#nearhost-update).

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

This adds the Nearhost Local CA to the system trust store and asks for your password through `sudo`, which must be in `/usr/bin`, `/bin`, `/usr/local/bin` or `/run/wrappers/bin` and owned by root, from Nearhost 0.8.0. It uses your distribution's own tool:

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

The CA's key is not in your config folder. See [The local CA](/docs/concepts/tls-and-the-proxy/#the-local-ca) for where it is and how to look after it.

## macOS and Firefox

`nearhost trust` adds the CA to the System keychain, which Safari and Chrome use. Firefox keeps its own store. To cover it, install `certutil` and run trust again:

```sh
brew install nss
nearhost trust
```

## Windows setup

Nearhost needs Windows 11, and Windows Terminal is the terminal it supports. `nearhost doctor` checks the parts below that it can.

### SmartScreen

The Windows binaries are not code signed, so the first time you run `nearhost.exe`, Microsoft Defender SmartScreen may stop it and say it prevented an unrecognised app from starting. Choose More info, check that the file is the `nearhost.exe` you installed, then choose Run anyway.

If Smart App Control is on, Windows can block `nearhost.exe` outright, with no Run anyway, because the binary is not code signed. Nearhost cannot run on that machine until its Windows binaries are signed.

### OpenSSH

Nearhost uses the OpenSSH client that ships with Windows 11, `ssh.exe`, and your `~/.ssh/config`, as on macOS and Linux. If `ssh` is missing, add OpenSSH Client in Settings > System > Optional features. `nearhost doctor` reports the version, and warns about one older than the 9.5 that Windows 11 ships.

A key with a passphrase needs the ssh-agent service, which Windows installs disabled. In PowerShell run as administrator, start it and have it start with Windows:

```powershell
Get-Service ssh-agent | Set-Service -StartupType Automatic; Start-Service ssh-agent
```

Then add your key, in an ordinary terminal:

```powershell
ssh-add
```

A key without a passphrase needs no agent. `nearhost doctor` shows whether the service is running.

The OpenSSH in Windows 11, version 9.5, does not resolve a `ProxyJump` host given as an alias from your `~/.ssh/config`. If a server is reached through a jump host, give `ProxyJump` the jump host's address, or use a `ProxyCommand`. `nearhost doctor` says so when this is why a server fails.

### Trust and the hosts file

`nearhost trust` adds the CA to your user's certificate store, and Windows asks you to confirm it in a dialog of its own. It needs no administrator rights. Edge and Chrome use that store, and so does Firefox 120 and later, so no browser needs anything more. If Firefox has been set not to read Windows' trusted roots, `nearhost doctor` warns and says which setting to change.

Each change to the hosts file, `C:\Windows\System32\drivers\etc\hosts`, needs administrator rights, so Windows shows a User Account Control prompt for it. See [First run](/docs/getting-started/first-run/#on-windows).

### Ports 80 and 443

Windows lets Nearhost bind ports 80 and 443 with no extra step. The proxy listens on loopback addresses only, so Windows Firewall does not ask about it. If port 80 is held by HTTP.sys, often for IIS, `nearhost doctor` names it and says how to find and stop the service that holds it.

### Projects in WSL

Nearhost runs on Windows itself, not inside WSL. To serve a project inside a WSL2 distribution, run sshd in the distribution and [add it as a server](/docs/getting-started/add-a-server/), as you would any machine you reach over SSH. Nearhost installed inside WSL is the Linux build, and the Linux setup above applies to it.

## Next

Run `nearhost`. The first time, it offers to trust the certificate authority for you. See [First run](/docs/getting-started/first-run/).
