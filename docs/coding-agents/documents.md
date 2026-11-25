# Documents from coding agents

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/docs/getting-started/install/ becomes https://nearhost.dev/docs/getting-started/install.md.

Let a coding agent show a plan, spec or mockup it wrote in your laptop's browser, after you allow it in Nearhost.

With the [`nearhost` skill installed](https://nearhost.dev/docs/coding-agents.md#install-the-skill), when an agent writes a plan, spec, report or HTML mockup for you to read, it can ask Nearhost to show it. Nearhost serves the document at an address on your laptop and opens it in your browser. This works for an agent on the laptop and for one on a server Nearhost is connected to, so you no longer need a second terminal to read a path on a server. Markdown is shown as a page; HTML is served as written. Agents offer this only for documents they wrote for you, never for code or config files. You can also ask directly with `/nearhost open <path>` in Claude Code, or `$nearhost open <path>` in Codex. Needs Nearhost 0.11.0 or later; an older one answers without them, and the agent tells you to update it.

1. The agent asks, and Nearhost opens a prompt over the interface, or, with no interface open, waits for your answer on its page, at a link the agent prints: `Claude Code on mini wants to show plans/2026-10-28-x.md`, with a line saying which folder Nearhost will serve.
2. Answer the prompt. See [Prompts and Always allow](https://nearhost.dev/docs/coding-agents/prompts-and-always-allow.md#the-prompt) for the keys, and [Always allow](https://nearhost.dev/docs/coding-agents/prompts-and-always-allow.md#always-allow) to stop being asked. If you refuse, the agent does not offer that folder again in the session and only gives you the path.
3. Once you allow it, your browser opens the document and the agent gives you the address. It looks like `https://nearhost.localhost:<web port>/d/<random>/plans/2026-10-28-x.md`, where `<web port>` is Nearhost's web port, and `<random>` is a long random string that other pages cannot guess.

If the background Nearhost cannot open a browser, as when it runs outside your desktop session, the agent still gives you the address; open it yourself. `nearhost doctor` shows `core: browser` when the core cannot open links.

With Always allow, the document opens in your browser at once, and Nearhost shows `Claude Code on mini opened plans/2026-10-28-x.md` in the status line. That holds for folders you have approved; a document in another folder prompts first. A server may open 5 documents a minute without a prompt, and past that you are asked. The same document opened again by the same agent within 5 seconds opens no second tab.

## What is served

Nearhost serves the document's git repository, so its images, stylesheets and linked documents work. A document that is not in a repository serves its own folder. A repository at your home folder, or above it, is never served whole: Nearhost serves the document's own folder instead. A document directly in your home folder, or in `/`, is refused with `save the document in a project or a folder of its own`. Nearhost never serves dotfiles or the contents of dot folders inside that folder, and never follows a link out of it.

A folder inside a hidden folder, one whose path has a part starting with `.`, such as `~/.claude`, serves only Markdown, HTML and web assets such as scripts, stylesheets and images. Any other file there, such as a key or a credentials file, shows as missing, judged by the name of the file a link leads to. The prompt says when the folder is in a hidden folder. A served folder also stays tied to where it was when you approved it: if its path later leads somewhere else, such as a folder swapped for a link, it serves nothing.

A second document in the same folder reuses the address without a prompt for the agent you approved, and prompts any other.

Nearhost keeps no copies. Each time the page loads, it reads the file again, from the laptop or over the server's SSH connection, so reloading shows the current file. A file that has moved or gone shows as missing, never as an old version. A server that is not connected shows a page saying so; select it in Nearhost and press `c`.

## Documents cannot reach your other pages

Every file Nearhost serves from a document's folder is sandboxed by the browser. Its scripts run, but they cannot read Nearhost's page, your projects' cookies or storage, or other documents. Rendered markdown runs no scripts at all. Pages also send no referrer, so the address does not leak to sites a document links to.

A page's script can load the folder's scripts, stylesheets, fonts, images, audio, video and WebAssembly, but cannot read its other files, such as `config/secrets.json`. It can still read the files it may load, such as the folder's scripts, stylesheets, fonts and images, since modules and styles need that to load. So an HTML report that fetches its own JSON data does not work; put the data in the page or in a script.

## When a served folder goes away

Nearhost lists served folders on each server's panel; press `tab` to reach its `documents` section. Home shows a count in its `agents` line. A folder stays served until:

- the background Nearhost stops or restarts, as nothing is saved across restarts (`nearhost update` restarts it). Quitting the interface alone does not clear them;
- you press `x` on it in the server's panel and confirm;
- you remove the server from Nearhost, or rename it.

Disconnecting a server does not remove its folders. Their pages say the server is not connected until it reconnects. The agent's session ending does not remove them either, so you can read yesterday's plan again while Nearhost runs. Home's web page also lists the folders served since Nearhost started, with links to each document. It lists them only in a browser that has opened a document link, or opened the page from Nearhost's interface or from the address `nearhost status` prints at a terminal: each sets the cookie that the list needs. Elsewhere the page shows no list. Nearhost sets and reads that cookie at `nearhost.localhost` only, so a dev server or container you browse at `localhost` does not receive it. See [TLS and the proxy](https://nearhost.dev/docs/concepts/tls-and-the-proxy.md).

If Nearhost has no web port, there is no page to serve from, and the agent is told so. With `--web-port 0` the message is `Nearhost's page isn't served: --web-port is 0`. When the port was taken, it is `Nearhost's page isn't served: port 6327 wasn't available when Nearhost started`, with the port you asked for.
