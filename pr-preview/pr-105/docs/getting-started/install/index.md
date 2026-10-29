# Install

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-105/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-105/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-105/docs/getting-started/install.md.

Install the Nearhost binary on macOS or Linux, including the extra steps Linux needs.

Nearhost is one static binary for macOS and Linux, built for amd64 and arm64. Pick whichever of these fits how you install tools.

## Shell installer

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

## Homebrew

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

or `npm install -g @nearhost/cli` to keep the `nearhost` command. npm installs the binary for your machine as a platform package, such as `@nearhost/cli-linux-x64`, with no install script, so pnpm, bun and `--ignore-scripts` work too.

## Verifying a download

The shell installer checks the archive against the release's `checksums.txt`. It does not check the attestation. Releases also carry build provenance attestations, and you can check any file you downloaded with the GitHub CLI:

```sh
gh attestation verify <file> --repo nearhost/nearhost
```

Each archive comes with a software bill of materials, `<archive>.sbom.json`, listing the modules it was built from. The attestation covers the archives, their SBOMs and `checksums.txt`. From Nearhost 0.8.0.

The macOS binaries are signed with a Developer ID certificate and notarised by Apple, so Gatekeeper runs them however you download them. A copy downloaded in a browser may need an internet connection the first time it runs, while macOS checks the notarisation with Apple. From Nearhost 0.9.0.

## Updating

```sh
nearhost update
```

updates Nearhost the way you installed it, after asking. See [`nearhost update`](https://nearhost.dev/pr-preview/pr-105/docs/reference/cli.md#nearhost-update).

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

The CA's key is not in your config folder. See [The local CA](https://nearhost.dev/pr-preview/pr-105/docs/concepts/tls-and-the-proxy.md#the-local-ca) for where it is and how to look after it.

## macOS and Firefox

`nearhost trust` adds the CA to the System keychain, which Safari and Chrome use. Firefox keeps its own store. To cover it, install `certutil` and run trust again:

```sh
brew install nss
nearhost trust
```

## Next

Run `nearhost`. The first time, it offers to trust the certificate authority for you. See [First run](https://nearhost.dev/pr-preview/pr-105/docs/getting-started/first-run.md).
