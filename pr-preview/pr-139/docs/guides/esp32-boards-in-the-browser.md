# ESP32 firmware in the browser

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-139/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-139/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-139/docs/getting-started/install.md.

Use Preflash's browser page for an ESP-IDF project from your laptop or tablet, by opening the page on the machine that runs it through Nearhost.

> **Note:** Needs Nearhost 0.16.0 or later to open it from an agent with `--on`; the web app needs 0.17.0. Run `nearhost update` to get it. See [CLI](https://nearhost.dev/pr-preview/pr-139/docs/reference/cli.md#nearhost-update).

[Preflash](https://github.com/edcs/preflash) builds your unmodified ESP-IDF project for your computer and runs it in a window the shape of the board's screen. `preflash web` serves its terminal app and that panel on one page, so you can use it from a machine with no window of its own, such as a headless Linux box, or from a tablet. The page listens on `127.0.0.1` only, so Nearhost brings it to you over the SSH connection you already use.

New to Nearhost? [Install it](https://nearhost.dev/pr-preview/pr-139/docs/getting-started/install.md) and [add a server](https://nearhost.dev/pr-preview/pr-139/docs/getting-started/add-a-server.md) first.

## Before you start

- [Preflash installed](https://github.com/edcs/preflash#install) on the machine that builds the firmware. It runs on Apple Silicon Macs and x86_64 Linux.
- That machine added to Nearhost as a server, unless it is your laptop.
- For a tablet or phone, the Nearhost web app.

## 1. Start `preflash web`

In your project's folder, on the machine with Preflash:

```sh
preflash web
```

It prints a URL, `http://localhost:7480` unless you pass `--port`. The page shows the panel on one side and the terminal app on the other, and the app runs headless, so there is no separate window. `--board`, `--sanitize` and `--project` work as they do for `preflash tui`.

## 2. Open it through Nearhost

Pick one. A project keeps a name you can come back to. A passthrough opens the port for one agent session.

### As a project

In Nearhost, [add a project](https://nearhost.dev/pr-preview/pr-139/docs/getting-started/add-a-project.md) on that server, with port 7480 as its web port. Name it after the firmware, such as `clock-face`, so each project gets its own address. It opens at `https://clock-face.test` while `preflash web` is running. Preflash refuses a page whose address is not `localhost`, `127.0.0.1` or `[::1]`, so start it with `--allow-host clock-face.test` for a name like this.

### From a coding agent

Ask the agent to run `preflash web` and show it to you. With the [skill installed](https://nearhost.dev/pr-preview/pr-139/docs/coding-agents.md#install-the-skill), it asks Nearhost for a passthrough of port 7480, and you approve it. An agent on another machine adds `--on <host>`, with the Preflash machine's server name as the host. See [Browser previews](https://nearhost.dev/pr-preview/pr-139/docs/coding-agents/browser-previews.md).

## 3. Use the board

- Tap or drag on the panel, with a mouse or a finger on a tablet.
- Hold a button in the strip below the panel to hold that board button.
- The key row under the terminal sends the keys a touch screen lacks: Esc, Tab, `^C`, `^R`, the arrows and `/`.

`^C` typed in the page ends only the terminal app, and the page offers to start it again. `^C` to `preflash web` itself stops the terminal app and the firmware.

The speaker button in the device pane's header is off in every tab. One tap turns sound on in that tab. Sound needs a secure page, so under a name of your own, such as a project address, it plays only over https. On plain http the speaker button stays off and says so.

Preflash is for quick development and debugging. Test on real hardware before you ship.

## If it doesn't work

- **Nearhost can't reach the page.** Check that `preflash web` is running on that machine, and which port it printed. If it printed another port, change the project's web port to match.
- **The page is refused and names a host.** Preflash only answers addresses it knows. Start it with `--allow-host <name>`, once for each name. The refused page names the host and the flag.
- **No sound.** Tap the speaker button in the device pane's header. On plain http under a name of your own it stays off, as above. Safari wants that tap again after a reload.
