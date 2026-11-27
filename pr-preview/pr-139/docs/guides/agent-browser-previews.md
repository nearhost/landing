# See what an agent is building, live

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-139/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-139/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-139/docs/getting-started/install.md.

Open the dev server or page a coding agent on a server is running in your own browser while it works, after you allow it in Nearhost.

> **Note:** Needs Nearhost 0.10.0 or later; `--on` needs 0.16.0. Run `nearhost update` to get it. See [CLI](https://nearhost.dev/pr-preview/pr-139/docs/reference/cli.md#nearhost-update).

A coding agent on a server starts a dev server, or a page of sketches, and tells you it is at `localhost` and a port. That is the server's localhost, not yours. With Nearhost, the agent asks to forward that one port, and once you allow it the page opens in your own browser while the agent works.

New to Nearhost? [Install it](https://nearhost.dev/pr-preview/pr-139/docs/getting-started/install.md) and [add a server](https://nearhost.dev/pr-preview/pr-139/docs/getting-started/add-a-server.md) first.

## 1. Give your agent the skill

This works in Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot and other agents that read skills. Install it where the agent runs. On a server, install it there.

```sh
npx skills add nearhost/nearhost -g
```

See [Install the skill](https://nearhost.dev/pr-preview/pr-139/docs/coding-agents.md#install-the-skill) for choosing agents and for the Claude Code plugin.

## 2. Ask to see it

Ask the agent to show you what it is making, for example "start the dev server and open it for me". When it starts something on a port, it asks Nearhost for a passthrough instead of handing you a `localhost` address you cannot open. A passthrough forwards that one port for the rest of the session. It works for any HTTP dev server, as long as the page loads everything from that one port.

## 3. Press `y`

Nearhost shows who is asking and which port:

```text
Claude Code on mini wants to open port <port> on this laptop (browser preview).
```

Press `y`, and the preview opens on your laptop. Once you allow it, the agent gets the laptop address, so the link it gives you works. If that port is in use on the laptop, the prompt says so and the preview opens on another port, and the agent reports the address it got. With no interface open, answer on Nearhost's page, at the link the agent prints.

For Claude Code, choose Always allow to skip the question next time. See [Prompts and Always allow](https://nearhost.dev/pr-preview/pr-139/docs/coding-agents/prompts-and-always-allow.md).

## When the app runs on another machine

The agent may work on one server while the app runs on another that it reaches over SSH, such as a Mac with a simulator. The skill then asks for the passthrough on that machine with `--on <host>`. Nothing needs installing there. Nearhost lists the passthrough under the machine the app runs on, so you can see where it is. See [When the app runs on another machine](https://nearhost.dev/pr-preview/pr-139/docs/coding-agents/browser-previews.md#when-the-app-runs-on-another-machine).

## When it closes

A passthrough ends when the session ends (with the Claude Code plugin, within about 2.5 seconds), when you close it, or when Nearhost drops the server's connection. To close one, select the `passthroughs` row (0.16 or later) at the bottom of the sidebar, press `tab` to move into the rows, and press `x` on it. See [When a passthrough ends](https://nearhost.dev/pr-preview/pr-139/docs/coding-agents/browser-previews.md#when-a-passthrough-ends) for the full list.

To keep an app past the session, [add it as a project](https://nearhost.dev/pr-preview/pr-139/docs/getting-started/add-a-project.md) instead, and it gets a name such as `https://myapp.test`.

## If it doesn't work

- **The agent only gives you a `localhost` address.** Nearhost is not connected to the server. Select the server in Nearhost and press `c`, then ask again. See [Without Nearhost connected](https://nearhost.dev/pr-preview/pr-139/docs/coding-agents/browser-previews.md#without-nearhost-connected).
- **The agent says it was refused.** After a refusal, Nearhost holds back that server's requests of the same kind for 30 seconds.
- **You allowed it and it still failed.** The prompt shows why, and the agent passes the reason on.
