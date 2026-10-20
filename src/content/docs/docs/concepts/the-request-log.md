---
title: The request log
description: How Nearhost keeps each request and response in memory, and how to look at them and send them again.
sidebar:
  order: 9
---

Every request the proxy passes on is logged against its project, with its method, path, status and time. Nearhost also keeps the request and its response, bodies included, in memory, so you can look inside them and send them again.

## Opening it

Press `l` for the full-screen log of the selected row: a project, a server, or from Home, everything. `tab` moves between all entries, requests, events and errors, and `/` searches.

Choose a request with `j` and `k`, then:

| Key     | Action                                                  |
| ------- | ------------------------------------------------------- |
| `enter` | Open it: its headers and bodies, and the route it took. |
| `v`     | Show or hide cookies and authorisation headers.         |
| `c`     | Copy it as a `curl` command.                            |
| `r`     | Send it again.                                          |
| `G`     | Jump to the end and follow new lines.                   |
| `w`     | Wrap long lines.                                        |
| `esc`   | Clear the search, or close the log.                     |

Compressed bodies are unpacked, and JSON is laid out to read.

## Sending a request again

`r` sends the request through the proxy again, so it is logged like any other, and shows the status that came back. `GET`, `HEAD` and `OPTIONS` are sent at once. Anything else could change something, so Nearhost asks first, and `y` sends it.

A request cannot be sent again when it was a WebSocket or another upgraded connection, when only part of its body was kept, or when it is no longer kept.

## What is kept

- Each body up to 64 KiB.
- The latest 1000 requests, and at most 32 MiB of bodies. The oldest go first.
- Real header values, including cookies, which the log itself hides.

It all lives in memory and is gone when Nearhost quits. To keep nothing, run Nearhost with `--no-capture`. Requests are still logged, but their bodies are not kept and they cannot be sent again.
