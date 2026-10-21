---
title: First run
description: What Nearhost shows the first time you start it, and when it asks for your password.
sidebar:
  order: 2
---

Start the interface with:

```sh
nearhost
```

It starts the proxy and every enabled project, and creates the local certificate authority, "Nearhost Local CA", under `~/.config/nearhost/caddy` if it does not exist yet.

## Nothing to serve yet

With no projects, the screen shows the Nearhost mark and "Nothing to serve yet.", with the two ways in:

```text
n  add a project on this machine or a server
s  add a server you reach over SSH
```

Below them are the folder you started in, whether the certificate authority is trusted, the proxy's ports, and, from Nearhost 0.8.0, a link to Nearhost's page at `https://localhost:6327`, or on the port `--web-port` gives. See [TLS and the proxy](/docs/concepts/tls-and-the-proxy/). Press `n` to serve a project from this machine, or from a server you have added. Press `s` first if the project is on a machine you reach over SSH. See [Add a server](/docs/getting-started/add-a-server/) and [Add a project](/docs/getting-started/add-a-project/).

## Welcome to Nearhost

While your system does not trust the certificate authority, a box titled "Welcome to Nearhost" opens over the screen. It says what will ask for your password:

- now: trusting the local certificate authority, so browsers accept HTTPS from Nearhost's web server
- later: adding names to `/etc/hosts`

Press `enter` to trust it now, or `s` to skip. Skipping lasts until you next start Nearhost, and the box comes back while the authority is still untrusted. Once it is trusted you see "The local CA is now trusted." and the box does not appear again.

Trusting installs the authority's root certificate into your system trust store: the System keychain on macOS, your distribution's certificate store on Linux. It is what lets your browser open `https://<alias>` without a warning.

Firefox, and Chromium-based browsers on Linux, keep their own stores. Nearhost updates those too when `certutil` is installed. See [Install](/docs/getting-started/install/) for the one-line setup.

If you skip, the proxy still runs and Home shows `local CA ● not trusted. Run nearhost trust`. You can trust it from a terminal at any time, and `nearhost untrust` reverses it:

```sh
nearhost trust
```

## The password box

Two things need root: trusting the certificate authority, and adding your projects' names to `/etc/hosts`. For both, Nearhost asks in a box titled "Password needed", which says why:

```text
Nearhost needs your password to add myapp.test to /etc/hosts.
```

Type your password and press `enter`, or `esc` to cancel. The password goes straight to `sudo` and nowhere else: it is not shown, logged or saved.

- **A wrong password** shows "Sorry, try again." After three, the step stops and nothing is changed.
- **Cancelling** leaves things as they were. The certificate authority stays untrusted, or the project stays stopped until you start it again.
- **sudo remembers it** for a few minutes, as it does in a terminal, so a second step soon after does not ask again.
- **If sudo asks every time**, because it is set up not to remember, Nearhost hands over to the terminal for the password, then comes back.

`/etc/hosts` is only changed when a project starts and its names are missing, so most starts ask for nothing. See [The hosts file](/docs/concepts/the-hosts-file/).

## Touch ID on a Mac

macOS can let `sudo` take your fingerprint instead of your password, but it is off until you turn it on. Copy the template that macOS ships:

```sh
sudo cp /etc/pam.d/sudo_local.template /etc/pam.d/sudo_local
```

Then edit `/etc/pam.d/sudo_local` as root and remove the `#` from this line:

```text
auth       sufficient     pam_tid.so
```

Check it in an ordinary terminal. This should show the Touch ID dialog:

```sh
sudo -k; sudo -v
```

With it on, Nearhost may still ask for your password the first time, then use Touch ID when it next needs root. Typing the password always works. Touch ID only works at the Mac itself, not over SSH. Inside tmux or another terminal multiplexer it may also need [pam_reattach](https://github.com/fabianishere/pam_reattach).

## Home

Once a project exists, the screen has a sidebar on the left, with Home at the top and each server's projects below, and the selected row's details on the right. Home shows:

- `proxy`: whether it is serving, and on which ports
- `page`: a link to Nearhost's page at `https://localhost:6327`, once the proxy is serving. Needs Nearhost 0.8.0 or later.
- `local CA`: whether it is trusted, and when it expires
- `hosts`: whether `/etc/hosts` has every project's name
- `config`: the path of the config file
- `running`: how many projects are running, on how many servers

When something needs you, a problems section lists it, with why it happened and how to fix it. Below that is the recent log. Press `l` for the full-screen log, `/` to filter the sidebar by name, and `h` to come back to Home. `?` lists every key. See [Keyboard shortcuts](/docs/reference/keyboard-shortcuts/).

Next: [Add a server](/docs/getting-started/add-a-server/) or, for a project on this machine, [Add a project](/docs/getting-started/add-a-project/).
