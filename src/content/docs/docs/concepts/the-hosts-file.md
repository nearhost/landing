---
title: The hosts file
description: How Nearhost keeps one delimited block in /etc/hosts to resolve project names.
sidebar:
  order: 7
---

`.test` is a reserved top-level domain that is never public, so Nearhost resolves aliases through `/etc/hosts` and not through DNS.

## The owned block

Nearhost owns one block and touches nothing else in the file:

```text
# nearhost:start
127.0.0.1 myapp.test
127.0.0.1 other.test
# nearhost:end
```

The block always lists `.test` names, running or not, sorted. Any other [main name](/docs/reference/config/#main-name) is listed only while its project is enabled, and only if DNS does not already resolve it to loopback addresses alone. Each enabled project's exact web hosts are listed too, under the same DNS rule for names that do not end in `.test`. `localhost` is never listed, because your system already maps it to loopback and Nearhost leaves that mapping alone. Wildcard patterns are never listed either, because a hosts file cannot express them: a pattern's names need DNS that sends them to 127.0.0.1, and `nearhost doctor` reports any that do not resolve. With no projects, the block is removed rather than left empty.

## How changes are applied

Each time a project starts, Nearhost works out the block the file should have. If the file already has it, nothing happens. If not, Nearhost runs itself as root to rewrite the block:

```sh
sudo nearhost hosts apply --file /etc/hosts
```

with the aliases on its standard input, one per line. Only one project's start asks at a time.

In the interface, the password is asked for in a box, and `sudo` remembers it for a few minutes. Where `sudo` asks every time, Nearhost hands over to the terminal for it. See [First run](/docs/getting-started/first-run/#the-password-box). `nearhost up` asks in the terminal.

The rewrite changes only the content between the markers, and adds the block at the end of the file if it is absent. It writes a new file and renames it into place, keeping the file's permissions, and on Linux its SELinux label and access lists.

If you cancel the password, the project stays stopped, and Home's `hosts` row shows which aliases are missing. Start the project again to retry.

## Managing it yourself

Run Nearhost with `--no-hosts` to leave `/etc/hosts` alone, for example when you add the aliases yourself. `nearhost doctor` reports whether the block has every alias.

## Removing it

Nothing is removed when Nearhost quits. To remove the block, which asks for your password through `sudo`:

```sh
nearhost hosts clean
```
