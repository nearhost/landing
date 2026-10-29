# Coding agents

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-104/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-104/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-104/docs/getting-started/install.md.

Let Claude Code, Codex or another coding agent add projects, open browser previews and show documents through Nearhost, on this machine or on a server, with your approval.

A coding agent can ask Nearhost to add the project it is working in, can read whether a project is served and where, and can find and fix what stops it being served. It works the same when the agent runs on your laptop or on a server Nearhost is connected to, for example in an SSH session. The agent proposes and you decide: every add opens the add form in Nearhost, filled in, for you to save or dismiss.

- [Add a project](https://nearhost.dev/pr-preview/pr-104/docs/coding-agents/add-a-project.md): the agent proposes the project, and Nearhost opens the add form, filled in, for you to save.
- [Fix a project](https://nearhost.dev/pr-preview/pr-104/docs/coding-agents/fix-a-project.md): the agent runs Nearhost's checks on the project and fixes what it can, with your agreement.
- [Browser previews from a server](https://nearhost.dev/pr-preview/pr-104/docs/coding-agents/browser-previews.md): the agent asks to forward its dev server's port, and the preview opens in your laptop's browser.
- [Documents from coding agents](https://nearhost.dev/pr-preview/pr-104/docs/coding-agents/documents.md): the agent asks to show a plan, spec or mockup it wrote, and Nearhost opens it in your browser.

An add waits for your yes in Nearhost. A browser preview or a document asks first too, unless you chose Always allow for it. See [Prompts and Always allow](https://nearhost.dev/pr-preview/pr-104/docs/coding-agents/prompts-and-always-allow.md).

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

The skill needs `sh` and `curl`, and nothing else. Nothing is installed with it. The plugin also brings a `SessionEnd` hook, which closes browser previews when the session ends.
