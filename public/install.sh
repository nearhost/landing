#!/bin/sh
# Nearhost installer. https://nearhost.dev
# Downloads the latest release for this machine, verifies its checksum and installs the binary.
set -eu

REPO="nearhost/nearhost"

fail() {
  printf 'nearhost install: %s\n' "$1" >&2
  exit 1
}

need() {
  command -v "$1" >/dev/null 2>&1 || fail "$1 is required"
}

need curl
need tar

os="$(uname -s | tr '[:upper:]' '[:lower:]')"
case "$os" in
  darwin | linux) ;;
  *) fail "unsupported OS: $os. Nearhost supports macOS and Linux." ;;
esac

arch="$(uname -m)"
case "$arch" in
  x86_64 | amd64) arch="amd64" ;;
  arm64 | aarch64) arch="arm64" ;;
  *) fail "unsupported architecture: $arch. Nearhost ships amd64 and arm64 builds." ;;
esac

version="${NEARHOST_VERSION:-}"
if [ -z "$version" ]; then
  version="$(curl -fsSLI -o /dev/null -w '%{url_effective}' "https://github.com/$REPO/releases/latest" | sed -n 's#.*/tag/##p')"
  case "$version" in
    v[0-9]*) ;;
    *) fail "could not determine the latest release. Nearhost has no published release yet, or GitHub could not be reached." ;;
  esac
fi

base="${NEARHOST_BASE_URL:-https://github.com/$REPO/releases/download/$version}"
asset="nearhost_${version#v}_${os}_${arch}.tar.gz"

if [ "${NEARHOST_INSTALL_DRY_RUN:-}" = "1" ]; then
  echo "$base/$asset"
  exit 0
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

echo "Downloading $asset"
curl -fsSL -o "$tmp/$asset" "$base/$asset" || fail "download failed: $base/$asset"
curl -fsSL -o "$tmp/checksums.txt" "$base/checksums.txt" || fail "download failed: $base/checksums.txt"

expected="$(grep " $asset\$" "$tmp/checksums.txt" | cut -d' ' -f1)"
[ -n "$expected" ] || fail "no checksum listed for $asset"
if command -v sha256sum >/dev/null 2>&1; then
  actual="$(sha256sum "$tmp/$asset" | cut -d' ' -f1)"
else
  actual="$(shasum -a 256 "$tmp/$asset" | cut -d' ' -f1)"
fi
[ "$expected" = "$actual" ] || fail "checksum mismatch for $asset. Nothing was installed."

tar -xzf "$tmp/$asset" -C "$tmp"
[ -f "$tmp/nearhost" ] || fail "archive did not contain a nearhost binary"

dest="${NEARHOST_INSTALL_DIR:-}"
if [ -z "$dest" ]; then
  if [ -w /usr/local/bin ]; then
    dest="/usr/local/bin"
  else
    dest="$HOME/.local/bin"
  fi
fi
mkdir -p "$dest"
install -m 755 "$tmp/nearhost" "$dest/nearhost"
echo "installed nearhost $version to $dest/nearhost"

case ":$PATH:" in
  *":$dest:"*) ;;
  *) echo "Note: $dest is not on your PATH." ;;
esac

if [ "$os" = "linux" ] && [ "${NEARHOST_SKIP_SETCAP:-}" != "1" ] && command -v setcap >/dev/null 2>&1; then
  if [ -t 0 ]; then
    printf 'Allow nearhost to bind ports 80 and 443 without sudo? [y/N] '
    read -r answer || answer=n
    case "$answer" in
      y | Y) sudo setcap cap_net_bind_service=+ep "$dest/nearhost" && echo "capability set" || echo "setcap failed; run it later: sudo setcap cap_net_bind_service=+ep $dest/nearhost" ;;
      *) echo "Skipped. Run later: sudo setcap cap_net_bind_service=+ep $dest/nearhost" ;;
    esac
  else
    echo "To bind ports 80 and 443 without sudo, run: sudo setcap cap_net_bind_service=+ep $dest/nearhost"
  fi
fi
