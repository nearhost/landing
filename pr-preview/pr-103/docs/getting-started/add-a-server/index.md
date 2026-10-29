# Add a server

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-103/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-103/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-103/docs/getting-started/install.md.

Register a remote machine that Nearhost reaches through your existing SSH setup.

A server is a remote machine you can reach with OpenSSH. Nearhost runs your own `ssh`, so your `ssh_config` applies, including `Include`, `Match`, `ProxyJump` and `IdentityAgent`.

The `local` server is this machine. It always exists, needs no configuration, and cannot be removed or renamed.

## Before you start

`ssh <host>` must work without prompting for anything, and the server must allow SFTP, which most do. Nearhost reads project files over SFTP. Check the first part with:

```sh
ssh -o BatchMode=yes -o ConnectTimeout=10 <host> true
```

If it exits 0, Nearhost can connect. If it asks about a host key or a passphrase, answer it in a normal `ssh <host>` session first.

## From the interface

Press `s`. A box titled "Add server" opens over the screen, in three steps.

1. **Host.** The hosts in `~/.ssh/config` that you have not added yet are listed under the field, and typing filters them. Choose one with `↑` and `↓`, or type a host such as `dev@build.lan`. Wildcard hosts are not listed, and neither are hosts in files that `~/.ssh/config` includes, so type those.
2. **Name.** The name shown in the sidebar. It starts as the host without the user, and you can change it. `local` is taken.
3. **Check.** Nearhost connects with your SSH setup and opens SFTP. When that works, the server is saved and selected.

`esc` goes back a step, and from the first step closes the box. Nothing is saved until the check passes.

Adding a project can add a server on the way: choose **New server…** on its first step.

## What Nearhost stores

Only the name and the host, in `~/.config/nearhost/config.yaml`. No keys, passwords or sockets are stored.

```yaml
servers:
  - name: mini
    ssh_host: mini
```

For a port other than 22, give the host an entry in `~/.ssh/config` with a `Port` line and use its alias.

## If the check fails

The box shows OpenSSH's error, followed by what to do: run `ssh <host>` once in a terminal to fix access. That is where OpenSSH handles unknown host keys, `ssh-add` and similar. Fix it there, then press `r` to check again.

## Afterwards

Select the server in the sidebar to see its host, its projects and its log.

| Key | Action                                                           |
| --- | ---------------------------------------------------------------- |
| `r` | Reconnect.                                                       |
| `c` | Drop the connection, or connect it again.                        |
| `e` | Edit the host and name. A new name carries over to its projects. |
| `d` | Remove the server and its projects, after you confirm.           |
| `n` | Add a project on this server.                                    |

From the command line, `nearhost add --server <name>` run at a terminal offers to add a server it does not know yet.

Nothing is installed on the remote machine. Nearhost makes a private `~/.nearhost` folder there and keeps a socket in it, so a coding agent on the server can reach Nearhost. See [How agents reach Nearhost](https://nearhost.dev/pr-preview/pr-103/docs/coding-agents/how-it-works.md). The only file it ever writes to a project is a `.nearhostrc`, and only when you run [`nearhost export`](https://nearhost.dev/pr-preview/pr-103/docs/reference/cli.md#nearhost-export).
