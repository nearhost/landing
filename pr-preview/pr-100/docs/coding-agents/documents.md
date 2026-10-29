# Documents from coding agents

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-100/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-100/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-100/docs/getting-started/install.md.

Let a coding agent show a plan, spec or mockup it wrote in your laptop's browser, after you allow it in Nearhost.

With the [`nearhost` skill installed](https://nearhost.dev/pr-preview/pr-100/docs/coding-agents.md#install-the-skill), when an agent writes a plan, spec, report or HTML mockup for you to read, it can ask Nearhost to show it. Nearhost serves the document at an address on your laptop and opens it in your browser. This works for an agent on the laptop and for one on a server Nearhost is connected to, so you no longer need a second terminal to read a path on a server. Markdown is shown as a page; HTML is served as written. Agents offer this only for documents they wrote for you, never for code or config files. You can also ask directly with `/nearhost open <path>` in Claude Code, or `$nearhost open <path>` in Codex. Needs Nearhost 0.11.0 or later; an older one answers without them, and the agent tells you to update it.

1. The agent asks, and Nearhost opens a prompt over the interface: `Claude Code on mini wants to show plans/2026-10-28-x.md`, with a line saying which folder Nearhost will serve.
2. Answer the prompt. See [Prompts and Always allow](https://nearhost.dev/pr-preview/pr-100/docs/coding-agents/prompts-and-always-allow.md#the-prompt) for the keys, and [Always allow](https://nearhost.dev/pr-preview/pr-100/docs/coding-agents/prompts-and-always-allow.md#always-allow) to stop being asked. If you refuse, the agent does not offer that folder again in the session and only gives you the path.
3. Once you allow it, your browser opens the document and the agent gives you the address. It looks like `https://localhost:<web port>/d/<random>/plans/2026-10-28-x.md`, where `<web port>` is Nearhost's web port, and `<random>` is a long random string that other pages cannot guess.

With Always allow, the document opens in your browser at once, and Nearhost shows `Claude Code on mini opened plans/2026-10-28-x.md` in the status line.

## What is served

Nearhost serves the document's git repository, so its images, stylesheets and linked documents work. A document that is not in a repository serves its own folder. A repository at your home folder, or above it, is never served whole: Nearhost serves the document's own folder instead. A document directly in your home folder, or in `/`, is refused with `save the document in a project or a folder of its own`. Nearhost never serves dotfiles or the contents of dot folders inside that folder, and never follows a link out of it. A second document in the same folder reuses the address without a prompt for the agent you approved, and prompts any other.

Nearhost keeps no copies. Each time the page loads, it reads the file again, from the laptop or over the server's SSH connection, so reloading shows the current file. A file that has moved or gone shows as missing, never as an old version. A server that is not connected shows a page saying so; select it in Nearhost and press `c`.

## Documents cannot reach your other pages

Every file Nearhost serves from a document's folder is sandboxed by the browser. Its scripts run, but they cannot read other pages on `localhost`, your projects' cookies or storage, or other documents. Rendered markdown runs no scripts at all. Pages also send no referrer, so the address does not leak to sites a document links to.

## When a served folder goes away

Nearhost lists served folders on each server's panel; press `tab` to reach its `documents` section. Home shows a count in its `agents` line. A folder stays served until:

- Nearhost quits, as nothing is saved across restarts;
- you press `x` on it in the server's panel and confirm;
- you remove the server from Nearhost, or rename it.

Disconnecting a server does not remove its folders. Their pages say the server is not connected until it reconnects. The agent's session ending does not remove them either, so you can read yesterday's plan again while Nearhost runs. Home's web page also lists the folders served since Nearhost started, with links to each document.

If Nearhost has no web port, because `--web-port 0` turned it off or the port was taken, and a project holds `localhost`, there is no page to serve from, and the agent is told so.
