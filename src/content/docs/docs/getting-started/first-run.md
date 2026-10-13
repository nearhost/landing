---
title: First run
description: What the one-screen setup does the first time you start Nearhost.
sidebar:
  order: 2
---

The first time you start `nearhost`, the main panel shows a one-screen setup instead of the usual views. It explains the two prompts you are about to see, runs `nearhost trust`, then lands on Home.

## What the setup screen does

1. Explains the trust prompt and the sudo prompt before either appears.
2. Creates the internal certificate authority, named "Nearhost Local CA", under `~/.config/nearhost/caddy`.
3. Runs `nearhost trust` to install the authority's root certificate.
4. Opens Home.

You can run the trust step yourself at any time:

```sh
nearhost trust
```

## The trust prompt

`nearhost trust` installs the root certificate into your system trust store. This is what lets your browser accept `https://<alias>` without a warning. On macOS that is the System keychain, and on Linux it is your distribution's certificate store. Both ask for your password once.

Firefox, and Chromium-based browsers on Linux, keep their own stores. Nearhost updates those too when `certutil` is installed, and tells you when it could not. See [Install](/docs/getting-started/install/) for the one-line setup.

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
