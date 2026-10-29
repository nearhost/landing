# Add a project from an agent

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-103/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-103/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-103/docs/getting-started/install.md.

Ask a coding agent to add the project it is working in, then save or dismiss the add form Nearhost fills in.

With the [`nearhost` skill installed](https://nearhost.dev/pr-preview/pr-103/docs/coding-agents.md#install-the-skill), ask your coding agent to serve the project it is working in, and Nearhost opens the add form for you to review.

In the project's directory, run `/nearhost add` in Claude Code, or `$nearhost add` in Codex. Asking in your own words, such as "serve this with Nearhost", works too.

1. The agent proposes the project's directory to Nearhost, with the dev server's port when the project's files say it plainly.
2. Nearhost notifies the terminal it runs in: `Agent on mini wants to add /home/dev/code/myapp`. Most terminals show it only when Nearhost is not the window or tab in front.
3. The add form opens over the view with the server and path filled in, and the line `Proposed by an agent on mini`. Nearhost reads the project as it does for any add, and you choose the routes and the name as usual.
4. Save it, and the agent reports `https://myapp.test`. Press `esc` on the path, and the agent is told you declined.
5. The agent waits up to 30 seconds for the project to start, then runs the doctor on it and offers to work through any errors or warnings it finds. See [Fix a project](https://nearhost.dev/pr-preview/pr-103/docs/coding-agents/fix-a-project.md).

If a form is already open, the proposal waits, and Home shows `1 request waiting · p to review`. It opens when the form closes, or when you press `p`. An agent waits 10 minutes for an answer.

`/nearhost status` reports the project holding the current directory: its address, every address it serves in `urls`, its state and any error. A project with several web routes or hosts has one URL for each, so you can see where each service lives. `/nearhost status --all` reports every project on the machine the agent runs on.

Proposals need the full-screen interface. Under `nearhost up`, an agent can read the status but is told to open `nearhost` to propose.
