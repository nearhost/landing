---
title: Keyboard shortcuts
description: Every key in the Nearhost interface, by screen.
sidebar:
  order: 4
---

The footer always shows the keys that work where you are. When the window is narrow it leaves some out and shows `? more`, and `?` lists them all.

Mouse and keyboard both work. Click a sidebar row to select it, click a footer action to run it, and scroll the log with the wheel.

## Mouse

Nearhost takes the mouse for those clicks, so it selects text and opens links itself:

| Action           | Effect                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Drag             | Selects text within the panel or box where the drag starts, and copies it when you let go. The log says what was copied. |
| Double-click     | Copies the word under the pointer.                                                                                       |
| Click an address | Opens an `http` or `https` address in your browser, whether it is a link or written in a log line.                       |

Copies go to the clipboard through the terminal, over OSC 52, and through `pbcopy` on macOS, or `wl-copy`, `xclip` or `xsel` on Linux, so they work in terminals without OSC 52 too. In most terminals, holding Shift hands the mouse back to the terminal for its own selection and links. In Ghostty, Shift+Cmd+click opens a link the terminal's way. Needs Nearhost 0.8.0 or later.

## Anywhere

`ctrl+c` quits, even from a form or the password box. While Nearhost is stopping, `q` or `ctrl+c` again stops it at once.

## Main screen

| Key      | Action                                                                  |
| -------- | ----------------------------------------------------------------------- |
| `↑`, `↓` | Move the selection. `k` and `j` too.                                    |
| `h`      | Go to Home.                                                             |
| `/`      | Filter the sidebar by name. `enter` keeps the filter.                   |
| `esc`    | Clear the filter, or go to Home.                                        |
| `l`      | Full-screen log of the selected row, or of everything from Home.        |
| `n`      | Add a project, on the selected server or the selected project's server. |
| `s`      | Add a server.                                                           |
| `?`      | Show or hide every key.                                                 |
| `q`      | Quit. This stops every project.                                         |

On Home, when a server cannot connect, `r` retries every such server now and `y` copies the `ssh` command that fixes access.

## Project

| Key     | Action                                                                                                        |
| ------- | ------------------------------------------------------------------------------------------------------------- |
| `enter` | Start or stop it.                                                                                             |
| `o`     | Open `https://<alias>` in the browser.                                                                        |
| `tab`   | Move into its routes, to change them.                                                                         |
| `e`     | Edit: read its files again and change its routes or name.                                                     |
| `d`     | Remove it, after you confirm.                                                                                 |
| `y`     | Copy the snippets of its advice.                                                                              |
| `r`     | Read its `.nearhostrc` again. A change that needs no approval is applied, which restarts it if it is running. |
| `a`     | Review a pending `.nearhostrc` change.                                                                        |
| `i`     | Show or hide its ignored routes, which fold into one line with their ports.                                   |

## Routes

After `tab` on a project. Every route is listed here, ignored ones included.

| Key          | Action                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| `↑`, `↓`     | Choose a route.                                                                                      |
| `space`      | Switch it between `loopback` and `ignore`.                                                           |
| `w`          | Make it a web route, the primary if it has no hosts. Other web routes with no hosts become `ignore`. |
| `y`          | Copy the snippets of the project's advice.                                                           |
| `tab`, `esc` | Done.                                                                                                |

On a project on this machine, a route is only `web` or `ignore`.

## Server

| Key     | Action                                                       |
| ------- | ------------------------------------------------------------ |
| `enter` | Collapse or expand its projects.                             |
| `r`     | Reconnect now.                                               |
| `c`     | Drop the connection and hold it closed, or connect it again. |
| `e`     | Edit its host and name.                                      |
| `d`     | Remove it and its projects, after you confirm.               |

Only `enter` works on `local`.

## Full-screen log

| Key               | Action                                            |
| ----------------- | ------------------------------------------------- |
| `j`, `k`          | Move. The arrow keys too.                         |
| `space`, `pgdown` | Page down.                                        |
| `pgup`            | Page up.                                          |
| `g`               | Go to the oldest line.                            |
| `G`               | Go to the end and follow new lines.               |
| `tab`             | Show all entries, requests, events or errors.     |
| `/`               | Search. `enter` keeps it, `esc` clears it.        |
| `w`               | Wrap long lines.                                  |
| `enter`           | Open or close a request.                          |
| `v`               | Show or hide cookies and authorisation headers.   |
| `c`               | Copy the request as a `curl` command.             |
| `r`               | Send the request again. Unsafe methods ask first. |
| `esc`, `q`        | Close the log. `esc` clears a search first.       |

See [The request log](/docs/concepts/the-request-log/).

## Forms

`esc` goes back a step, and from the first step closes the form. The footer of each step lists its keys.

| Where        | Keys                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------ |
| Lists        | `↑`, `↓` to choose, `enter` to pick.                                                                               |
| Path         | `tab` or `→` accepts the suggestion, `↑`, `↓` choose a match, `enter` uses the path as typed, `ctrl+r` reconnects. |
| Presets      | `space` ticks or unticks, `enter` goes on.                                                                         |
| Routes       | `space` serves or ignores a port, `←`, `→` change its role, `h` edits a web route's hosts.                         |
| Name         | `tab` moves between name and alias.                                                                                |
| Server check | `r` checks again after a failure.                                                                                  |
| Confirm      | `enter` adds or saves. The last step lists anything that needs approval, which `enter` approves.                   |
| Review       | `y` approves, `n` declines, `esc` leaves it for later.                                                             |
| Remove       | `y` removes, `n` or `esc` keeps.                                                                                   |

## Welcome and password boxes

| Box      | Keys                                                 |
| -------- | ---------------------------------------------------- |
| Welcome  | `enter` trusts the certificate authority, `s` skips. |
| Password | `enter` continues, `esc` cancels.                    |
