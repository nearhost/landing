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

main() {
  curl_opts="--proto =https --tlsv1.2"
  need curl
  need tar
  need awk

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
    # shellcheck disable=SC2086 # curl_opts is a fixed, space-separated flag list
    version="$(curl $curl_opts -fsSLI -o /dev/null -w '%{url_effective}' "https://github.com/$REPO/releases/latest" | sed -n 's#.*/tag/##p')"
    case "$version" in
      v[0-9]*) ;;
      *) fail "could not determine the latest release. Nearhost has no published release yet, or GitHub could not be reached." ;;
    esac
  fi

  base="${NEARHOST_BASE_URL:-https://github.com/$REPO/releases/download/$version}"
  dl_opts=""
  case "$base" in
    https://*) dl_opts="$curl_opts" ;;
  esac
  asset="nearhost_${version#v}_${os}_${arch}.tar.gz"

  if [ "${NEARHOST_INSTALL_DRY_RUN:-}" = "1" ]; then
    echo "$base/$asset"
    exit 0
  fi

  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT

  echo "Downloading $asset"
  # shellcheck disable=SC2086 # dl_opts is empty or a fixed flag list
  curl $dl_opts -fsSL -o "$tmp/$asset" "$base/$asset" || fail "download failed: $base/$asset"
  # shellcheck disable=SC2086
  curl $dl_opts -fsSL -o "$tmp/checksums.txt" "$base/checksums.txt" || fail "download failed: $base/checksums.txt"

  expected="$(awk -v a="$asset" '$2 == a { print $1 }' "$tmp/checksums.txt")"
  [ -n "$expected" ] || fail "no checksum listed for $asset"
  command -v sha256sum >/dev/null 2>&1 || command -v shasum >/dev/null 2>&1 || fail "sha256sum or shasum is required"
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
}

main "$@"
