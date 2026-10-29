# When agents cannot reach Nearhost

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/docs/getting-started/install/ becomes https://nearhost.dev/docs/getting-started/install.md.

Fix an sshd that refuses Nearhost's socket forward, or an agent sandbox that blocks the socket.

Two things can stop an agent reaching Nearhost: the server's sshd, or the agent's own sandbox.

**The server refuses the forward.** Its sshd has `AllowStreamLocalForwarding no`. The server's panel shows `agents unavailable` with sshd's message, and so does `nearhost doctor`. Set `AllowStreamLocalForwarding yes` in the server's `sshd_config`, reload sshd and press `r` on the server to reconnect. Projects serve either way, and `r` on Home leaves such a server connected.

**The agent's sandbox blocks the socket.** Agents that run commands in a sandbox block Unix sockets by default, so the skill's script cannot reach `~/.nearhost`. Allow only what Nearhost needs.

- **Approve the one command.** Claude Code and Codex ask before they run a command the sandbox blocks outside it. Approving that for the skill's script opens nothing else, so it is the narrowest choice.
- **Claude Code on macOS** can allow the one socket by its full path, which `ls ~/.nearhost` shows, in `~/.claude/settings.json` where the agent runs:

  ```json
  { "sandbox": { "network": { "allowUnixSockets": ["/Users/dev/.nearhost/k3f9q2.sock"] } } }
  ```

Two settings also work, but open far more than Nearhost:

- **Claude Code on Linux** cannot allow one socket, only every one, with `"allowAllUnixSockets": true`.
- **Codex's** `network_access = true` under `[sandbox_workspace_write]` gives its sandbox the network and every socket.

Every socket includes ones like Docker's `/var/run/docker.sock`, and a command that reaches Docker's socket can take over the machine. Use these settings only if that is acceptable where the agent runs; otherwise approve the command when the agent asks.
