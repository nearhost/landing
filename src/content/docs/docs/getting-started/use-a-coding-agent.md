---
title: Use a coding agent
description: Let Claude Code or Codex add the project it is working in, on this machine or on a server, for you to review.
sidebar:
  order: 5
---

A coding agent can ask Nearhost to add the project it is working in, and can read whether a project is served and where. It works the same when the agent runs on your laptop or on a server Nearhost is connected to, for example in an SSH session. The agent proposes and you decide: every add opens the add form in Nearhost, filled in, for you to save or dismiss.

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

If a form is already open, the proposal waits, and Home shows `1 proposal waiting · p to review`. It opens when the form closes, or when you press `p`. An agent waits 10 minutes for an answer.

`/nearhost status` reports the project holding the current directory: its address, its state and any error.

Proposals need the full-screen interface. Under `nearhost up`, an agent can read the status but is told to open `nearhost` to propose.

## How the agent reaches Nearhost

Nearhost listens on `~/.nearhost/<id>.sock` on your laptop, where `<id>` is six letters and digits made when Nearhost first runs and kept in `~/.config/nearhost/id`. A config directory copied to another machine gets a new id there, so two laptops never share a socket. On each server it is connected to, it forwards a socket of the same name over its own SSH connection:

```sh
ssh -S <sock> -O forward -R <home on the server>/.nearhost/<id>.sock:<socket on the laptop> <host>
```

A request is answered for the machine its socket belongs to, so an agent on `mini` sees and proposes only projects on `mini`. sshd creates the socket readable by your account only.

- **The one change on a server.** Nearhost creates `~/.nearhost` there, private to your account, and removes its own socket from an earlier run before forwarding again. sshd leaves the socket behind when the connection ends; the skill skips sockets that do not answer.
- **Two laptops on one account.** Each install has its own id and socket, so both work. When more than one answers, the agent asks which laptop you mean.
- **A server with no tunnel.** The forward exists while Nearhost is connected to the server, which is from when one of its projects starts, or when you select the server and press `c`. Otherwise the agent says to start Nearhost and connect the server, or gives the `nearhost add --server` command to run on the laptop for a server Nearhost does not know yet.
- **A server that is this machine.** A server whose home is the laptop's own, such as `ssh_host: localhost` on your account, gets no forward: agents there already reach Nearhost on the laptop's socket.

To use one socket explicitly, set `NEARHOST_SOCKET` to its path where the agent runs.

## When agents cannot reach Nearhost

**The server refuses the forward.** Its sshd has `AllowStreamLocalForwarding no`. The server's panel shows `agents unavailable` with sshd's message, and so does `nearhost doctor`. Set `AllowStreamLocalForwarding yes` in the server's `sshd_config` and press `r` on the server to reconnect. Projects serve either way, and `r` on Home leaves such a server connected.

**The agent's sandbox blocks the socket.** An agent that runs commands in a sandbox needs `~/.nearhost/*.sock` allowed, and most block Unix sockets by default. Here is how for two of them.

With Claude Code's sandbox on, allow the socket in `~/.claude/settings.json` where the agent runs. On macOS, name it by its full path, which `ls ~/.nearhost` shows:

```json
{ "sandbox": { "network": { "allowUnixSockets": ["/home/dev/.nearhost/k3f9q2.sock"] } } }
```

On Linux, Claude Code cannot allow one socket, only all of them, with `"allowAllUnixSockets": true` in the same place.

Codex runs commands in a sandbox too. Allow network access for its workspace sandbox in `~/.codex/config.toml`:

```toml
[sandbox_workspace_write]
network_access = true
```

Or approve the command when Codex asks to run it outside the sandbox.

## Turn notifications off

Add this to the [config](/docs/reference/config/):

```yaml
notifications: false
```
