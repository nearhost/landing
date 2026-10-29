# The hosts file

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-101/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-101/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-101/docs/getting-started/install.md.

How Nearhost keeps one delimited block in /etc/hosts to resolve project names.

`.test` is a reserved top-level domain that is never public, so Nearhost resolves aliases through `/etc/hosts` and not through DNS.

## The owned block

Nearhost owns one block and touches nothing else in the file:

```text
# nearhost:start
127.0.0.1 myapp.test
::1 myapp.test
127.0.0.1 other.test
::1 other.test
# nearhost:end
```

Each name has a `127.0.0.1` line and a `::1` line, so a browser that tries IPv6 first still reaches Nearhost. Nearhost 0.7 and earlier wrote only the `127.0.0.1` line. The block always lists `.test` names, running or not, sorted. Any other [main name](https://nearhost.dev/pr-preview/pr-101/docs/reference/config.md#main-name) is listed only while its project is enabled, and only if DNS does not already resolve it to loopback addresses alone. Each enabled project's exact web hosts are listed too, under the same DNS rule for names that do not end in `.test`. `localhost` is never listed, because your system already maps it to loopback and Nearhost leaves that mapping alone. If the machine's nameserver runs on this machine, as systemd-resolved's does on Linux, Nearhost cannot tell what DNS would say, because that nameserver reads the hosts file too. It keeps the name in the block, so the entry stays where it is. Nearhost 0.7 and earlier dropped it. Wildcard patterns are never listed either, because a hosts file cannot express them: a pattern's names need DNS that sends them to 127.0.0.1, and `nearhost doctor` reports any that do not resolve. With no projects, the block is removed rather than left empty.

## How changes are applied

Each time a project starts, Nearhost works out the block the file should have. If the file already has it, nothing happens. If not, Nearhost runs itself as root to rewrite the block:

```sh
sudo nearhost hosts apply --file /etc/hosts
```

with the aliases on its standard input, one per line. The command is an internal step, so it does not appear in `nearhost --help`. Only one project's start asks at a time.

In the interface, the password is asked for in a box, and `sudo` remembers it for a few minutes. Where `sudo` asks every time, Nearhost hands over to the terminal for it. See [First run](https://nearhost.dev/pr-preview/pr-101/docs/getting-started/first-run.md#the-password-box). `nearhost up` asks in the terminal.

From Nearhost 0.8.0, Nearhost runs `sudo` from `/usr/bin`, `/bin`, `/usr/local/bin` or `/run/wrappers/bin`, and only a copy owned by root, never one found on your `PATH`.

The rewrite changes only the content between the markers, and adds the block at the end of the file if it is absent. It writes a new file and renames it into place, keeping the file's permissions, and on Linux its SELinux label and access lists.

If you cancel the password, the project stays stopped, and Home's `hosts` row shows which aliases are missing. Start the project again to retry.

## Managing it yourself

Run Nearhost with `--no-hosts` to leave `/etc/hosts` alone, for example when you add the aliases yourself. `nearhost doctor` reports whether the block has every alias. A block written by Nearhost 0.7 or earlier has only the `127.0.0.1` lines. Doctor warns about that, as the block "has no IPv6 (::1) entries", and does not fail. `nearhost up` rewrites it with the `::1` lines.

## Removing it

Nothing is removed when Nearhost quits. To remove the block, which asks for your password through `sudo`:

```sh
nearhost hosts clean
```
