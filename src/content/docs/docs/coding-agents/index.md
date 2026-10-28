---
title: Coding agents
description: Let Claude Code, Codex or another coding agent add projects, open browser previews and show documents through Nearhost, on this machine or on a server, with your approval.
sidebar:
  label: Overview
  order: 1
---

A coding agent can ask Nearhost to add the project it is working in, can read whether a project is served and where, and can find and fix what stops it being served. It works the same when the agent runs on your laptop or on a server Nearhost is connected to, for example in an SSH session. The agent proposes and you decide: every add opens the add form in Nearhost, filled in, for you to save or dismiss.

- [Add a project](/docs/coding-agents/add-a-project/): the agent proposes the project, and Nearhost opens the add form, filled in, for you to save.
- [Fix a project](/docs/coding-agents/fix-a-project/): the agent runs Nearhost's checks on the project and fixes what it can, with your agreement.
- [Browser previews from a server](/docs/coding-agents/browser-previews/): the agent asks to forward its dev server's port, and the preview opens in your laptop's browser.
- [Documents from coding agents](/docs/coding-agents/documents/): the agent asks to show a plan, spec or mockup it wrote, and Nearhost opens it in your browser.

An add, a browser preview and a document each wait for your yes in Nearhost. See [Prompts and Always allow](/docs/coding-agents/prompts-and-always-allow/).

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
