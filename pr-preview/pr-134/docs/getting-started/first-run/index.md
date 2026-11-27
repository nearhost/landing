# First run

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-134/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-134/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-134/docs/getting-started/install.md.

What Nearhost shows the first time you start it, and when it asks for your password or, on Windows, your approval.

Start the interface with:

```sh
nearhost
```

It shows Nearhost, which serves your projects. With none running, it starts one in the background first, so the proxy and every enabled project run whether or not this window stays open. It creates the local certificate authority, "Nearhost Local CA", if it does not exist yet. Its key is kept in Nearhost's data folder, not in `~/.config`. See [The local CA](https://nearhost.dev/pr-preview/pr-134/docs/concepts/tls-and-the-proxy.md#the-local-ca).

## Nothing to serve yet

With no projects, the screen shows the Nearhost mark and "Nothing to serve yet.", with the two ways in:

```text
n  add a project on this machine or a server
s  add a server you reach over SSH
```

From Nearhost 0.12.0, once you have added a server, a third line appears:

```text
c  connect a server, so its agents reach Nearhost
```

Press `c` to connect the server without adding a project first, so a coding agent working there can ask Nearhost to add one. With several servers, Nearhost asks which. See [Coding agents](https://nearhost.dev/pr-preview/pr-134/docs/coding-agents.md).

Below them are the folder you started in, whether the certificate authority is trusted, the proxy's ports, and, from Nearhost 0.8.0, a link to Nearhost's page at `https://nearhost.localhost:6327`, or on the port `--web-port` gives, unless that port was taken or `--web-port 0` turned it off. See [TLS and the proxy](https://nearhost.dev/pr-preview/pr-134/docs/concepts/tls-and-the-proxy.md). Press `n` to serve a project from this machine, or from a server you have added. Press `s` first if the project is on a machine you reach over SSH. See [Add a server](https://nearhost.dev/pr-preview/pr-134/docs/getting-started/add-a-server.md) and [Add a project](https://nearhost.dev/pr-preview/pr-134/docs/getting-started/add-a-project.md).

## Welcome to Nearhost

While your system does not trust the certificate authority, a box titled "Welcome to Nearhost" opens over the screen. It says what will ask for your password:

- now: trusting the local certificate authority, so browsers accept HTTPS from Nearhost's web server
- later: adding names to `/etc/hosts`

On Windows it says both ask for your approval, and names the hosts file as `C:\Windows\System32\drivers\etc\hosts`.

Press `enter` to trust it now, or `s` to skip. Skipping lasts until you next start Nearhost, and the box comes back while the authority is still untrusted. Once it is trusted you see "The local CA is now trusted." and the box does not appear again.

Trusting installs the authority's root certificate into your system trust store: the System keychain on macOS, your distribution's certificate store on Linux, your user's certificate store on Windows. It is what lets your browser open `https://<alias>` without a warning.

Firefox, and Chromium-based browsers on Linux, keep their own stores. Nearhost updates those too when `certutil` is installed. See [Install](https://nearhost.dev/pr-preview/pr-134/docs/getting-started/install.md) for the one-line setup. On Windows, every browser uses the Windows store, Firefox from version 120, so there is usually nothing more to set up. Firefox can be set not to read it, and `nearhost doctor` warns when it is.

If you skip, the proxy still runs and Home shows `local CA ● not trusted. Run nearhost trust`. You can trust it from a terminal at any time, and `nearhost untrust` reverses it:

```sh
nearhost trust
```

## The password box

On macOS and Linux, two things need root: trusting the certificate authority, and adding your projects' names to `/etc/hosts`. For both, Nearhost asks in a box titled "Password needed", which says why:

```text
Nearhost needs your password to add myapp.test to /etc/hosts.
```

Type your password and press `enter`, or `esc` to cancel. The password goes straight to `sudo` and nowhere else: it is not shown, logged or saved.

- **A wrong password** shows "Sorry, try again." After three, the step stops and nothing is changed.
- **Cancelling** leaves things as they were. The certificate authority stays untrusted, or the project stays stopped until you start it again.
- **sudo remembers it** for a few minutes, as it does in a terminal, so a second step soon after does not ask again.
- **If sudo asks every time**, because it is set up not to remember, Nearhost hands over to the terminal for the password, then comes back.

`/etc/hosts` is only changed when a project starts and its names are missing, so most starts ask for nothing. See [The hosts file](https://nearhost.dev/pr-preview/pr-134/docs/concepts/the-hosts-file.md).

## On Windows

On Windows, Nearhost shows no password box. Windows asks in its own dialogs instead:

- **Trusting the certificate authority** opens a Windows security warning that asks whether to install the certificate. Choose Yes. It needs no administrator rights.
- **Each change to the hosts file** opens a User Account Control prompt, because the file needs administrator rights. Windows does not remember the approval, so each change asks again, including one a coding agent asks for. If you choose No, the hosts file stays as it was and the project stays stopped.

As on macOS and Linux, the hosts file is only changed when a project starts and its names are missing, so most starts ask for nothing.

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
- `page`: a link to Nearhost's page at `https://nearhost.localhost:6327`, or the port `--web-port` gives, once the proxy is serving. It is left out when that port was taken, or when `--web-port 0` turned the page off. Needs Nearhost 0.8.0 or later.
- `local CA`: whether it is trusted, and when it expires
- `hosts`: whether the hosts file has every project's name
- `config`: the path of the config file
- `running`: how many projects are running, on how many servers

Two rows stay at the bottom of the sidebar, `passthroughs` and `documents`, which show what coding agents have opened, and `none` when nothing is. See [Browser previews](https://nearhost.dev/pr-preview/pr-134/docs/coding-agents/browser-previews.md#see-what-is-open).

When something needs you, a problems section lists it, with why it happened and how to fix it. When something you do fails, such as a save or a start, an alert box opens over the screen with the same: `enter` or `esc` closes it, and `c` copies its command. Below that is the recent log. Press `l` for the full-screen log, `/` to filter the sidebar by name, and `h` to come back to Home. `?` lists every key. See [Keyboard shortcuts](https://nearhost.dev/pr-preview/pr-134/docs/reference/keyboard-shortcuts.md).

## Quitting

Press `q` to quit. What happens to the Nearhost behind the interface depends on who started it:

- **The interface started it,** because none was running, and no other interface follows it. Nearhost asks `Stop Nearhost, or leave it running in the background?` Choose `Stop` to stop it, as quitting always did, or `Leave running` to keep your projects served with no terminal open. Tick `Don't ask again` to save the choice as [`keep_running`](https://nearhost.dev/pr-preview/pr-134/docs/reference/config.md) in the config.
- **Anything else started it:** `nearhost -d`, a service, or another interface that is still open. Quitting leaves it running, and prints `Nearhost is still running in the background. Stop it with nearhost stop.`

`ctrl+c` never asks: where `q` would ask, it stops Nearhost. To stop one that runs in the background, from any terminal, run `nearhost stop`. `nearhost status` shows what it serves. See [Run Nearhost in the background](https://nearhost.dev/pr-preview/pr-134/docs/guides/run-in-the-background.md).

Next: [Add a server](https://nearhost.dev/pr-preview/pr-134/docs/getting-started/add-a-server.md) or, for a project on this machine, [Add a project](https://nearhost.dev/pr-preview/pr-134/docs/getting-started/add-a-project.md).
