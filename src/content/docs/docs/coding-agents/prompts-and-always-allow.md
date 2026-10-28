---
title: Prompts and Always allow
description: How Nearhost asks before an agent opens a preview or a document, what Always allow covers, and how to revoke it.
sidebar:
  order: 6
---

Browser previews and documents ask you first, in the same way. This page covers the prompt, what Always allow does, and how to take it back.

## The prompt

Press `y` to allow it, `n` to refuse, or `a` for Always allow. `esc` counts as No. A prompt that waits 10 minutes expires. The prompt queues with proposals, and Home shows the same hint.

## Always allow

Always allow covers one tool on one server: Claude Code on `mini`, say, but not Claude Code on another server, and not another tool on `mini`. Only Claude Code is offered it. Codex documents no variable that identifies it, so Codex and every other agent are shown as `An agent`, are always prompted and are never offered Always allow.

Previews and documents are approved separately, so revoking one leaves the other working.

To revoke one, press `tab` on the server's panel to move to its sections, and `x` on an always allowed row. Nearhost asks you to confirm first. Revoking leaves open passthroughs and documents in place.

## What the token protects

When you choose Always allow, Nearhost makes a token for that tool on that server. The skill keeps the token on the server, in `${XDG_STATE_HOME:-~/.local/state}/nearhost/tokens/<laptop id>/<requester>`, readable by your account only. For documents, the file ends in `.documents`, beside the preview token. The skill sends it with later requests, so Nearhost does not ask again. The laptop keeps only a SHA-256 hash of the token, in `grants.json` beside the install id in `~/.config/nearhost` (or under `XDG_CONFIG_HOME`).

The token stops a different tool from borrowing an approval, and it stops anything from using one after you revoke it. It does not protect against anything else running as your account on the server: such a process can read the token file and use the approval. Treat Always allow as trust in everything that runs as you on that server. A wrong or revoked token gets a `401`; the skill drops it and asks again, so you are prompted.

Removing a server from Nearhost, or renaming it, revokes its Always allow grants, so a server added later under the same name starts with none. Nearhost does this when it next applies the config or starts, and the log says how many it removed. It does this only for its default config file, not one given with `--config`, and never while that file is missing, so a config file that disappears for a moment does not cost you your grants.

If `grants.json` cannot be read, Nearhost still serves coding agents but turns passthrough off, and says which file it could not read. Fix or remove the file, then restart Nearhost.

## Turn notifications off

Add this to the [config](/docs/reference/config/):

```yaml
notifications: false
```
