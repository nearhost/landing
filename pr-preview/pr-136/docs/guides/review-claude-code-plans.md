# Review Claude Code's plans in your browser

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-136/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-136/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-136/docs/getting-started/install.md.

Have Claude Code on a server show a plan or spec it wrote as a page in your laptop's browser, after you allow it in Nearhost.

> **Note:** Needs Nearhost 0.11.0 or later. Run `nearhost update` to get it. See [CLI](https://nearhost.dev/pr-preview/pr-136/docs/reference/cli.md#nearhost-update).

Claude Code on a server writes a plan or a spec as a Markdown file. Reading it in the terminal means scrolling, and reading it anywhere else means copying it off the server. With Nearhost, Claude Code asks to show it, and the plan opens in your browser as a page. Open it on your laptop, or from the web app on a tablet.

New to Nearhost? [Install it](https://nearhost.dev/pr-preview/pr-136/docs/getting-started/install.md) and [add a server](https://nearhost.dev/pr-preview/pr-136/docs/getting-started/add-a-server.md) first.

## 1. Give Claude Code the skill

Install the `nearhost` skill where Claude Code runs. On a server, install it there.

```sh
npx skills add nearhost/nearhost -g
```

See [Install the skill](https://nearhost.dev/pr-preview/pr-136/docs/coding-agents.md#install-the-skill) for the other agents and the plugin.

## 2. Ask for the plan

Ask Claude Code to write a plan and open it for you, or open one it already wrote:

```text
/nearhost open plans/checkout-refactor.md
```

Claude Code offers this only for documents it wrote for you to read, never for code or config files.

## 3. Say yes

Nearhost shows who is asking, which file, and which folder it will serve:

```text
Claude Code on mini wants to show plans/checkout-refactor.md
```

Press `y`, and your browser opens the plan. With no interface open, answer on Nearhost's page, at the link the agent prints. To skip the question next time, choose Always allow for that folder. See [Prompts and Always allow](https://nearhost.dev/pr-preview/pr-136/docs/coding-agents/prompts-and-always-allow.md).

## 4. Read it

The address looks like `https://nearhost.localhost:6327/d/<random>/plans/checkout-refactor.md`. Nearhost keeps no copy. Each reload reads the file again, so reload the page after the agent changes the plan.

Nearhost serves the plan's git repository, so images and linked documents work too. A plan in a hidden folder such as `~/.claude` opens as well, but there Nearhost serves only Markdown, HTML and web assets. See [What is served](https://nearhost.dev/pr-preview/pr-136/docs/coding-agents/documents.md#what-is-served).

To open a plan again later, select the `documents` row at the bottom of the sidebar, move into the rows with `tab`, and press `enter` on one. Press `x` to stop serving it. See [When a served folder goes away](https://nearhost.dev/pr-preview/pr-136/docs/coding-agents/documents.md#when-a-served-folder-goes-away).

## If it doesn't work

- **Claude Code only gives you the path.** You refused the request, or the folder is one Nearhost won't serve, such as your home folder. See [What is served](https://nearhost.dev/pr-preview/pr-136/docs/coding-agents/documents.md#what-is-served).
- **The browser didn't open.** If the background Nearhost can't open a browser, the agent still gives you the address. Open it yourself.
- **The page says the server is not connected.** Select the server in Nearhost and press `c`.
