# Errors

> For AI agents: the full Nearhost documentation index is at https://nearhost.dev/pr-preview/pr-140/llms.txt. Every docs page is also available as Markdown: replace the trailing slash with `.md`, so https://nearhost.dev/pr-preview/pr-140/docs/getting-started/install/ becomes https://nearhost.dev/pr-preview/pr-140/docs/getting-started/install.md.

Every code Nearhost puts on an error, a warning or a note, and what it means.

Every error, warning and note Nearhost shows has a code, such as `port.needs-permission`. A code names one problem wherever it shows up, and it never changes once released, so you can search for it here or match on it in a script. Each entry below says what the code means. Where the fix is always the same, it gives the fix too; otherwise the message itself says what to do, as it names the path, port or server involved.

Where codes show up:

- `nearhost <command> --verbose` prints the code under the title of an error, a warning or a note. See [Errors, warnings and notes](https://nearhost.dev/pr-preview/pr-140/docs/reference/cli.md#errors-warnings-and-notes).
- The core log has it in brackets, as in `error [port.needs-permission] HTTPS port 443 needs permission to bind.` See [The core's log](https://nearhost.dev/pr-preview/pr-140/docs/guides/run-in-the-background.md#the-cores-log).
- `nearhost doctor --verbose` prints a `code:` line under each row that did not pass, and `nearhost doctor --json` gives each check and finding a `code`.
- The APIs answer an error with its `code`, and a `type` that links to its entry on this page. See [Agent API](https://nearhost.dev/pr-preview/pr-140/docs/coding-agents/how-it-works.md#errors-and-warnings).

An entry is an error, a warning or a note, as Nearhost labels it. The status is the HTTP status the APIs answer with when the code is the error of a request; an entry without one is never an API error.

## General

<h3 id="cli.usage"><code>cli.usage</code></h3>

**Error** · status 400

A command was given arguments or flags it does not take.

<h3 id="crash"><code>crash</code></h3>

**Error** · status 500

Nearhost stopped unexpectedly; the details are in a crash file.

<h3 id="interrupted"><code>interrupted</code></h3>

**Error** · status 500

The command was interrupted before it finished.

<h3 id="unexpected"><code>unexpected</code></h3>

**Error** · status 500

Something failed that Nearhost has no explanation for; the message holds the error as it came.

## Ports

See [Port 443 or 80 already in use](https://nearhost.dev/pr-preview/pr-140/docs/troubleshooting/troubleshooting.md#port-443-or-80-already-in-use).

<h3 id="port.in-use"><code>port.in-use</code></h3>

**Error** · status 409

Another program is already listening on a port Nearhost needs.

<h3 id="port.needs-permission"><code>port.needs-permission</code></h3>

**Error** · status 403

Nearhost may not listen on a port below 1024, such as 443 or 80, without permission.

## Nearhost in the background

See [Run Nearhost in the background](https://nearhost.dev/pr-preview/pr-140/docs/guides/run-in-the-background.md).

<h3 id="core.already-running"><code>core.already-running</code></h3>

**Error** · status 409

Nearhost is already running for this config.

<h3 id="core.api-mismatch"><code>core.api-mismatch</code></h3>

**Error** · status 409

The running Nearhost is a different version that this copy cannot talk to.

<h3 id="core.docker-missing"><code>core.docker-missing</code></h3>

**Note**

docker is not on the PATH of Nearhost in the background; only Docker projects need it.

<h3 id="core.docker-unreachable"><code>core.docker-unreachable</code></h3>

**Warning**

Docker does not answer Nearhost in the background.

<h3 id="core.in-terminal"><code>core.in-terminal</code></h3>

**Note**

Nearhost is already running in a terminal, so nearhost -d leaves it there rather than start another in the background.

<h3 id="core.log-unavailable"><code>core.log-unavailable</code></h3>

**Warning**

The core could not send its standard error to its log, so a crash may not be logged.

<h3 id="core.lost"><code>core.lost</code></h3>

**Error** · status 503

The connection to the running Nearhost was lost.

<h3 id="core.no-desktop"><code>core.no-desktop</code></h3>

**Warning**

Nearhost in the background runs outside the desktop session, so it cannot open links.

<h3 id="core.no-enabled-projects"><code>core.no-enabled-projects</code></h3>

**Error** · status 409

Every project in the config is disabled, and none was named to start.

<h3 id="core.no-projects"><code>core.no-projects</code></h3>

**Error** · status 404

The config has no projects, so there is nothing to start.

<h3 id="core.no-reload"><code>core.no-reload</code></h3>

**Note**

The running Nearhost serves the projects it was started with and does not reload the config.

<h3 id="core.not-running"><code>core.not-running</code></h3>

**Error** · status 503

Nearhost is not running.

Start it in the background:

```sh
nearhost -d
```

Or open its interface:

```sh
nearhost
```

<h3 id="core.nothing-to-serve"><code>core.nothing-to-serve</code></h3>

**Error** · status 409

nearhost up found no project it can serve, and none still starting, so it stopped.

<h3 id="core.other-config"><code>core.other-config</code></h3>

**Error** · status 409

The running Nearhost uses a different config file.

<h3 id="core.other-version"><code>core.other-version</code></h3>

**Warning**

The running Nearhost is another release than this copy.

<h3 id="core.outdated"><code>core.outdated</code></h3>

**Note**

The running Nearhost is an older release than this copy, and runs it once restarted.

<h3 id="core.run-dir-failed"><code>core.run-dir-failed</code></h3>

**Error** · status 500

Nearhost could not create its run directory, which holds its sockets and its lock.

<h3 id="core.session-unchecked"><code>core.session-unchecked</code></h3>

**Note**

Nearhost in the background could not tell whether it runs in the sign-in session, so it may not open links.

<h3 id="core.ssh-agent-unreachable"><code>core.ssh-agent-unreachable</code></h3>

**Warning**

The SSH agent Nearhost in the background was given does not answer.

<h3 id="core.ssh-agent-unset"><code>core.ssh-agent-unset</code></h3>

**Note**

SSH_AUTH_SOCK is not set for Nearhost in the background, so ssh uses the agent in the SSH config, if any.

<h3 id="core.still-starting"><code>core.still-starting</code></h3>

**Error** · status 503

Nearhost is still starting in the background.

<h3 id="core.stop-timeout"><code>core.stop-timeout</code></h3>

**Error** · status 504

Nearhost was asked to stop and had not stopped in time.

<h3 id="core.stopped-while-starting"><code>core.stopped-while-starting</code></h3>

**Error** · status 503

Nearhost stopped while it was starting in the background.

<h3 id="core.unknown-project"><code>core.unknown-project</code></h3>

**Error** · status 404

No project in the config has the name given.

## The service

See [Start it at login](https://nearhost.dev/pr-preview/pr-140/docs/guides/run-in-the-background.md#start-it-at-login).

<h3 id="service.as-root"><code>service.as-root</code></h3>

**Error** · status 403

The service must be installed as the user who runs it, not as root.

<h3 id="service.cannot-bind"><code>service.cannot-bind</code></h3>

**Error** · status 409

The service cannot run this copy of nearhost, as it lacks permission to use ports 443 and 80.

<h3 id="service.copy"><code>service.copy</code></h3>

**Error** · status 409

This copy of nearhost cannot be run by a service later, such as a one-run copy.

<h3 id="service.log-folder-missing"><code>service.log-folder-missing</code></h3>

**Warning**

The folder of the service's log is missing, so the service cannot start again.

<h3 id="service.manager-failed"><code>service.manager-failed</code></h3>

**Error** · status 502

The system's service manager refused to install, start or remove the Nearhost service.

<h3 id="service.no-user-manager"><code>service.no-user-manager</code></h3>

**Error** · status 503

There is no user service manager to run the Nearhost service.

<h3 id="service.node-version"><code>service.node-version</code></h3>

**Note**

The service runs nearhost from a Node version's folder, so changing the default Node version needs a new install.

<h3 id="service.not-installed"><code>service.not-installed</code></h3>

**Note**

The Nearhost service is not installed, so Nearhost does not start at login.

To start Nearhost at login, install the service:

```sh
nearhost service install
```

<h3 id="service.not-running"><code>service.not-running</code></h3>

**Warning**

The Nearhost service is installed but not running.

Start it:

```sh
nearhost -d
```

<h3 id="service.not-signed-in"><code>service.not-signed-in</code></h3>

**Note**

You are not signed in to Windows, so the service could not start Nearhost, and it was started directly.

<h3 id="service.other-copy"><code>service.other-copy</code></h3>

**Warning**

The installed service runs another copy of nearhost than this one.

<h3 id="service.own-settings"><code>service.own-settings</code></h3>

**Note**

A service is installed, but it runs with its own settings, so Nearhost was started directly with the ones given.

<h3 id="service.restarting"><code>service.restarting</code></h3>

**Warning**

The service is starting Nearhost again after it stopped.

<h3 id="service.ssh-agent-changes"><code>service.ssh-agent-changes</code></h3>

**Warning**

SSH_AUTH_SOCK points at an agent socket that changes at each login, so the service cannot use it.

<h3 id="service.ssh-agent-unset"><code>service.ssh-agent-unset</code></h3>

**Note**

SSH_AUTH_SOCK is not set, so the service uses the agent the login session provides.

<h3 id="service.start-failed"><code>service.start-failed</code></h3>

**Warning**

Starting Nearhost through its service failed, so it was started directly.

<h3 id="service.takes-over"><code>service.takes-over</code></h3>

**Note**

Nearhost runs, started another way, and the installed service takes over at the next login.

<h3 id="service.unreadable"><code>service.unreadable</code></h3>

**Warning**

The installed service's definition cannot be read, as one edited by hand, so it is removed as it is.

<h3 id="service.unsupported"><code>service.unsupported</code></h3>

**Error** · status 501

The Nearhost service is not supported on this system.

## config.yaml

See [config.yaml](https://nearhost.dev/pr-preview/pr-140/docs/reference/config.md).

<h3 id="config.bad-alias"><code>config.bad-alias</code></h3>

**Error** · status 400

A project's main name is not a valid domain, so nearhost up does not start it.

<h3 id="config.invalid"><code>config.invalid</code></h3>

**Error** · status 400

The config file has a value Nearhost cannot use.

<h3 id="config.loopback-own-port"><code>config.loopback-own-port</code></h3>

**Error** · status 409

A project's loopback route is on a port Nearhost itself listens on, so it is not forwarded.

<h3 id="config.missing"><code>config.missing</code></h3>

**Warning**

The config file named with --config does not exist yet.

<h3 id="config.no-home"><code>config.no-home</code></h3>

**Error** · status 500

Nearhost cannot tell where its files are, as HOME (or XDG_CONFIG_HOME) is not set.

<h3 id="config.pattern-conflict"><code>config.pattern-conflict</code></h3>

**Warning**

A project serves a host under another project's pattern, and gets its requests.

<h3 id="config.unknown-keys"><code>config.unknown-keys</code></h3>

**Error** · status 400

The config file has keys Nearhost does not know, so saving it would lose them.

## The hosts file

See [The hosts file](https://nearhost.dev/pr-preview/pr-140/docs/concepts/the-hosts-file.md).

<h3 id="hosts.core-not-told"><code>hosts.core-not-told</code></h3>

**Warning**

The hosts file is updated, but the running Nearhost could not be told.

<h3 id="hosts.dns-unchecked"><code>hosts.dns-unchecked</code></h3>

**Note**

Nearhost could not ask DNS directly, so it did not check whether real-domain names resolve elsewhere.

<h3 id="hosts.helper-refused"><code>hosts.helper-refused</code></h3>

**Error** · status 400

The elevated hosts helper refused its input or report file.

<h3 id="hosts.needs-update"><code>hosts.needs-update</code></h3>

**Warning** · status 409

The hosts file does not yet list the names Nearhost serves.

<h3 id="hosts.overlap"><code>hosts.overlap</code></h3>

**Warning**

Two host patterns overlap; a name both match goes to the more specific.

<h3 id="hosts.public"><code>hosts.public</code></h3>

**Warning**

A name the project is served at is a real name, so the real site is out of reach while the project is enabled.

<h3 id="hosts.read-only"><code>hosts.read-only</code></h3>

**Error** · status 403

The hosts file is read-only, so Nearhost cannot update it.

<h3 id="hosts.unreadable"><code>hosts.unreadable</code></h3>

**Error** · status 500

The hosts file cannot be read.

<h3 id="hosts.unresolved"><code>hosts.unresolved</code></h3>

**Error** · status 409

A name the project is served at does not resolve to this machine and is not in the hosts file.

<h3 id="hosts.unresolved-pattern"><code>hosts.unresolved-pattern</code></h3>

**Error** · status 409

A pattern the project is served at does not resolve to this machine.

## The local CA

See [The local CA](https://nearhost.dev/pr-preview/pr-140/docs/concepts/tls-and-the-proxy.md#the-local-ca).

<h3 id="ca.browsers-not-trusted"><code>ca.browsers-not-trusted</code></h3>

**Warning**

The browser trust stores (NSS) do not trust the local CA.

<h3 id="ca.firefox-roots-off"><code>ca.firefox-roots-off</code></h3>

**Warning**

Firefox is set not to read Windows' trusted roots, where the local CA is trusted.

<h3 id="ca.move-failed"><code>ca.move-failed</code></h3>

**Warning**

Nearhost could not move its local CA to the data directory, or could not delete the old copy.

<h3 id="ca.not-created"><code>ca.not-created</code></h3>

**Error** · status 409

The local CA has not been created yet.

Create the local CA and trust it:

```sh
nearhost trust
```

<h3 id="ca.not-private"><code>ca.not-private</code></h3>

**Warning**

Nearhost could not make the folder that holds its local CA private to the user.

<h3 id="ca.not-trusted"><code>ca.not-trusted</code></h3>

**Error** · status 409

The system trust store does not trust the local CA.

Trust the local CA:

```sh
nearhost trust
```

<h3 id="ca.old-copy"><code>ca.old-copy</code></h3>

**Warning**

An old folder still holds a copy of the local CA's private key.

<h3 id="ca.unreadable"><code>ca.unreadable</code></h3>

**Error** · status 500

The local CA's certificate cannot be read.

<h3 id="trust.no-sudo"><code>trust.no-sudo</code></h3>

**Error** · status 500

sudo, which trusting or untrusting the local CA needs, is not installed.

<h3 id="trust.not-removed"><code>trust.not-removed</code></h3>

**Error** · status 409

The local CA was not removed from a trust store, and running untrust again can finish it.

<h3 id="trust.remains"><code>trust.remains</code></h3>

**Error** · status 409

Something Nearhost cannot change still trusts the local CA.

## SSH and forwards

See [SSH transport](https://nearhost.dev/pr-preview/pr-140/docs/concepts/ssh-transport.md).

<h3 id="forward.failed"><code>forward.failed</code></h3>

**Error** · status 500

A port could not be forwarded to or from a server.

<h3 id="forward.reconnecting"><code>forward.reconnecting</code></h3>

**Warning**

A forwarded port is being connected again, and serves nothing until it is.

<h3 id="passthrough.closed"><code>passthrough.closed</code></h3>

**Warning**

Nearhost closed a port it had opened for a coding agent, as the server or the port went away.

<h3 id="ssh.agent-missing"><code>ssh.agent-missing</code></h3>

**Note**

The OpenSSH Authentication Agent is not installed on Windows.

<h3 id="ssh.agent-stopped"><code>ssh.agent-stopped</code></h3>

**Note**

The OpenSSH Authentication Agent service on Windows is not running.

<h3 id="ssh.auth-failed"><code>ssh.auth-failed</code></h3>

**Error** · status 403

SSH refused to log in to a server.

<h3 id="ssh.config-conflict"><code>ssh.config-conflict</code></h3>

**Error** · status 409

The user's SSH configuration for a server sets options Nearhost cannot keep out of its own connections.

<h3 id="ssh.not-found"><code>ssh.not-found</code></h3>

**Error** · status 503

ssh cannot be run, from this shell's PATH or that of Nearhost in the background, so Nearhost cannot reach servers.

<h3 id="ssh.other-vendor"><code>ssh.other-vendor</code></h3>

**Warning**

The ssh Nearhost runs on Windows is not Microsoft's OpenSSH.

<h3 id="ssh.socket-path-too-long"><code>ssh.socket-path-too-long</code></h3>

**Error** · status 400

The path of an SSH socket is longer than the system allows.

<h3 id="ssh.stale-master"><code>ssh.stale-master</code></h3>

**Warning**

An SSH connection left by an earlier run could not be ended.

<h3 id="ssh.too-old"><code>ssh.too-old</code></h3>

**Warning**

The ssh on PATH is older than the one Nearhost needs.

<h3 id="ssh.unreachable"><code>ssh.unreachable</code></h3>

**Error** · status 503

A server cannot be reached over SSH.

<h3 id="ssh.version-unknown"><code>ssh.version-unknown</code></h3>

**Note**

Nearhost could not read the version of the ssh on PATH.

## Docker

See [Callbacks from Docker containers](https://nearhost.dev/pr-preview/pr-140/docs/guides/container-callbacks.md).

<h3 id="docker.ca"><code>docker.ca</code></h3>

**Warning**

A container calls a name Nearhost serves and does not trust Nearhost's root certificate.

<h3 id="docker.clients"><code>docker.clients</code></h3>

**Warning**

A container calls a name Nearhost serves, and Nearhost does not accept requests from Docker's network.

<h3 id="docker.compose-depth"><code>docker.compose-depth</code></h3>

**Warning**

The Compose file nests or repeats merges too much to check.

<h3 id="docker.compose-file"><code>docker.compose-file</code></h3>

**Note**

COMPOSE_FILE is set, and Nearhost checks only the Compose files Compose reads by default.

<h3 id="docker.compose-parse"><code>docker.compose-parse</code></h3>

**Warning**

The Compose file is not valid YAML, so its services were not checked.

<h3 id="docker.host-gateway"><code>docker.host-gateway</code></h3>

**Warning**

A container calls a name that resolves to itself or to the internet, not to Nearhost.

<h3 id="docker.networks-failed"><code>docker.networks-failed</code></h3>

**Warning**

Nearhost could not start accepting requests from new Docker networks.

<h3 id="docker.unreachable"><code>docker.unreachable</code></h3>

**Warning**

Docker did not answer, so requests from containers are not accepted yet.

## Updates

See [nearhost update](https://nearhost.dev/pr-preview/pr-140/docs/reference/cli.md#nearhost-update).

<h3 id="update.available"><code>update.available</code></h3>

**Note**

A newer release of Nearhost is available.

Update it:

```sh
nearhost update
```

<h3 id="update.check-failed"><code>update.check-failed</code></h3>

**Error** · status 503

Nearhost could not find out whether a newer release exists.

<h3 id="update.failed"><code>update.failed</code></h3>

**Error** · status 500

The update ran, but the installed nearhost is not the new release.

<h3 id="update.next-homebrew"><code>update.next-homebrew</code></h3>

**Error** · status 409

Betas are not published to Homebrew.

## The interface

<h3 id="interface.address-too-long"><code>interface.address-too-long</code></h3>

**Warning**

An address in the log is too long to show, so a click does not open it.

<h3 id="interface.answer-not-saved"><code>interface.answer-not-saved</code></h3>

**Warning**

The quit box's answer could not be saved, so it asks again next time.

<h3 id="interface.change-ignored"><code>interface.change-ignored</code></h3>

**Warning**

A change to the config file could not be applied and was ignored.

<h3 id="interface.copy-failed"><code>interface.copy-failed</code></h3>

**Warning**

The system's clipboard tool failed on a copy; the terminal may still have copied it.

<h3 id="interface.flags-ignored"><code>interface.flags-ignored</code></h3>

**Note**

Serve flags given to the interface do nothing to the Nearhost already running, which keeps its settings.

<h3 id="interface.log-missed"><code>interface.log-missed</code></h3>

**Note**

The interface fell behind the running Nearhost, so some log lines were missed.

<h3 id="interface.no-terminal"><code>interface.no-terminal</code></h3>

**Error** · status 400

The interface needs a terminal, and there is none.

Run it in the background:

```sh
nearhost -d
```

Or serve without the interface:

```sh
nearhost up
```

<h3 id="interface.nothing-to-copy"><code>interface.nothing-to-copy</code></h3>

**Warning**

What the interface was asked to copy has nothing it can copy.

<h3 id="interface.open-failed"><code>interface.open-failed</code></h3>

**Warning**

The interface could not open a link in the browser.

<h3 id="interface.password-cancelled"><code>interface.password-cancelled</code></h3>

**Error** · status 403

The password was cancelled, so what needed it was not done.

<h3 id="interface.prompt-declined"><code>interface.prompt-declined</code></h3>

**Error** · status 403

The Windows prompt was declined, so what needed it was not done.

## Adding and exporting projects

See [Add a project](https://nearhost.dev/pr-preview/pr-140/docs/getting-started/add-a-project.md).

<h3 id="add.alias-taken"><code>add.alias-taken</code></h3>

**Error** · status 409

The name the project asks to be served at is already another project's.

<h3 id="add.bad-alias"><code>add.bad-alias</code></h3>

**Error** · status 400

The domain the project would be served at is not one Nearhost can serve, so nothing was saved.

<h3 id="add.bad-config"><code>add.bad-config</code></h3>

**Error** · status 400

The config file cannot be read, so nothing is added to it.

<h3 id="add.bad-name"><code>add.bad-name</code></h3>

**Error** · status 400

The project's name is not one Nearhost can use.

<h3 id="add.host-taken"><code>add.host-taken</code></h3>

**Note**

A name the project would be served at is already another project's, so it is left out.

<h3 id="add.lone-port"><code>add.lone-port</code></h3>

**Warning**

Discovery found one port only, so nearhost add made it the web route.

<h3 id="add.name-taken"><code>add.name-taken</code></h3>

**Error** · status 409

Another project already has the name the project would be added under.

<h3 id="add.needs-approval"><code>add.needs-approval</code></h3>

**Error** · status 409

The project asks for things that need approval, and there is nobody to ask.

<h3 id="add.no-directory"><code>add.no-directory</code></h3>

**Error** · status 404

There is no directory at the path given to nearhost add.

<h3 id="add.no-web-port"><code>add.no-web-port</code></h3>

**Error** · status 400

nearhost add could not tell which port serves the project, so nothing was saved.

<h3 id="add.relative-path"><code>add.relative-path</code></h3>

**Error** · status 400

A project on a server was given a relative path, which Nearhost cannot find there.

<h3 id="add.server-changed"><code>add.server-changed</code></h3>

**Error** · status 409

The server was added meanwhile and is reached another way, so nothing was saved.

<h3 id="add.unknown-server"><code>add.unknown-server</code></h3>

**Error** · status 404

The server named is not in the config.

<h3 id="discovery.incomplete"><code>discovery.incomplete</code></h3>

**Warning**

Something discovery reads, such as a preset or a project file, could not be read, so it went on without it.

<h3 id="export.changed"><code>export.changed</code></h3>

**Error** · status 409

The project changed while it was exported, so the file written is not approved.

<h3 id="export.exists"><code>export.exists</code></h3>

**Error** · status 409

The project already has a .nearhostrc, and export does not replace one unasked.

<h3 id="export.no-project"><code>export.no-project</code></h3>

**Error** · status 404

No Nearhost project contains the folder, or none has the name given.

<h3 id="export.replaced-pending"><code>export.replaced-pending</code></h3>

**Note**

The .nearhostrc change that waited for approval was replaced with what is served now.

## Presets

See [Presets and registries](https://nearhost.dev/pr-preview/pr-140/docs/concepts/presets-and-registries.md).

<h3 id="preset.local-file"><code>preset.local-file</code></h3>

**Error** · status 409

The preset is a local file, so there is no registry to update it from.

<h3 id="preset.not-enabled"><code>preset.not-enabled</code></h3>

**Error** · status 404

The preset named is not enabled.

<h3 id="preset.not-updated"><code>preset.not-updated</code></h3>

**Warning**

A preset could not be updated from its registry.

<h3 id="preset.registry-in-use"><code>preset.registry-in-use</code></h3>

**Error** · status 409

Presets from the registry are enabled, so it cannot be removed.

<h3 id="preset.registry-not-trusted"><code>preset.registry-not-trusted</code></h3>

**Error** · status 502

A registry's index could not be fetched or checked, so it was not trusted and nothing was saved.

<h3 id="preset.registry-unknown"><code>preset.registry-unknown</code></h3>

**Error** · status 404

No registry is trusted under the name given.

<h3 id="preset.registry-unreadable"><code>preset.registry-unreadable</code></h3>

**Warning**

A trusted registry of presets cannot be read, so its presets are left out.

<h3 id="preset.unknown"><code>preset.unknown</code></h3>

**Error** · status 404

No preset or registry has the name given.

<h3 id="preset.updates-failed"><code>preset.updates-failed</code></h3>

**Error** · status 502

Some of the presets asked for could not be updated from their registries.

<h3 id="presets.note"><code>presets.note</code></h3>

**Note**

A note from the preset that matched the project.

## Project checks

See [Project checks](https://nearhost.dev/pr-preview/pr-140/docs/reference/cli.md#project-checks).

<h3 id="doctor.checks-failed"><code>doctor.checks-failed</code></h3>

**Error** · status 409

One or more of nearhost doctor's checks failed.

<h3 id="doctor.not-checked"><code>doctor.not-checked</code></h3>

**Note**

nearhost doctor could not run a check, and says what it did not check.

<h3 id="nearhostrc.gone"><code>nearhostrc.gone</code></h3>

**Warning**

The project's .nearhostrc is gone or cannot be read, and Nearhost still serves what it last said.

<h3 id="nearhostrc.invalid"><code>nearhostrc.invalid</code></h3>

**Error** · status 400

The project's .nearhostrc cannot be read.

<h3 id="nearhostrc.not-applied"><code>nearhostrc.not-applied</code></h3>

**Warning**

The project's .nearhostrc has changed since Nearhost last read it.

<h3 id="nearhostrc.pending"><code>nearhostrc.pending</code></h3>

**Warning**

The project's .nearhostrc has changes that wait for approval.

<h3 id="nearhostrc.unset-variable"><code>nearhostrc.unset-variable</code></h3>

**Error** · status 400

The project's .nearhostrc uses a variable that is not set.

<h3 id="nearhostrc.version"><code>nearhostrc.version</code></h3>

**Error** · status 409

The project's .nearhostrc needs a newer Nearhost.

<h3 id="projects.none"><code>projects.none</code></h3>

**Note**

There are no projects to list or serve yet.

<h3 id="projects.unchecked"><code>projects.unchecked</code></h3>

**Note**

Nearhost could not run the project's checks, for example because its server is not reachable.

<h3 id="routes.not-listening"><code>routes.not-listening</code></h3>

**Warning**

Nothing listens on a port Nearhost serves for the project.

<h3 id="routes.stale-port"><code>routes.stale-port</code></h3>

**Note**

A web route's port matches nothing in the project's files any more.

<h3 id="routes.unserved-host"><code>routes.unserved-host</code></h3>

**Warning**

The project's settings name a host that Nearhost does not serve.

<h3 id="routes.unserved-port"><code>routes.unserved-port</code></h3>

**Warning**

A port in the project's files looks like a web server, but the project has no route for it.

<h3 id="advice"><code>advice.&lt;id&gt;</code></h3>

**Warning**

Advice from the preset that matched the project.

`<id>` is the advisory's id, so `advice.vite-default-port` is the `vite-default-port` advisory. See [Advisories](https://nearhost.dev/pr-preview/pr-140/docs/reference/advisories.md) for each one and its fix.

## Coding agents

See [How agents reach Nearhost](https://nearhost.dev/pr-preview/pr-140/docs/coding-agents/how-it-works.md).

<h3 id="agent.bad-path"><code>agent.bad-path</code></h3>

**Error** · status 400

A path in an agent's request is not one Nearhost takes, such as a relative or network path.

<h3 id="agent.bad-request"><code>agent.bad-request</code></h3>

**Error** · status 400

An agent's request, or a value in it, is not what the call takes.

<h3 id="agent.closed-while-opening"><code>agent.closed-while-opening</code></h3>

**Error** · status 409

The agent's session closed while its passthrough opened, so the passthrough was closed again.

<h3 id="agent.doctor-busy"><code>agent.doctor-busy</code></h3>

**Error** · status 429

A doctor run for the agent's server is already going, or started moments ago.

<h3 id="agent.doctor-failed"><code>agent.doctor-failed</code></h3>

**Error** · status 502

The doctor could not check what an agent asked about.

<h3 id="agent.document-failed"><code>agent.document-failed</code></h3>

**Error** · status 502

Nearhost could not read or show the document an agent asked to show.

<h3 id="agent.document-not-there"><code>agent.document-not-there</code></h3>

**Error** · status 404

The document an agent asked to show is not there.

<h3 id="agent.grants-failed"><code>agent.grants-failed</code></h3>

**Error** · status 500

Nearhost could not read the grants that let an agent's requests open without asking.

<h3 id="agent.local-passthrough"><code>agent.local-passthrough</code></h3>

**Error** · status 400

A passthrough was asked for on the laptop's own socket, and passthroughs forward a server's port.

<h3 id="agent.nearhostrc-unread"><code>agent.nearhostrc-unread</code></h3>

**Error** · status 422

A project's .nearhostrc could not be taken into account when an agent asked to reload it.

<h3 id="agent.no-page"><code>agent.no-page</code></h3>

**Error** · status 409

Nearhost's page is not served, so it cannot show an agent's document.

<h3 id="agent.no-project"><code>agent.no-project</code></h3>

**Error** · status 404

No project in Nearhost holds the path the agent asked about.

<h3 id="agent.no-reviewer"><code>agent.no-reviewer</code></h3>

**Error** · status 409

An agent's request needs the user's answer, and Nearhost has no page or window open to ask in.

<h3 id="agent.no-such-call"><code>agent.no-such-call</code></h3>

**Error** · status 404

The agent API has no call at the path asked for, or this Nearhost does not have that call.

<h3 id="agent.no-token"><code>agent.no-token</code></h3>

**Error** · status 401

A request to the agent API's loopback port came without its token, as from an older copy of the skill.

<h3 id="agent.not-a-directory"><code>agent.not-a-directory</code></h3>

**Error** · status 404

The directory an agent asked the doctor about is not there.

<h3 id="agent.not-a-document"><code>agent.not-a-document</code></h3>

**Error** · status 400

What an agent asked to show is not a document Nearhost can show.

<h3 id="agent.not-connected"><code>agent.not-connected</code></h3>

**Error** · status 409

Nearhost is not connected to the agent's server.

<h3 id="agent.passthrough-failed"><code>agent.passthrough-failed</code></h3>

**Error** · status 502

A passthrough's forward could not be opened or closed.

<h3 id="agent.port-held"><code>agent.port-held</code></h3>

**Error** · status 409

Another agent or session has the port passed through, or waiting for approval.

<h3 id="agent.refused"><code>agent.refused</code></h3>

**Error** · status 429

The user said No to a request of the same kind from the agent's machine moments ago, so this one is refused for now.

<h3 id="agent.reload-failed"><code>agent.reload-failed</code></h3>

**Error** · status 502

Nearhost could not read a project's .nearhostrc again for an agent.

<h3 id="agent.request-gone"><code>agent.request-gone</code></h3>

**Error** · status 404

The proposal, passthrough or document request an agent asked about is not known; it may have ended long ago.

<h3 id="agent.token-revoked"><code>agent.token-revoked</code></h3>

**Error** · status 401

The token an agent sent was revoked or never existed.

<h3 id="agent.too-many-passthroughs"><code>agent.too-many-passthroughs</code></h3>

**Error** · status 429

The agent's server has as many passthroughs open as it may.

<h3 id="agent.too-many-waiting"><code>agent.too-many-waiting</code></h3>

**Error** · status 429

The agent's machine has as many requests waiting for the user as it may.

<h3 id="agents.allow-not-saved"><code>agents.allow-not-saved</code></h3>

**Error** · status 500

A request was answered, but its Always allow could not be saved, so the agent is asked again next time.

<h3 id="agents.approval-waiting"><code>agents.approval-waiting</code></h3>

**Note**

A coding agent asks for something that waits for approval in the interface.

<h3 id="agents.grants-off"><code>agents.grants-off</code></h3>

**Error** · status 503

Grants cannot be read or changed, as the grants file cannot be read or Nearhost does not serve coding agents in this run.

<h3 id="agents.grants-pruned"><code>agents.grants-pruned</code></h3>

**Note**

Grants of projects that are gone were removed.

<h3 id="agents.not-ready"><code>agents.not-ready</code></h3>

**Error** · status 503

Coding agents on a server cannot reach Nearhost yet.

<h3 id="agents.path-too-long"><code>agents.path-too-long</code></h3>

**Error** · status 400

The socket coding agents use would have a path longer than the server allows.

<h3 id="agents.refused"><code>agents.refused</code></h3>

**Error** · status 403

The server's SSH daemon refused to forward the socket coding agents use.

<h3 id="agents.unavailable"><code>agents.unavailable</code></h3>

**Warning**

Coding agents on a server cannot reach Nearhost.

## Documents

See [Documents](https://nearhost.dev/pr-preview/pr-140/docs/coding-agents/documents.md).

<h3 id="documents.changing"><code>documents.changing</code></h3>

**Error** · status 503

The document's folder kept changing while Nearhost checked it.

<h3 id="documents.method-not-allowed"><code>documents.method-not-allowed</code></h3>

**Error** · status 405

The document server was asked with a method it does not take.

<h3 id="documents.missing"><code>documents.missing</code></h3>

**Error** · status 404

The document asked for is not there any more.

<h3 id="documents.not-connected"><code>documents.not-connected</code></h3>

**Error** · status 503

Nearhost is not connected to the server that holds the document.

<h3 id="documents.not-found"><code>documents.not-found</code></h3>

**Error** · status 404

The document server has nothing at the path asked for.

<h3 id="documents.open-failed"><code>documents.open-failed</code></h3>

**Warning**

A document could not be opened in the browser; its address still works.

<h3 id="documents.unreadable"><code>documents.unreadable</code></h3>

**Error** · status 502

The document could not be read.

## Nearhost's page

See [Nearhost's page](https://nearhost.dev/pr-preview/pr-140/docs/guides/run-in-the-background.md#nearhosts-page).

<h3 id="page.answer-failed"><code>page.answer-failed</code></h3>

**Error** · status 502

The core could not take the answer given on the page.

<h3 id="page.answer-not-offered"><code>page.answer-not-offered</code></h3>

**Error** · status 400

The answer sent is not one the request offers.

<h3 id="page.change-answer-invalid"><code>page.change-answer-invalid</code></h3>

**Error** · status 400

The answer sent for a .nearhostrc change is not approve or decline for the change shown.

<h3 id="page.change-changed"><code>page.change-changed</code></h3>

**Error** · status 409

The .nearhostrc change changed again, so the answer was not for the change now waiting.

<h3 id="page.not-opened"><code>page.not-opened</code></h3>

**Error** · status 502

The answer ended the request, as what it asked for could not be opened.

<h3 id="page.proposal-decline-only"><code>page.proposal-decline-only</code></h3>

**Error** · status 400

A proposal can only be declined on the page; reviewing it needs Nearhost on this machine.

<h3 id="page.render-failed"><code>page.render-failed</code></h3>

**Error** · status 500

Nearhost's page could not be drawn.

<h3 id="page.request-ended"><code>page.request-ended</code></h3>

**Warning** · status 409

The request on the page has been answered or has ended.

<h3 id="proxy.app-not-answering"><code>proxy.app-not-answering</code></h3>

**Error** · status 502

Nothing answered on the port a project's app listens on.

<h3 id="proxy.forbidden"><code>proxy.forbidden</code></h3>

**Error** · status 403

A request to Nearhost's page was refused.

<h3 id="proxy.forward-reconnecting"><code>proxy.forward-reconnecting</code></h3>

**Error** · status 502

The forward to a project's server is down while Nearhost reconnects it.

<h3 id="proxy.locked"><code>proxy.locked</code></h3>

**Error** · status 403

Nearhost's page must be opened from this machine first, to get its cookie.

<h3 id="proxy.method-not-allowed"><code>proxy.method-not-allowed</code></h3>

**Error** · status 405

A path of Nearhost's page was asked with a method it does not take.

<h3 id="proxy.not-found"><code>proxy.not-found</code></h3>

**Error** · status 404

Nearhost's page at a project's domain has nothing at the path asked for.

## Networked mode and paired devices

<h3 id="devices.unknown"><code>devices.unknown</code></h3>

**Error** · status 404

No paired device has the name asked for.

<h3 id="network.apply-failed"><code>network.apply-failed</code></h3>

**Error** · status 500

Nearhost could not change how it serves to other devices on the network after the config changed.

<h3 id="network.cert"><code>network.cert</code></h3>

**Error** · status 503

The certificate for Nearhost's page on the network is missing or not the one the config asks for.

<h3 id="network.devices-unavailable"><code>network.devices-unavailable</code></h3>

**Warning**

Nearhost could not open its list of paired devices, so no other device can pair or sign in.

<h3 id="network.dns"><code>network.dns</code></h3>

**Warning**

The name of Nearhost's page on the network does not point at this machine.

<h3 id="network.firewall"><code>network.firewall</code></h3>

**Error** · status 503

The firewall does not let other devices reach Nearhost.

<h3 id="network.firewall-refused"><code>network.firewall-refused</code></h3>

**Error** · status 400

The elevated firewall helper refused a program other than the one running, or its input or report file.

<h3 id="network.no-page"><code>network.no-page</code></h3>

**Error** · status 503

Networked mode needs Nearhost's page, where devices pair, and the page is not served.

<h3 id="network.no-token"><code>network.no-token</code></h3>

**Error** · status 503

Networked mode gets its certificate with a DNS token, and none is set.

<h3 id="network.not-listening"><code>network.not-listening</code></h3>

**Error** · status 503

Networked mode is on, but Nearhost does not serve to the network yet, so no device could reach it.

<h3 id="network.off"><code>network.off</code></h3>

**Error** · status 409

Something was asked that needs networked mode, and the config does not turn it on.

<h3 id="pair.bad-target"><code>pair.bad-target</code></h3>

**Error** · status 400

A device asked to be signed in to an address outside the network domain.

<h3 id="pair.code-invalid"><code>pair.code-invalid</code></h3>

**Error** · status 400

The pairing code typed on a device is wrong, has been used or has expired.

Get a new code on the machine Nearhost runs on:

```sh
nearhost pair
```

<h3 id="pair.link-used"><code>pair.link-used</code></h3>

**Error** · status 403

The link that signs a paired device in to a site has been used or has expired.

<h3 id="pair.needed"><code>pair.needed</code></h3>

**Error** · status 401

A site on the network domain was asked for by a device that is not paired.

<h3 id="pair.too-many-tries"><code>pair.too-many-tries</code></h3>

**Error** · status 429

A device made too many wrong attempts to pair or sign in, so it must wait.

<h3 id="pair.unavailable"><code>pair.unavailable</code></h3>

**Error** · status 503

A site on the network domain needs a paired device, and Nearhost's page, where devices pair, is not served.

## The control API

<h3 id="control.bad-request"><code>control.bad-request</code></h3>

**Error** · status 400

A request to the control API is not what the route takes.

<h3 id="control.method-not-allowed"><code>control.method-not-allowed</code></h3>

**Error** · status 405

A route of the control API was asked with a method it does not take.

<h3 id="control.no-route"><code>control.no-route</code></h3>

**Error** · status 404

The control API has no route at the path asked for; the running Nearhost may be an older release.

<h3 id="control.not-found"><code>control.not-found</code></h3>

**Error** · status 404

The running Nearhost does not have what was asked for, such as a request it no longer keeps.

<h3 id="control.request-ended"><code>control.request-ended</code></h3>

**Error** · status 409

The request to answer has ended: the agent gave up on it, it expired, or someone answered it first.

<h3 id="control.unimplemented"><code>control.unimplemented</code></h3>

**Error** · status 501

The running Nearhost cannot do what was asked yet.
