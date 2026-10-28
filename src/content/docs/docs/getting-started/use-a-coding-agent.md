---
title: Use a coding agent
description: Let Claude Code or Codex add the project it is working in, on this machine or on a server, for you to review.
sidebar:
  order: 5
---

A coding agent can ask Nearhost to add the project it is working in, can read whether a project is served and where, and can find and fix what stops it being served. It works the same when the agent runs on your laptop or on a server Nearhost is connected to, for example in an SSH session. The agent proposes and you decide: every add opens the add form in Nearhost, filled in, for you to save or dismiss.

## Install the skill

The `nearhost` skill installs with the [skills](https://skills.sh) CLI, which puts it where your agents look for skills: Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot and many more.

```sh
npx skills add nearhost/nearhost -g
```

`-g` installs it for your user rather than into the current project. Add `-a codex`, `-a cursor` and so on to choose the agents; without it, the CLI asks. Install it where the agent runs: on the laptop, on the server, or both.

In Claude Code you can install it as a plugin instead:

```text
/plugin install nearhost --marketplace nearhost/nearhost
```

The skill needs `sh` and `curl`, and nothing else. Nothing is installed with it.

## Add a project

In the project's directory, run `/nearhost add` in Claude Code, or `$nearhost add` in Codex. Asking in your own words, such as "serve this with Nearhost", works too.

1. The agent proposes the project's directory to Nearhost, with the dev server's port when the project's files say it plainly.
2. Nearhost notifies the terminal it runs in: `Agent on mini wants to add /home/dev/code/myapp`. Most terminals show it only when Nearhost is not the window or tab in front.
3. The add form opens over the view with the server and path filled in, and the line `Proposed by an agent on mini`. Nearhost reads the project as it does for any add, and you choose the routes and the name as usual.
4. Save it, and the agent reports `https://myapp.test`. Press `esc` on the path, and the agent is told you declined.
5. The agent waits up to 30 seconds for the project to start, then runs the doctor on it and offers to work through any errors or warnings it finds. See [Fix a project](#fix-a-project).

If a form is already open, the proposal waits, and Home shows `1 proposal waiting · p to review`. It opens when the form closes, or when you press `p`. An agent waits 10 minutes for an answer.

`/nearhost status` reports the project holding the current directory: its address, every address it serves in `urls`, its state and any error. A project with several web routes or hosts has one URL for each, so you can see where each service lives. `/nearhost status --all` reports every project on the machine the agent runs on.

Proposals need the full-screen interface. Under `nearhost up`, an agent can read the status but is told to open `nearhost` to propose.

## Fix a project

When a project is not served as you expect, run `/nearhost doctor` in its directory, or `$nearhost doctor` in Codex. The agent asks Nearhost to run the same [project checks](/docs/reference/cli/#project-checks) as `nearhost doctor` on this project, and works through the errors, then the warnings. Unlike `nearhost doctor`, this first reads the project's `.nearhostrc` again, as described under [Agent API](#agent-api). Each finding's fix has a kind, and the agent handles each kind in its own way:

- **`project`.** The agent shows you the change, the snippet and where it goes, and makes it in the project's files once you agree. When the setup is more than Nearhost can work out for itself, such as several hosts, a pattern, `localhost` or callbacks from Docker, it writes or edits the project's [`.nearhostrc`](/docs/reference/nearhostrc/).
- **`nearhost`.** Something you do in Nearhost, such as adding a port in the edit form. The agent passes it on, or offers to write the port or host into `.nearhostrc` instead.
- **`manual`.** Something only you can do, such as a DNS record. The agent tells you what it says.

After editing `.nearhostrc`, and for `nearhostrc.pending` and `nearhostrc.not-applied`, the agent asks Nearhost to read the file again. A change that needs no approval applies at once. One that needs it waits, and the agent tells you to approve it in Nearhost, then waits for your answer. See [Approval](/docs/reference/nearhostrc/#approval).

Then it runs the doctor again, and stops when nothing is left that it can fix. It never edits Nearhost's `config.yaml` itself; Nearhost saves a change there when it applies one. Approving a change needs the full-screen interface: under `nearhost up`, the agent tells you to open `nearhost`.

## How the agent reaches Nearhost

Nearhost listens on `~/.nearhost/<id>.sock` on your laptop, where `<id>` is six letters and digits made when Nearhost first runs and kept in `~/.config/nearhost/id`. A config directory copied to another machine gets a new id there, so two laptops never share a socket. On each server it is connected to, it forwards a socket of the same name over its own SSH connection:

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

## Browser previews from a server

An agent on a server can start a dev server, but you cannot see it in your browser until its port is forwarded to your laptop. With a passthrough, the agent asks Nearhost to forward that one port for the rest of the session, and you approve it first. The preview then opens on your laptop. It works for any HTTP dev server, whatever it is built with. Needs Nearhost 0.10.0 or later; an older Nearhost answers without passthrough, and the agent tells you to update it.

1. The agent asks for a port, and Nearhost opens a prompt over the interface: `Claude Code on mini wants to open port 5173 on this laptop (browser preview).` If that port is in use on the laptop, the prompt says so and that it will open on another port; the agent reports the laptop URL once it opens. The prompt queues with proposals, and Home shows the same hint.
2. Press `y` to allow it, `n` to refuse, or `a` for Always allow. `esc` counts as No. A prompt that waits 10 minutes expires. If you allow it and the port cannot be opened, the prompt shows why, and the agent is told it failed rather than that you refused, so it passes the reason on. If the port opens but Always allow cannot be saved, the passthrough stays open and the log says Always allow was not saved. If the request has ended by then, because it expired or the agent's session ended, pressing `y` or `a` tells you so; `n` or `esc` closes the prompt.
3. Once you allow it, Nearhost forwards the port and the agent gives you the laptop URL. Asking again for a port that is already open, from the same agent session, returns the same passthrough without a second prompt. A port that a running project already forwards is answered at once, with no prompt.

Always allow covers one tool on one server: Claude Code on `mini`, say, but not Claude Code on another server, and not another tool on `mini`. Only Claude Code is offered it. Codex documents no variable that identifies it, so Codex and every other agent are shown as `An agent`, are always prompted and are never offered Always allow.

On a server's panel, press `tab` to move to the server's open passthroughs and Always allowed rows, which are shown only when there are any. When there are more than fit, they scroll with the selection, and a `+N more` line says how many are hidden above or below. Use `j` and `k` or the arrow keys to move, and `tab` or `esc` to leave. Press `x` on a passthrough to close it at once. Press `x` on an Always allowed row to revoke it; Nearhost asks you to confirm first. Home shows a `passthroughs` count while any are open.

### What the token protects

When you choose Always allow, Nearhost makes a token for that tool on that server. The skill keeps the token on the server, in `${XDG_STATE_HOME:-~/.local/state}/nearhost/tokens/<laptop id>/<requester>`, readable by your account only. The skill sends it with later requests, so Nearhost does not ask again. The laptop keeps only a SHA-256 hash of the token, in `grants.json` beside the install id in `~/.config/nearhost` (or under `XDG_CONFIG_HOME`).

The token stops a different tool from borrowing an approval, and it stops anything from using one after you revoke it. It does not protect against anything else running as your account on the server: such a process can read the token file and use the approval. Treat Always allow as trust in everything that runs as you on that server. A wrong or revoked token gets a `401`; the skill drops it and asks again, so you are prompted.

Removing a server from Nearhost, or renaming it, revokes its Always allow grants, so a server added later under the same name starts with none. Nearhost does this when it next applies the config or starts, and the log says how many it removed. It does this only for its default config file, not one given with `--config`, and never while that file is missing, so a config file that disappears for a moment does not cost you your grants.

If `grants.json` cannot be read, Nearhost still serves coding agents but turns passthrough off, and says which file it could not read. Fix or remove the file, then restart Nearhost.

### When a passthrough ends

A passthrough ends when any of these happens:

- the session ends, which Claude Code's `SessionEnd` hook reports;
- you disconnect the server in Nearhost, remove it, or its connection fails (for example, authentication);
- the server has been away for 10 minutes in a row;
- the forwarded port stops answering for 5 minutes, checked every 30 seconds while the server is connected;
- you close it, or Nearhost quits.

The `SessionEnd` hook ships with the Claude Code plugin, so it runs only for plugin installs. With the skill installed through the skills CLI, or in another agent, the other conditions apply. If the laptop port was taken by something else while the server was away, that passthrough closes when the server comes back. If closing a passthrough's forward fails, Nearhost keeps its laptop port and tries again on each check until it closes.

### Without Nearhost connected

When Nearhost is not connected to the server, the agent cannot ask for a passthrough. It tells you to select the server in Nearhost and press `c`, then ask again, or to forward the port yourself from the laptop. Adding `-o ExitOnForwardFailure=yes` to the command it gives makes `ssh` stop with an error when the laptop port is already taken, rather than stay connected without the forward:

```sh
ssh -N -o ExitOnForwardFailure=yes -L <port>:localhost:<port> <server>
```

## Documents from coding agents

When an agent writes a plan, spec, report or HTML mockup for you to read, it can ask Nearhost to show it. Nearhost serves the document at an address on your laptop and opens it in your browser. This works for an agent on the laptop and for one on a server Nearhost is connected to, so you no longer need a second terminal to read a path on a server. Markdown is shown as a page; HTML is served as written. Agents offer this only for documents they wrote for you, never for code or config files. You can also ask directly with `/nearhost open <path>`. It needs a Nearhost version that ships documents; an older one answers without them, and the agent tells you to update it.

1. The agent asks, and Nearhost opens a prompt over the interface: `Claude Code on mini wants to show plans/2026-10-28-x.md`, with a line saying which folder Nearhost will serve. The prompt queues with proposals and passthroughs, and Home shows the same hint.
2. Press `y` to allow it, `n` to refuse, or `a` for Always allow. `esc` counts as No. A prompt that waits 10 minutes expires. If you refuse, the agent does not offer that folder again in the session and only gives you the path.
3. Once you allow it, your browser opens the document and the agent gives you the address. It looks like `https://localhost:<web port>/d/<random>/plans/2026-10-28-x.md`, where `<web port>` is Nearhost's web port, and `<random>` is a long random string that other pages cannot guess.

### What is served

Nearhost serves the document's git repository, so its images, stylesheets and linked documents work. A document that is not in a repository serves its own folder. A document directly in your home folder, or in `/`, is refused with `save the document in a project or a folder of its own`. Nearhost never serves dotfiles or the contents of dot folders inside that folder, and never follows a link out of it. A second document in the same folder reuses the address without a prompt for the agent you approved, and prompts any other.

Nearhost keeps no copies. Each time the page loads, it reads the file again, from the laptop or over the server's SSH connection, so reloading shows the current file. A file that has moved or gone shows as missing, never as an old version. A server that is not connected shows a page saying so; select it in Nearhost and press `c`.

### Documents cannot reach your other pages

Every file Nearhost serves from a document's folder is sandboxed by the browser. Its scripts run, but they cannot read other pages on `localhost`, your projects' cookies or storage, or other documents. Rendered markdown runs no scripts at all. Pages also send no referrer, so the address does not leak to sites a document links to.

### Always allow

Always allow covers one tool on one server, as for previews: Claude Code on `mini`, say, and not another tool or server. Only Claude Code is offered it; other agents are shown as `An agent` and are always prompted. It is kept separately from the preview approval, so revoking one leaves the other working. The skill keeps the token on the server in a file ending in `.documents`, beside the preview token, and Nearhost keeps a hash in `grants.json`. The note under [What the token protects](#what-the-token-protects) applies: anything that runs as you on that server can use the approval.

With Always allow, the document opens in your browser at once, and Nearhost shows `Claude Code on mini opened plans/2026-10-28-x.md` in the status line. On a server's panel, press `tab` to reach its `documents` and `always allowed` sections. Press `x` on an always allowed row to revoke it, after a confirm. Revoking leaves open documents in place.

### When a served folder goes away

Nearhost lists served folders on each server's panel, and Home shows a count in its `agents` line. A folder stays served until:

- Nearhost quits, as nothing is saved across restarts;
- you press `x` on it in the server's panel and confirm;
- you remove the server from Nearhost, or rename it.

Disconnecting a server does not remove its folders. Their pages say the server is not connected until it reconnects. The agent's session ending does not remove them either, so you can read yesterday's plan again while Nearhost runs. Home's web page also lists the folders served since Nearhost started, with links to each document.

If a project holds `localhost` and you started Nearhost with `--web-port 0`, there is no page to serve from, and the agent is told so.

## Agent API

The skill's script talks to Nearhost over that socket, with `curl --unix-socket`. Nearhost answers JSON for the machine the socket belongs to. These calls are the ones the doctor uses:

- `GET /v1` says which API this is. Its `capabilities` list names the calls added since the first release of API 1: `doctor`, `reload` and `passthrough`. An older Nearhost leaves them out, and the skill tells you to update it. When passthroughs are available it also gives `id`, the laptop's install id, which the skill uses to keep a token per laptop.
- `GET /v1/doctor?path=…` returns `project` and `findings` for the project holding the absolute path, in the shape that [`nearhost doctor --json`](/docs/reference/cli/#json-output) gives its findings. For a project already in Nearhost, it first reads the project's `.nearhostrc` again, as a reload does: a change that needs no approval is applied, restarting the project if it runs under `nearhost up`, and one that needs approval waits in Nearhost. For a directory that is not in Nearhost yet, `project` is `null`, each finding's `project` is empty, and the findings are for the project as it would be added.
- `POST /v1/projects/reload`, with `{"path": "/abs/dir"}`, asks Nearhost to read the `.nearhostrc` of the project holding the path again. The project must be added first. It answers `applied` when nothing needs approval, or `pending` with an `id` the agent waits on, as it does for a proposal, while you decide. A change you declined stays declined until the file changes or Nearhost restarts.

## When agents cannot reach Nearhost

**The server refuses the forward.** Its sshd has `AllowStreamLocalForwarding no`. The server's panel shows `agents unavailable` with sshd's message, and so does `nearhost doctor`. Set `AllowStreamLocalForwarding yes` in the server's `sshd_config` and press `r` on the server to reconnect. Projects serve either way, and `r` on Home leaves such a server connected.

**The agent's sandbox blocks the socket.** Agents that run commands in a sandbox block Unix sockets by default, so the skill's script cannot reach `~/.nearhost`. Allow only what Nearhost needs.

- **Approve the one command.** Claude Code and Codex ask before they run a command the sandbox blocks outside it. Approving that for the skill's script opens nothing else, so it is the narrowest choice.
- **Claude Code on macOS** can allow the one socket by its full path, which `ls ~/.nearhost` shows, in `~/.claude/settings.json` where the agent runs:

  ```json
  { "sandbox": { "network": { "allowUnixSockets": ["/home/dev/.nearhost/k3f9q2.sock"] } } }
  ```

Two settings also work, but open far more than Nearhost:

- **Claude Code on Linux** cannot allow one socket, only every one, with `"allowAllUnixSockets": true`.
- **Codex's** `network_access = true` under `[sandbox_workspace_write]` gives its sandbox the network and every socket.

Every socket includes ones like Docker's `/var/run/docker.sock`, and a command that reaches Docker's socket can take over the machine. Use these settings only if that is acceptable where the agent runs; otherwise approve the command when the agent asks.

## Turn notifications off

Add this to the [config](/docs/reference/config/):

```yaml
notifications: false
```
