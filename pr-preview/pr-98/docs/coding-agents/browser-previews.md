# Browser previews from a server

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-98/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-98/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-98/docs/getting-started/install.md.

Let a coding agent on a server open its dev server's preview in your laptop's browser, after you allow it in Nearhost.

With the [`nearhost` skill installed](https://nearhost.dev/pr-preview/pr-98/docs/coding-agents.md#install-the-skill), an agent on a server can start a dev server, but you cannot see it in your browser until its port is forwarded to your laptop. With a passthrough, the agent asks Nearhost to forward that one port for the rest of the session, and you approve it first. The preview then opens on your laptop. It works for any HTTP dev server, whatever it is built with, as long as the page loads everything from that one port. Needs Nearhost 0.10.0 or later; an older Nearhost answers without passthrough, and the agent tells you to update it.

1. The agent asks for a port, and Nearhost opens a prompt over the interface: `Claude Code on mini wants to open port 5173 on this laptop (browser preview).` If that port is in use on the laptop, the prompt says so and that it will open on another port; the agent reports the laptop URL once it opens.
2. Answer the prompt. See [Prompts and Always allow](https://nearhost.dev/pr-preview/pr-98/docs/coding-agents/prompts-and-always-allow.md#the-prompt) for the keys, and [Always allow](https://nearhost.dev/pr-preview/pr-98/docs/coding-agents/prompts-and-always-allow.md#always-allow) to stop being asked. If you allow it and the port cannot be opened, the prompt shows why, and the agent is told it failed rather than that you refused, so it passes the reason on. If the port opens but Always allow cannot be saved, the passthrough stays open and the log says Always allow was not saved. If the request has ended by then, because it expired or the agent's session ended, pressing `y` or `a` tells you so; `n` or `esc` closes the prompt.
3. Once you allow it, Nearhost forwards the port and the agent gives you the laptop URL. Asking again for a port that is already open, from the same agent session, returns the same passthrough without a second prompt. A port that a running project already forwards is answered at once, with no prompt.

On a server's panel, press `tab` to move to the server's open passthroughs, which are shown only when there are any. When there are more than fit, they scroll with the selection, and a `+N more` line says how many are hidden above or below. Use `j` and `k` or the arrow keys to move, and `tab` or `esc` to leave. Press `x` on a passthrough to close it at once. Home shows a `passthroughs` count while any are open.

## When a passthrough ends

A passthrough ends when any of these happens:

- the session ends, which Claude Code's `SessionEnd` hook reports;
- you disconnect the server in Nearhost, remove it, or its connection fails (for example, authentication);
- the server has been away for 10 minutes in a row;
- the forwarded port stops answering for 5 minutes, checked every 30 seconds while the server is connected;
- you close it, or Nearhost quits.

The `SessionEnd` hook ships with the Claude Code plugin, so it runs only for plugin installs. With the skill installed through the skills CLI, or in another agent, the other conditions apply. If the laptop port was taken by something else while the server was away, that passthrough closes when the server comes back. If closing a passthrough's forward fails, Nearhost keeps its laptop port and tries again on each check until it closes.

## Without Nearhost connected

When Nearhost is not connected to the server, the agent cannot ask for a passthrough. It tells you to select the server in Nearhost and press `c`, then ask again, or to forward the port yourself from the laptop. Adding `-o ExitOnForwardFailure=yes` to the command it gives makes `ssh` stop with an error when the laptop port is already taken, rather than stay connected without the forward:

```sh
ssh -N -o ExitOnForwardFailure=yes -L <port>:localhost:<port> <server>
```
