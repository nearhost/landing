---
title: First run
description: What the one-screen setup does the first time you start Nearhost.
sidebar:
  order: 2
---

:::note[Planned]
This describes behaviour from the Nearhost design that is not in a release yet.
:::

The first time you start `nearhost`, the main panel shows a one-screen setup instead of the usual views. It explains the two prompts you are about to see, runs `nearhost trust`, then lands on Home.

## What the setup screen does

1. Explains the keychain prompt and the sudo prompt before either appears.
2. Creates the internal certificate authority, named "Nearhost Local CA", under `~/.config/nearhost/caddy`.
3. Runs `nearhost trust` to install the authority's root certificate.
4. Opens Home.

You can run the trust step yourself at any time:

```sh
nearhost trust
```

## The keychain prompt

`nearhost trust` installs the root certificate into the macOS System keychain. This is what lets your browser accept `https://<alias>` without a warning. Where a Firefox profile exists, Nearhost also enables `enterprise_roots` so Firefox trusts the keychain.

If you decline, the proxy still runs. Home shows the certificate authority as untrusted, with the `nearhost trust` hint. `nearhost untrust` reverses the change.

## The sudo prompt

Nearhost edits `/etc/hosts` to resolve `.test` aliases. It does this with one `sudo` call per change, and only when the aliases it owns change. See [The hosts file](/docs/concepts/the-hosts-file/).

## Home

Home shows:

- proxy state
- ports 80 and 443
- CA trust status
- hosts block status
- the config path
- the number of running projects

Below that is the combined log with a filter line. Press `h` or `esc` from anywhere to return to it.

Next: [Add a server](/docs/getting-started/add-a-server/) or, for a project on this machine, [Add a project](/docs/getting-started/add-a-project/).
