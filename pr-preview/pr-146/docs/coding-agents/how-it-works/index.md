# How agents reach Nearhost

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-146/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-146/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-146/docs/getting-started/install.md.

The socket a coding agent reaches Nearhost on, how Nearhost forwards it to each server, and the agent API.

This page explains the socket an agent talks to Nearhost on, and the calls it makes.

Nearhost listens on `~/.nearhost/<id>.sock` on your laptop, where `<id>` is six letters and digits made when Nearhost first runs and kept in `~/.config/nearhost/id` (`%APPDATA%\nearhost\id` on Windows) with a fingerprint of the machine. A config directory copied to another machine gets a new id there, so two laptops never share a socket. On each server it is connected to, it forwards a socket of the same name over its own SSH connection:

```sh
ssh -S <sock> -O forward -R <home on the server>/.nearhost/<id>.sock:<socket on the laptop> -- <host>
```

A request is answered for the machine its socket belongs to, so an agent on `mini` sees and proposes only projects on `mini`. sshd creates the socket readable by your account only.

A socket path can be at most 103 bytes on macOS and 107 on Linux. With a home directory long enough to pass that, agents can't reach Nearhost. From Nearhost 0.8.0, its log says `socket path is too long`.

- **The one change on a server.** Nearhost creates `~/.nearhost` there, private to your account, and removes its own socket from an earlier run before forwarding again. From Nearhost 0.12.0, where the server gives your account a private runtime folder (`/run/user/<uid>`), the socket is made in `nearhost` inside it and `~/.nearhost/<id>.sock` is a link to it, because SELinux on Fedora and its relatives stops sshd making a socket in a home folder. sshd leaves the socket behind when the connection ends; the skill skips sockets that do not answer.
- **Two laptops on one account.** Each install has its own id and socket, so both work. When more than one answers, the agent asks which laptop you mean.
- **A server with no tunnel.** The forward exists while Nearhost is connected to the server, which is from when one of its projects starts, or when you select the server and press `c`. Otherwise the agent says to start Nearhost and connect the server, or gives the `nearhost add --server` command to run on the laptop for a server Nearhost does not know yet.
- **A server that is this machine.** A server whose home is the laptop's own, such as `ssh_host: localhost` on your account, gets no forward: agents there already reach Nearhost on the laptop's socket. Nearhost tells this from another machine whose home has the same path, such as a second Mac with the same user name, by checking whether the server sees a file it has just made on the laptop. That machine gets its forward like any other.

To use one socket explicitly, set `NEARHOST_SOCKET` to its path where the agent runs.

## Windows laptops

On a Windows laptop, Nearhost listens on `~\.nearhost\<id>.sock` as on macOS and Linux. Windows' `ssh.exe` cannot forward a server's socket to a Unix socket on the laptop, so the socket on each server leads to a port on the laptop's `127.0.0.1` instead:

```sh
ssh -N -R <home on the server>/.nearhost/<id>.sock:127.0.0.1:<port> -- <host>
```

Any program on the laptop can connect to that port, so Nearhost answers there only requests that carry a token. It writes the token beside the socket on the server, as `~/.nearhost/<id>.token`, readable only by your account, and makes a new one each time Nearhost starts. The skill's script sends it with curl, which reads it from that file, so it never appears on a command line. Two things follow on the server:

- **curl 7.55 or later.** Older curl cannot read a header from a file, so an agent there cannot reach a Windows laptop.
- **A current skill.** A skill installed before Windows support sends no token, and Nearhost answers `this request has no valid Nearhost token: update the Nearhost skill on this machine`. Run `npx skills add nearhost/nearhost -g` again on the server or, if you installed it as a Claude Code plugin, update the plugin from `/plugin`. See [Install the skill](https://nearhost.dev/pr-preview/pr-146/docs/coding-agents.md#install-the-skill).

On the laptop itself, the skill runs its PowerShell script, which needs only Windows PowerShell 5.1 or PowerShell 7 and the `curl.exe` that Windows ships.

## A passthrough on another machine

An agent can ask for a passthrough on a machine other than its own, with `--on <host>`, where `<host>` is an SSH host the agent's machine reaches. The skill's script runs itself on that host over SSH (`ssh -o BatchMode=yes -o ConnectTimeout=5 -- <host> 'sh -s'`, with the script on standard input), so nothing is installed there. Because the environment does not cross SSH, the script passes the agent's name and session along as arguments. On that host the script finds Nearhost's socket as usual, so the passthrough comes from that server and is listed under it.

The script records every place a session opened a passthrough, as one line per target in the session's marker file. When the session ends, `passthrough-close --session` closes them all at once, over the same `ssh` that opened them. The close gives each SSH connection 2 seconds to connect and stops the whole session close after about 2.5 seconds, inside the hook's 3 second limit. A target that cannot be closed stays open. If SSH itself fails, the script exits with status 2 and says SSH could not reach the host. See [Browser previews](https://nearhost.dev/pr-preview/pr-146/docs/coding-agents/browser-previews.md#when-the-app-runs-on-another-machine).

## Agent API

The skill's script talks to Nearhost over that socket, with `curl --unix-socket`. Nearhost answers JSON for the machine the socket belongs to. These calls are the ones the doctor uses:

- `GET /v1` says which API this is. Its `capabilities` list names the calls added since the first release of API 1: `doctor`, `reload`, `passthrough` and `documents`. An older Nearhost leaves them out, and the skill tells you to update it. When passthroughs are available it also gives `id`, the laptop's install id, which the skill uses to keep a token per laptop.
- `GET /v1/doctor?path=…` returns `project` and `findings` for the project holding the absolute path, in the shape that [`nearhost doctor --json`](https://nearhost.dev/pr-preview/pr-146/docs/reference/cli.md#json-output) gives its findings. For a project already in Nearhost, it first reads the project's `.nearhostrc` again, as a reload does: a change that needs no approval is applied, restarting the project if it runs under `nearhost up`, and one that needs approval waits in Nearhost. For a directory that is not in Nearhost yet, `project` is `null`, each finding's `project` is empty, and the findings are for the project as it would be added.
- `POST /v1/projects/reload`, with `{"path": "/abs/dir"}`, asks Nearhost to read the `.nearhostrc` of the project holding the path again. The project must be added first. It answers `applied` when nothing needs approval, or `pending` with an `id` the agent waits on, as it does for a proposal, while you decide. A change you declined stays declined until the file changes or Nearhost restarts.
- A request that waits for your answer replies `202` with an `id` and, when Nearhost's page is served, an `approve_url` for it. A proposal also carries `advice`, because the page can only decline it. `GET /v1` reports `interface`, whether anyone can answer right now.

### Errors and warnings

An error answers with `Content-Type: application/problem+json`, as [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) defines, and with the status code it has always had. `error` comes first and holds the same text as before, so a skill installed before these fields reads it as it did:

```json
{
  "error": "Nearhost on dev@laptop has no page or window to ask you in; open nearhost there, then ask again.",
  "type": "https://nearhost.dev/docs/reference/errors/#agent.no-reviewer",
  "title": "Nearhost on dev@laptop has no page or window to ask you in; open nearhost there, then ask again.",
  "status": 409,
  "code": "agent.no-reviewer",
  "level": "error"
}
```

`code` is the error's code, and `type` links to its entry in [Errors](https://nearhost.dev/pr-preview/pr-146/docs/reference/errors.md). When the error has them, `detail` says why, `fix` lists the steps, each with its `text` and any `command`, `doctor` is `true` when `nearhost doctor` checks the cause, and `data` holds facts such as a port or a path.

`GET /v1/projects` gives a project with a problem, such as one in `error`, a `problem` beside its `error` text: the same message, with its `code`, `level`, `title` and any `detail` and `fix`. A reply that came with warnings lists them last, under `warnings`, in the same shape. A reply with none has no `warnings` key.
