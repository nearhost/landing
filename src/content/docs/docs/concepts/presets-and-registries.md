---
title: Presets and registries
description: How Nearhost learns what a framework's ports mean, and where that knowledge comes from.
sidebar:
  order: 4
---

On its own, Nearhost knows one thing about a project: the port variables in its `.env` files. Everything it knows about a particular tool, such as Docker Compose, Vite or Laravel Sail, comes from a preset. Presets come from registries, and Nearhost trusts none until you say so.

## What a preset is

A preset is a small YAML file that says when it applies, which ports to propose and how to label them, and what advice to give. It is data, not code:

- It reads files inside the project. It cannot run a command, make a request or change a file.
- Its expressions are [CEL](https://cel.dev) with a cost limit, and its patterns are RE2, which runs in linear time.
- A preset that fails to load is skipped with a warning. It never stops a command.

Presets combine. On a Sail project with a Vite frontend, `sail`, `laravel` and `vite` all apply, and `sail` changes what `vite` would advise for a dev server that runs in a container.

## The official presets

The official registry is [nearhost/presets](https://github.com/nearhost/presets).

| Preset             | Turns on when                                                               | What it adds                                                                                                                                                                                                                             |
| ------------------ | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nearhost/compose` | The project has a Compose file                                              | A route for every TCP port the Compose file publishes, labelled with its service. A service on container port 80 becomes the web route.                                                                                                  |
| `nearhost/laravel` | The project has an `artisan` file                                           | Advice when `APP_URL` is not one of the project's addresses, with `https` and no port, since generated links use it.                                                                                                                     |
| `nearhost/sail`    | The Compose file mentions `laravel/sail`, a `sail-` image or `LARAVEL_SAIL` | Compose's published ports, with the Vite dev server forwarded to `localhost` through `VITE_PORT`. The hosts in `APP_URL`, `REVERB_HOST` and `FILES_URL`, `MINIO_URL`, or both, served on their ports. Vite advice that fits a container. |
| `nearhost/vite`    | A `vite.config.*` file exists, or `package.json` depends on `vite`          | The dev server port from `server.port` as a route. Advice when the port is the default 5173, or when `server.allowedHosts` would reject the alias.                                                                                       |

## Hosts from presets

A preset can name hosts as well as ports. `nearhost/sail` reads them from `APP_URL` and `REVERB_HOST`, and from `FILES_URL`, `MINIO_URL` or both, and serves each on its port. The hosts are fixed when you add or edit the project. A project's `.nearhostrc` wins over them, a real domain among them is asked about first, and `nearhost add` leaves out one that another enabled project serves, with a note. See [Multi-host projects](/docs/concepts/multi-host-projects/#hosts-from-presets).

## Trusting a registry

A fresh Nearhost trusts no registry and makes no request for presets. The first time you add a project, at a terminal or in the interface, it offers to trust the official registry. Answer yes, no, or don't ask again. You can also trust it yourself:

```sh
nearhost preset registry add nearhost/presets
```

From then on, adding a project suggests the presets that suit it, and asks before enabling each one. In the interface they are listed ticked on the presets step. At a terminal:

```text
This looks like a Vite project. Enable nearhost/vite from nearhost/presets? [Y/n]
```

Without a terminal, `nearhost add` prints the `--preset` flag for each suggestion instead, and enables nothing.

## Pinned and checked

A registry is a public GitHub repository with an `index.yaml` on its default branch and the presets in `presets/`. The index names a commit and a SHA-256 for every preset. Nearhost downloads each file at that commit and refuses it if its hash differs.

- An installed preset never changes until you run `nearhost preset update`.
- The index is cached for a day. If a fetch fails, the cached copy is used.
- A preset written for a newer Nearhost is refused, with a message to upgrade.

Presets from a registry are named after it, as in `nearhost/vite`, so you can see where each one came from. The name before the slash is the registry's alias, which is the repository owner unless you choose another with `--as`.

## Commands

| Command                                     | What it does                                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `nearhost preset list`                      | The enabled presets and where they came from, then what each trusted registry offers.     |
| `nearhost preset enable <name>`             | Download, check and enable a registry preset, or enable a local one.                      |
| `nearhost preset disable <name>`            | Stop using a preset. Its file is kept.                                                    |
| `nearhost preset update [name\|registry]`   | Move registry presets to the current versions, and say what changed.                      |
| `nearhost preset registry add <owner/repo>` | Trust a registry. `--as <alias>` names it.                                                |
| `nearhost preset registry list`             | The trusted registries and how old their cached indexes are.                              |
| `nearhost preset registry remove <alias>`   | Stop trusting a registry, once none of its presets are enabled. Installed files are kept. |

`nearhost add --preset <name>` enables a preset without asking, and `--no-presets` uses none.

## Where they live

Presets are files beside the config, under `~/.config/nearhost/presets/`. One from a registry is `presets/<alias>/<name>.yaml`. A local preset is `presets/<name>.yaml`, with a plain name, and is enabled with `nearhost preset enable <name>`.

The config records what is trusted and enabled:

```yaml
registries:
  - alias: nearhost
    repo: nearhost/presets
presets:
  - name: nearhost/vite
    ref: e6c0be9e14dc89ec5c19bb1bc7d155c1029c298d
    sha256: 024643158cc1d55819e3f62d9d3e429cc8b15dae396cf036db9d573815c9d80e
```

`registry_prompt: false` stops Nearhost asking about the official registry. Choosing "don't ask again" sets it.

## Writing your own

Write a preset when a framework's ports or advice are not covered. The [nearhost/presets README](https://github.com/nearhost/presets#writing-a-preset) describes every key and expression. Check a file with `nearhost preset validate <file>`, and test it against sample projects with `nearhost preset test`.

Any public GitHub repository laid out like nearhost/presets is a registry. `nearhost preset index` writes its `index.yaml`, and others trust it with `nearhost preset registry add <owner/repo>`.

See [Discovery](/docs/concepts/discovery/) for how presets and the `.env` rule combine.
