# Prompts and Always allow

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-142/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-142/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-142/docs/getting-started/install.md.

How Nearhost asks before an agent opens a preview or a document, what Always allow covers, and how to revoke it.

Browser previews and documents ask you first, in the same way. This page covers the prompt, what Always allow does, and how to take it back.

## The prompt

Press `y` to allow it, `n` to refuse, or `A` (shift-a) for Always allow. `esc` counts as No. A prompt that waits 10 minutes expires.

For the first 750 ms after a prompt opens, it ignores every key but ctrl+c and hides its keys, then shows them. A key you meant for the screen behind it, pressed as the request arrived, does nothing. The add form an agent's proposal opens waits the same way, and each prompt in a queue waits again when it opens. Lowercase `a` does nothing in a prompt.

When you refuse a preview or a document, that server's requests of the same kind are held back for 30 seconds: a new one is refused at once, with no prompt, and the agent is told when it may ask again. Its other waiting requests of that kind are dropped. A request that carries a valid Always allow token still goes through. The prompt queues with proposals and passthroughs, and Home shows the same hint as for a [proposal](https://nearhost.dev/pr-preview/pr-142/docs/coding-agents/add-a-project.md).

## Answer from the page

Nearhost's page, at `https://nearhost.localhost:6327` or on the port `--web-port` gives, takes answers whenever it is served, so a request does not need the interface open. That covers the background Nearhost, a service and `nearhost up`. The page shows what the prompt shows, with the same choices: Yes, No and, where it applies, Always allow. The first answer wins, from the page or from the interface. A request to add a project is the exception: the page shows it and lets you decline it, and accepting it takes `nearhost`, where the add form opens filled in.

When a request waits and the agent knows the page's address, the skill prints a link to it:

```text
Answer in Nearhost on dev@laptop, or open https://nearhost.localhost:6327/approve/k3f9q2
```

For a proposal, it says to run `nearhost` on the laptop to review it, and gives the link to decline it. Open the link in your browser. The page shows the request only to a browser that holds its cookie, which `nearhost status` and the interface give you with their links, so a link that someone else opens shows nothing and approves nothing. Nearhost prints the same link in its own output, in `nearhost up` and in the core's log, and `nearhost status` lists what waits.

With no interface attached and the page off, because you gave `--web-port 0` or its port was taken, there is nowhere to ask, and the agent is told so. See [Nearhost has no page or window to ask you in](https://nearhost.dev/pr-preview/pr-142/docs/coding-agents/troubleshooting.md#nearhost-has-no-page-or-window-to-ask-you-in).

## Always allow

Always allow covers one tool on one server: Claude Code on `mini`, say, but not Claude Code on another server, and not another tool on `mini`. Only Claude Code is offered it. Codex documents no variable that identifies it, so Codex and every other agent are shown as `An agent`, are always prompted and are never offered Always allow.

Previews and documents are approved separately, so revoking one leaves the other working.

For documents, Always allow covers the folders you have approved, not every folder on the server. A document in a folder you approved opens without a prompt. One in any other folder prompts, and the prompt names the folder. Always allow there adds that folder to the same approval; Yes opens the document and adds nothing. Approvals saved by an earlier version name no folders, so after you update, each folder prompts once.

To revoke one, press `tab` on the server's panel to reach its `always allowed` section, and `x` on a row. Nearhost asks you to confirm first. Revoking leaves open passthroughs and documents in place. They are listed under `passthroughs` and `documents` at the bottom of the sidebar, not on the server's panel.

## What the token protects

When you choose Always allow, Nearhost makes a token for that tool on that server. The skill keeps the token on the server, in `${XDG_STATE_HOME:-~/.local/state}/nearhost/tokens/<laptop id>/<requester>`, readable by your account only. For documents, the file ends in `.documents`, beside the preview token. The skill sends it with later requests, so Nearhost does not ask again. The laptop keeps only a SHA-256 hash of the token, in `grants.json` beside the install id in `~/.config/nearhost` (`%APPDATA%\nearhost` on Windows, or under `XDG_CONFIG_HOME`).

The token stops a different tool from borrowing an approval, and it stops anything from using one after you revoke it. It does not protect against anything else running as your account on the server: such a process can read the token file and use the approval. Treat Always allow as trust in everything that runs as you on that server. A wrong or revoked token gets a `401`; the skill drops it and asks again, so you are prompted.

Removing a server from Nearhost, or renaming it, revokes its Always allow grants, so a server added later under the same name starts with none. Nearhost does this when it next applies the config or starts, and the log says how many it removed. It does this only for its default config file, not one given with `--config`, and never while that file is missing, so a config file that disappears for a moment does not cost you your grants.

If `grants.json` cannot be read, Nearhost still serves coding agents but turns passthrough off, and says which file it could not read. Fix or remove the file, then restart Nearhost.

## Turn notifications off

The interface notifies the terminal it runs in when an agent asks to add a project, open a preview or show a document. To stop that, add this to the [config](https://nearhost.dev/pr-preview/pr-142/docs/reference/config.md). The prompts still open in Nearhost:

```yaml
notifications: false
```
