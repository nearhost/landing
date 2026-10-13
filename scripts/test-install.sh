#!/bin/sh
# Exercises public/install.sh without touching the network or the system.
set -eu

script="$(cd "$(dirname "$0")/.." && pwd)/public/install.sh"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
fails=0

fake_uname() {
  mkdir -p "$work/bin"
  # shellcheck disable=SC2016 # the single quotes are intentional: $1 expands inside the fake uname
  printf '#!/bin/sh\ncase "$1" in -s) echo "%s";; -m) echo "%s";; esac\n' "$1" "$2" > "$work/bin/uname"
  chmod +x "$work/bin/uname"
}

expect() {
  name="$1"; want_status="$2"; want_text="$3"; shift 3
  set +e
  out="$("$@" 2>&1)"
  status=$?
  set -e
  if [ "$status" -ne "$want_status" ] || ! printf '%s' "$out" | grep -q "$want_text"; then
    echo "FAIL $name (status $status): $out"
    fails=$((fails + 1))
  else
    echo "ok   $name"
  fi
}

# 1. Unsupported architecture refuses with a clear message.
fake_uname Linux mips
expect "unsupported arch" 1 "unsupported architecture" \
  env PATH="$work/bin:$PATH" sh "$script"

# 2. Unsupported OS refuses.
fake_uname FreeBSD amd64
expect "unsupported os" 1 "unsupported OS" \
  env PATH="$work/bin:$PATH" sh "$script"

# 3. Dry run resolves the asset URL from version, os and arch.
fake_uname Darwin arm64
expect "dry run url" 0 "https://github.com/nearhost/nearhost/releases/download/v0.1.0/nearhost_0.1.0_darwin_arm64.tar.gz" \
  env PATH="$work/bin:$PATH" NEARHOST_VERSION=v0.1.0 NEARHOST_INSTALL_DRY_RUN=1 sh "$script"

# 4. A checksum mismatch refuses and installs nothing.
fake_uname Linux x86_64
mkdir -p "$work/release" "$work/payload" "$work/dest"
printf '#!/bin/sh\necho fake\n' > "$work/payload/nearhost"
tar -czf "$work/release/nearhost_0.1.0_linux_amd64.tar.gz" -C "$work/payload" nearhost
echo "0000000000000000000000000000000000000000000000000000000000000000  nearhost_0.1.0_linux_amd64.tar.gz" > "$work/release/checksums.txt"
expect "checksum mismatch" 1 "checksum mismatch" \
  env PATH="$work/bin:$PATH" NEARHOST_VERSION=v0.1.0 NEARHOST_BASE_URL="file://$work/release" NEARHOST_INSTALL_DIR="$work/dest" sh "$script"
if [ -e "$work/dest/nearhost" ]; then echo "FAIL checksum mismatch left a binary behind"; fails=$((fails + 1)); fi

# 5. A matching checksum installs to the requested directory.
if command -v sha256sum >/dev/null 2>&1; then sum=$(sha256sum "$work/release/nearhost_0.1.0_linux_amd64.tar.gz" | cut -d' ' -f1); else sum=$(shasum -a 256 "$work/release/nearhost_0.1.0_linux_amd64.tar.gz" | cut -d' ' -f1); fi
echo "$sum  nearhost_0.1.0_linux_amd64.tar.gz" > "$work/release/checksums.txt"
expect "install ok" 0 "installed nearhost v0.1.0" \
  env PATH="$work/bin:$PATH" NEARHOST_VERSION=v0.1.0 NEARHOST_BASE_URL="file://$work/release" NEARHOST_INSTALL_DIR="$work/dest" NEARHOST_SKIP_SETCAP=1 sh "$script"
[ -x "$work/dest/nearhost" ] || { echo "FAIL binary not installed"; fails=$((fails + 1)); }

# 6. An unresolvable latest release fails clearly instead of building a bogus asset name.
fake_uname Darwin arm64
printf '#!/bin/sh\necho "https://github.com/nearhost/nearhost/releases"\n' > "$work/bin/curl"
chmod +x "$work/bin/curl"
expect "no release" 1 "could not determine the latest release" \
  env -u NEARHOST_VERSION -u NEARHOST_BASE_URL PATH="$work/bin:$PATH" sh "$script"

[ "$fails" -eq 0 ] || exit 1
echo "all install.sh checks passed"
