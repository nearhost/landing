# Fix a project

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-101/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-101/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-101/docs/getting-started/install.md.

Let a coding agent run Nearhost's project checks and fix what stops the project being served.

With the [`nearhost` skill installed](https://nearhost.dev/pr-preview/pr-101/docs/coding-agents.md#install-the-skill), ask your coding agent to find and fix what stops a project being served.

When a project is not served as you expect, run `/nearhost doctor` in its directory, or `$nearhost doctor` in Codex. The agent asks Nearhost to run the same [project checks](https://nearhost.dev/pr-preview/pr-101/docs/reference/cli.md#project-checks) as `nearhost doctor` on this project, and works through the errors, then the warnings. Unlike `nearhost doctor`, this first reads the project's `.nearhostrc` again, as described under [Agent API](https://nearhost.dev/pr-preview/pr-101/docs/coding-agents/how-it-works.md#agent-api). Each finding's fix has a kind, and the agent handles each kind in its own way:

- **`project`.** The agent shows you the change, the snippet and where it goes, and makes it in the project's files once you agree. When the setup is more than Nearhost can work out for itself, such as several hosts, a pattern, `localhost` or callbacks from Docker, it writes or edits the project's [`.nearhostrc`](https://nearhost.dev/pr-preview/pr-101/docs/reference/nearhostrc.md).
- **`nearhost`.** Something you do in Nearhost, such as adding a port in the edit form. The agent passes it on, or offers to write the port or host into `.nearhostrc` instead.
- **`manual`.** Something only you can do, such as a DNS record. The agent tells you what it says.

After editing `.nearhostrc`, and for `nearhostrc.pending` and `nearhostrc.not-applied`, the agent asks Nearhost to read the file again. A change that needs no approval applies at once. One that needs it waits, and the agent tells you to approve it in Nearhost, then waits for your answer. See [Approval](https://nearhost.dev/pr-preview/pr-101/docs/reference/nearhostrc.md#approval).

Then it runs the doctor again, and stops when nothing is left that it can fix. It never edits Nearhost's `config.yaml` itself; Nearhost saves a change there when it applies one. Approving a change needs the full-screen interface: under `nearhost up`, the agent tells you to open `nearhost`.
