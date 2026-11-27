---
title: The iOS Simulator from another Mac
description: Use the iOS Simulator on a Mac that has Xcode from your laptop or tablet, by streaming it with serve-sim and opening its page through Nearhost.
sidebar:
  order: 10
---

:::note
Needs Nearhost 0.16.0 or later to open it from an agent with `--on`; the web app needs 0.17.0. Run `nearhost update` to get it. See [CLI](/docs/reference/cli/#nearhost-update).
:::

Your app builds on the Mac that has Xcode, but you want to use it from your tablet or from a laptop in another room. [serve-sim](https://github.com/EvanBacon/serve-sim) streams a booted Simulator to a page on port 3200 and sends your input back. By default it serves at `localhost:3200` on that Mac, so Nearhost brings the page to you over the SSH connection you already use.

New to Nearhost? [Install it](/docs/getting-started/install/) and [add a server](/docs/getting-started/add-a-server/) first.

## Before you start

- A Mac with Apple Silicon, Xcode's command line tools and Node 20 or later. These are serve-sim's own requirements; it does not run on Intel Macs.
- That Mac added to Nearhost as a server.
- For a tablet or phone, the Nearhost web app on an always-on machine, with the device paired.

## 1. Start serve-sim on the Mac

Boot a Simulator, from Xcode or with `xcrun simctl boot`. Then run serve-sim in a terminal on the Mac:

```sh
npx serve-sim
# → Preview at http://localhost:3200
```

It attaches to a booted Simulator. To use another port, pass `-p <port>`.

## 2. Open it through Nearhost

Pick one. A project keeps a name you can come back to. A passthrough opens the port for one agent session.

### As a project

In Nearhost, [add a project](/docs/getting-started/add-a-project/) on the Mac's server, with port 3200 as its web port and the name `sim`. It opens at `https://sim.test` while serve-sim is running.

### From a coding agent

Ask the agent to start serve-sim and show it to you. With the [skill installed](/docs/coding-agents/#install-the-skill), it asks Nearhost for a passthrough of port 3200, and you approve it. An agent on another machine adds `--on <host>`, with the Mac's server name as the host. See [Browser previews](/docs/coding-agents/browser-previews/).

## 3. Use it from a tablet

In the web app, the project appears under the Mac's server. Open it from there to get the Simulator's screen. The web app has no docs page yet, so this guide does not link one.

serve-sim forwards keyboard commands to the Simulator, including `⌘⇧H` to go home, and you can swipe up from the bottom of the screen to go home too. Hold the option key to pinch.

## If it doesn't work

- **The screen stays black or empty.** serve-sim attaches to a booted Simulator. Boot one, then restart serve-sim.
- **Nearhost can't reach the page.** Check that serve-sim is running on the Mac, and which port it printed. If it printed another port, change the project's web port to match.
- **Typing does nothing on Xcode 27.** serve-sim needs Device Hub running with the Simulator window visible and frontmost. macOS may also need the app that started serve-sim, such as Terminal, enabled under System Settings, Privacy & Security, Accessibility. See [serve-sim's README](https://github.com/EvanBacon/serve-sim) for more, including `serve-sim repair-input`.
