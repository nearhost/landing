---
title: Fix a project
description: Let a coding agent run Nearhost's project checks and fix what stops the project being served.
sidebar:
  order: 3
---

Ask your coding agent to find and fix what stops a project being served.

When a project is not served as you expect, run `/nearhost doctor` in its directory, or `$nearhost doctor` in Codex. The agent asks Nearhost to run the same [project checks](/docs/reference/cli/#project-checks) as `nearhost doctor` on this project, and works through the errors, then the warnings. Unlike `nearhost doctor`, this first reads the project's `.nearhostrc` again, as described under [Agent API](/docs/coding-agents/how-it-works/#agent-api). Each finding's fix has a kind, and the agent handles each kind in its own way:

- **`project`.** The agent shows you the change, the snippet and where it goes, and makes it in the project's files once you agree. When the setup is more than Nearhost can work out for itself, such as several hosts, a pattern, `localhost` or callbacks from Docker, it writes or edits the project's [`.nearhostrc`](/docs/reference/nearhostrc/).
- **`nearhost`.** Something you do in Nearhost, such as adding a port in the edit form. The agent passes it on, or offers to write the port or host into `.nearhostrc` instead.
- **`manual`.** Something only you can do, such as a DNS record. The agent tells you what it says.

After editing `.nearhostrc`, and for `nearhostrc.pending` and `nearhostrc.not-applied`, the agent asks Nearhost to read the file again. A change that needs no approval applies at once. One that needs it waits, and the agent tells you to approve it in Nearhost, then waits for your answer. See [Approval](/docs/reference/nearhostrc/#approval).

Then it runs the doctor again, and stops when nothing is left that it can fix. It never edits Nearhost's `config.yaml` itself; Nearhost saves a change there when it applies one. Approving a change needs the full-screen interface: under `nearhost up`, the agent tells you to open `nearhost`.
