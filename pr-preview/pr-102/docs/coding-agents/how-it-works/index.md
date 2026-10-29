# How agents reach Nearhost

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-102/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-102/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-102/docs/getting-started/install.md.

The socket a coding agent reaches Nearhost on, how Nearhost forwards it to each server, and the agent API.

This page explains the socket an agent talks to Nearhost on, and the calls it makes.

Nearhost listens on `~/.nearhost/<id>.sock` on your laptop, where `<id>` is six letters and digits made when Nearhost first runs and kept in `~/.config/nearhost/id` with a fingerprint of the machine. A config directory copied to another machine gets a new id there, so two laptops never share a socket. On each server it is connected to, it forwards a socket of the same name over its own SSH connection:

```sh
ssh -S <sock> -O forward -R <home on the server>/.nearhost/<id>.sock:<socket on the laptop> -- <host>
```

A request is answered for the machine its socket belongs to, so an agent on `mini` sees and proposes only projects on `mini`. sshd creates the socket readable by your account only.

A socket path can be at most 103 bytes on macOS and 107 on Linux. With a home directory long enough to pass that, agents can't reach Nearhost. From Nearhost 0.8.0, its log says `socket path is too long`.

- **The one change on a server.** Nearhost creates `~/.nearhost` there, private to your account, and removes its own socket from an earlier run before forwarding again. sshd leaves the socket behind when the connection ends; the skill skips sockets that do not answer.
- **Two laptops on one account.** Each install has its own id and socket, so both work. When more than one answers, the agent asks which laptop you mean.
- **A server with no tunnel.** The forward exists while Nearhost is connected to the server, which is from when one of its projects starts, or when you select the server and press `c`. Otherwise the agent says to start Nearhost and connect the server, or gives the `nearhost add --server` command to run on the laptop for a server Nearhost does not know yet.
- **A server that is this machine.** A server whose home is the laptop's own, such as `ssh_host: localhost` on your account, gets no forward: agents there already reach Nearhost on the laptop's socket. Nearhost tells this from another machine whose home has the same path, such as a second Mac with the same user name, by checking whether the server sees a file it has just made on the laptop. That machine gets its forward like any other.

To use one socket explicitly, set `NEARHOST_SOCKET` to its path where the agent runs.

## Agent API

The skill's script talks to Nearhost over that socket, with `curl --unix-socket`. Nearhost answers JSON for the machine the socket belongs to. These calls are the ones the doctor uses:

- `GET /v1` says which API this is. Its `capabilities` list names the calls added since the first release of API 1: `doctor`, `reload`, `passthrough` and `documents`. An older Nearhost leaves them out, and the skill tells you to update it. When passthroughs are available it also gives `id`, the laptop's install id, which the skill uses to keep a token per laptop.
- `GET /v1/doctor?path=…` returns `project` and `findings` for the project holding the absolute path, in the shape that [`nearhost doctor --json`](https://nearhost.dev/pr-preview/pr-102/docs/reference/cli.md#json-output) gives its findings. For a project already in Nearhost, it first reads the project's `.nearhostrc` again, as a reload does: a change that needs no approval is applied, restarting the project if it runs under `nearhost up`, and one that needs approval waits in Nearhost. For a directory that is not in Nearhost yet, `project` is `null`, each finding's `project` is empty, and the findings are for the project as it would be added.
- `POST /v1/projects/reload`, with `{"path": "/abs/dir"}`, asks Nearhost to read the `.nearhostrc` of the project holding the path again. The project must be added first. It answers `applied` when nothing needs approval, or `pending` with an `id` the agent waits on, as it does for a proposal, while you decide. A change you declined stays declined until the file changes or Nearhost restarts.
