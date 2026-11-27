# Browser previews from a server

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-136/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-136/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-136/docs/getting-started/install.md.

Let a coding agent on a server open its dev server's preview in your laptop's browser, after you allow it in Nearhost.

With the [`nearhost` skill installed](https://nearhost.dev/pr-preview/pr-136/docs/coding-agents.md#install-the-skill), an agent on a server can start a dev server, but you cannot see it in your browser until its port is forwarded to your laptop. With a passthrough, the agent asks Nearhost to forward that one port for the rest of the session, and you approve it first. The preview then opens on your laptop. It works for any HTTP dev server, whatever it is built with, as long as the page loads everything from that one port. Needs Nearhost 0.10.0 or later; an older Nearhost answers without passthrough, and the agent tells you to update it.

1. The agent asks for a port, and Nearhost opens a prompt over the interface, or, with no interface open, waits for your answer on its page, at a link the agent prints: `Claude Code on mini wants to open port 5173 on this laptop (browser preview).` If that port is in use on the laptop, the prompt says so and that it will open on another port; the agent reports the laptop URL once it opens.
2. Answer the prompt. See [Prompts and Always allow](https://nearhost.dev/pr-preview/pr-136/docs/coding-agents/prompts-and-always-allow.md#the-prompt) for the keys, and [Always allow](https://nearhost.dev/pr-preview/pr-136/docs/coding-agents/prompts-and-always-allow.md#always-allow) to stop being asked. If you allow it and the port cannot be opened, the prompt shows why, and the agent is told it failed rather than that you refused, so it passes the reason on. If the port opens but Always allow cannot be saved, the passthrough stays open and the log says Always allow was not saved. If the request has ended by then, because it expired or the agent's session ended, pressing `y` or `A` tells you so; `n` or `esc` closes the prompt.
3. Once you allow it, Nearhost forwards the port and the agent gives you the laptop URL. Asking again for a port that is already open, from the same agent session, returns the same passthrough without a second prompt. A port that a running project already forwards is answered at once, with no prompt.

A server can have at most 16 passthroughs open or opening at once, with or without Always allow. The next request is refused with `16 passthroughs are open for this server; close one first`, and the agent passes that on rather than asking again. A prompt you allow after the limit is reached ends with the same reason. Close a passthrough to make room.

## See what is open

The `passthroughs` row at the bottom of the sidebar shows `● 2` while two are open, and a dim `none` when none are. It stays in place while the list above it scrolls. Select it to list every open passthrough across all your servers:

```text
passthroughs                                       2 open

▌ http://localhost:7480   preflash demo
    from leto, port 7480 · Claude Code · 12m

  http://localhost:5174   storybook
    from apollo, port 6006 · Codex · 2h
```

Each row starts with the address to open on your laptop, then the agent's label. The dim line under it says which server the passthrough came from, that server's port, which agent asked and how long ago. Rows are in the order of your servers, `local` first, then by port. When there are more than fit, they scroll with the selection, and a `+N more` line says how many are hidden above or below.

Press `tab` to move into the rows, then:

| Key      | Action                                 |
| -------- | -------------------------------------- |
| `↑`, `↓` | Choose a passthrough. `k` and `j` too. |
| `o`      | Open its address in your browser.      |
| `y`      | Copy its address.                      |
| `x`      | Close it at once.                      |
| `esc`    | Go back to the sidebar.                |

With none open, the panel says `No ports are open for agents. When an agent asks to open one, Nearhost asks you first.` A server's panel shows only a line such as `open  1 passthrough, 2 documents`, and Home has no line for them. While anything is open, Nearhost shows this layout instead of the first-run screen, so the row is there to find.

Nearhost lists the passthroughs it opened. A tunnel an agent or you made with `ssh -L` is invisible to it.

## When the app runs on another machine

Sometimes an agent works on one machine while the app runs on another it reaches over SSH. The skill then asks for the passthrough on the machine the app runs on, with `--on <host>`: `passthrough <port> --on <host>`, and the same option on `passthrough-wait` and `passthrough-close`. Nothing needs installing on that host. The passthrough comes from that server, and Nearhost lists it under that server's name, so the panel shows where the app is. Always allow works there as it does for any server, and the token is kept on that host.

If no Nearhost reaches that machine, the skill falls back to forwarding the port itself with `ssh -L`, opens the passthrough from the machine it is on, and puts where the app runs in the label, for example `preflash on apollo`. The passthrough then lists the agent's own machine as its server, and the label says where the app is. If SSH cannot reach the host at all, the agent tells you and stops, because forwarding the port itself would fail the same way.

A session can open passthroughs on several machines. When the session ends, Claude Code's `SessionEnd` hook closes all of them, within about 2.5 seconds. One it cannot close in time, because that host is unreachable, stays open until Nearhost drops that server's connection or you close it with `x` in the `passthroughs` panel. The same option works from `nearhost.ps1` on Windows; the host it runs on must be a Linux or macOS server.

## When a passthrough ends

A passthrough ends when any of these happens:

- the session ends, which Claude Code's `SessionEnd` hook reports;
- you disconnect the server in Nearhost, remove it, or its connection fails (for example, authentication);
- the server has been away for 10 minutes in a row;
- the forwarded port stops answering for 5 minutes, checked every 30 seconds while the server is connected;
- you close it, or the background Nearhost stops (`nearhost stop`, or a restart by `nearhost update`). Quitting the interface alone leaves it open while the background Nearhost keeps running.

The `SessionEnd` hook ships with the Claude Code plugin, so it runs only for plugin installs. With the skill installed through the skills CLI, or in another agent, the other conditions apply. If the laptop port was taken by something else while the server was away, that passthrough closes when the server comes back. If closing a passthrough's forward fails, Nearhost keeps its laptop port and tries again on each check until it closes.

## Without Nearhost connected

When Nearhost is not connected to the server, the agent cannot ask for a passthrough. It tells you to select the server in Nearhost and press `c`, then ask again, or to forward the port yourself from the laptop. Adding `-o ExitOnForwardFailure=yes` to the command it gives makes `ssh` stop with an error when the laptop port is already taken, rather than stay connected without the forward:

```sh
ssh -N -o ExitOnForwardFailure=yes -L <port>:localhost:<port> <server>
```
