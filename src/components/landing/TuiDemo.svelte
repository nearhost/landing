<script lang="ts">
  /* eslint-disable svelte/no-useless-mustaches -- a row's spaces are what lines it up, as in a terminal */
  // A working mock-up of the nearhost interface (0.15.0): the same screens,
  // keys and footer as the real one, driven by made-up projects and requests.
  import { onMount } from 'svelte';

  type State = 'running' | 'starting' | 'degraded' | 'stopped' | 'error';
  type Role = 'web' | 'loopback' | 'ignore';
  type Link = 'connected' | 'connecting' | 'reconnecting' | 'disconnected' | 'auth failed';
  type Tone = '' | 'b' | 'a' | 'r' | 'd' | 't';

  interface Route {
    port: number;
    role: Role;
    label: string;
  }
  interface Project {
    name: string;
    server: string;
    path: string;
    alias: string;
    preset: string;
    state: State;
    message: string; // why it is in the state it is, as the panel's why says
    since: number;
    webLocal: number;
    routes: Route[];
    advice?: { message: string; snippet: string };
    paths: string[];
  }
  interface Server {
    name: string;
    host: string;
    link: Link;
    held: boolean; // dropped with c: its projects wait, and it is no problem
    error: string; // what ssh said last
    tries: number;
  }
  interface Entry {
    seq: number;
    at: string;
    keys: string[]; // the rows whose logs show it, as srv:<name> or prj:<name>; home shows all
    source: string;
    method?: string;
    path?: string;
    status?: number;
    ms?: number;
    type?: string;
    size?: string;
    text?: string;
    tone?: Tone;
  }
  interface Row {
    key: string;
    kind: 'home' | 'server' | 'project';
    name: string;
  }
  interface FooterItem {
    key: string;
    label: string;
  }

  const SPIN = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const START = Date.UTC(2026, 9, 15, 12, 10, 10);
  const HOUR = 3600_000;

  const vite = (alias: string) => ({
    message: `Vite rejects requests for ${alias} unless it is in server.allowedHosts.`,
    snippet: `// vite.config.ts\nexport default defineConfig({\n  server: {\n    allowedHosts: ['${alias}'],\n  },\n})\n`,
  });

  // What ssh says when the server turns the key down, as Nearhost shows it.
  const DENIED = 'you@203.0.113.40: Permission denied (publickey).';
  const deniedUntil = (t: number) =>
    `${DENIED} Nearhost tries again at ${new Date(t + 15 * 60_000).toISOString().slice(11, 16)}.`;

  let servers = $state<Server[]>([
    { name: 'local', host: '', link: 'connected', held: false, error: '', tries: 0 },
    { name: 'mini', host: 'mini.lan', link: 'connected', held: false, error: '', tries: 0 },
    {
      name: 'vps',
      host: '203.0.113.40',
      link: 'auth failed',
      held: false,
      error: deniedUntil(START - 364_000),
      tries: 3,
    },
  ]);

  let projects = $state<Project[]>([
    {
      name: 'website',
      server: 'local',
      path: '~/code/website',
      alias: 'website.test',
      preset: 'astro',
      state: 'running',
      message: '',
      since: START - 47 * 60_000,
      webLocal: 4321,
      routes: [{ port: 4321, role: 'web', label: 'astro dev (astro.config)' }],
      paths: ['/', '/docs/', '/blog/', '/_astro/client.js', '/favicon.svg', '/pricing/'],
    },
    {
      name: 'ipbar',
      server: 'local',
      path: '~/code/ipbar',
      alias: 'ipbar.test',
      preset: '',
      state: 'stopped',
      message: '',
      since: 0,
      webLocal: 3000,
      routes: [{ port: 3000, role: 'web', label: 'app (PORT)' }],
      paths: ['/', '/api/ip', '/health'],
    },
    {
      name: 'myapp',
      server: 'mini',
      path: '~/code/myapp',
      alias: 'myapp.test',
      preset: 'laravel, vite',
      state: 'running',
      message: '',
      since: START - 2 * HOUR - 14 * 60_000,
      webLocal: 52114,
      routes: [
        { port: 8080, role: 'web', label: 'app (APP_PORT)' },
        { port: 5173, role: 'loopback', label: 'Vite (vite.config)' },
        { port: 5432, role: 'ignore', label: 'db (DB_PORT)' },
      ],
      advice: vite('myapp.test'),
      paths: [
        '/dashboard',
        '/api/projects',
        '/api/user',
        '/settings',
        '/api/projects?page=2',
        '/login',
      ],
    },
    {
      name: 'otherapp',
      server: 'mini',
      path: '~/code/otherapp',
      alias: 'otherapp.test',
      preset: 'rails',
      state: 'starting',
      message: '',
      since: 0,
      webLocal: 52130,
      routes: [{ port: 3000, role: 'web', label: 'rails server (PORT)' }],
      paths: ['/', '/orders', '/orders/42', '/assets/application.js', '/cable'],
    },
    {
      name: 'clientsite',
      server: 'vps',
      path: '/srv/clientsite',
      alias: 'clientsite.test',
      preset: 'wordpress',
      state: 'stopped',
      message: '',
      since: 0,
      webLocal: 52141,
      routes: [{ port: 8000, role: 'web', label: 'app (WP_PORT)' }],
      paths: ['/', '/wp-admin/', '/wp-json/wp/v2/posts'],
    },
  ]);

  let seq = 0;
  const stamp = (t: number) => new Date(t).toISOString().slice(11, 19);
  const seed = (offset: number, e: Omit<Entry, 'seq' | 'at'>): Entry => ({
    ...e,
    seq: ++seq,
    at: stamp(START - offset * 1000),
  });
  // The rows whose logs show a line about project p: its own, and its
  // server's when it runs on one.
  const projectKeys = (name: string, srv: string) =>
    srv === 'local' ? ['prj:' + name] : ['prj:' + name, 'srv:' + srv];
  // A line from a server shows in its log and in the logs of its projects.
  const serverKeys = (srv: string) => [
    'srv:' + srv,
    ...projects.filter((p) => p.server === srv).map((p) => 'prj:' + p.name),
  ];
  const req = (
    offset: number,
    project: string,
    method: string,
    path: string,
    status: number,
    ms: number,
    type = 'application/json',
    size = '3.1 kB',
  ) =>
    seed(offset, {
      keys: projectKeys(project, projects.find((p) => p.name === project)?.server ?? 'local'),
      source: project,
      method,
      path,
      status,
      ms,
      type,
      size,
      tone: status >= 500 ? 'r' : '',
    });
  // A project's state, as the engine announces it.
  const announced = (offset: number, project: string, srv: string, text: string, err = false) =>
    seed(offset, { keys: projectKeys(project, srv), source: project, text, tone: err ? 'r' : '' });
  const linked = (offset: number, srv: string, text: string) =>
    seed(offset, { keys: serverKeys(srv), source: srv, text: `${srv}: ${text}` });

  let entries = $state<Entry[]>([
    seed(8050, { keys: [], source: 'proxy', text: 'proxy ready' }),
    linked(8049, 'mini', 'connecting'),
    linked(8048, 'mini', 'connected'),
    announced(8047, 'myapp', 'mini', 'state: starting'),
    announced(8046, 'myapp', 'mini', 'state: running'),
    announced(2821, 'website', 'local', 'state: starting'),
    announced(2820, 'website', 'local', 'state: running'),
    linked(366, 'vps', 'connecting'),
    linked(364, 'vps', 'auth failed: ' + deniedUntil(START - 364_000)),
    req(361, 'myapp', 'GET', '/', 200, 41, 'text/html', '14.2 kB'),
    req(361, 'myapp', 'GET', '/@vite/client', 200, 3, 'text/javascript', '182 kB'),
    req(339, 'myapp', 'GET', '/dashboard', 200, 88, 'text/html', '22.9 kB'),
    req(326, 'myapp', 'POST', '/login', 302, 63, 'text/html', '0 B'),
    req(297, 'myapp', 'GET', '/api/projects?sort=owner', 500, 212, 'application/json', '412 B'),
    req(296, 'myapp', 'GET', '/api/projects', 200, 54),
    req(290, 'myapp', 'GET', '/favicon.ico', 404, 1, 'text/html', '0 B'),
    req(268, 'myapp', 'GET', '/dashboard', 200, 64, 'text/html', '22.9 kB'),
    req(250, 'website', 'GET', '/docs/', 200, 31, 'text/html', '18.0 kB'),
    req(247, 'myapp', 'GET', '/api/projects?page=2', 200, 49, 'application/json', '2.8 kB'),
    req(247, 'myapp', 'GET', '/api/user', 200, 18, 'application/json', '611 B'),
    announced(3, 'otherapp', 'mini', 'state: starting'),
    req(0, 'myapp', 'GET', '/settings', 200, 77, 'text/html', '18.4 kB'),
  ]);

  // What is on the screen.
  let sel = $state('prj:myapp');
  let collapsed = $state<Record<string, boolean>>({});
  let routeFocus = $state(false);
  let routeRow = $state(0);
  let showIgnored = $state(false); // ignored routes fold into one line until i shows them
  let filtering = $state(false);
  let query = $state('');
  let showHelp = $state(false);
  // q asks in a box whether to stop Nearhost or leave it running, when this
  // interface started it and keep_running is not set; quitting says which
  // was chosen while it goes, and exited how it went.
  let quitBox = $state<{ leave: boolean; remember: boolean } | null>(null);
  let quitting = $state<'' | 'stop' | 'leave'>('');
  let exited = $state<'' | 'stop' | 'leave'>('');
  let keepRunning = $state<boolean | null>(null); // keep_running, once Don't ask again saved it
  let startedHere = $state(true); // false after Leave running: the next run attaches to it
  // A question asked before a change, as d asks before removing.
  interface Confirm {
    title: string;
    ask: string;
    then: () => void;
  }
  let confirmBox = $state<Confirm | null>(null);
  let toast = $state<{ text: string; problem: boolean } | null>(null);
  let frame = $state(0);
  let now = $state(START);
  let focused = $state(false);

  interface LogView {
    key: string;
    kind: number;
    cursor: number; // seq of the line under the cursor; 0 follows the end
    pausedAt: number; // the newest seq when following stopped
    open: number; // seq of the request opened
    search: string;
    searching: boolean;
    wrap: boolean; // lines that are not requests wrap
    reveal: boolean; // cookies show
    said: string; // what the last replay said, until the next key
    confirm: number; // seq of the request waiting for y to be sent again
  }
  let logView = $state<LogView | null>(null);
  const KINDS = ['all', 'requests', 'events', 'errors'];

  interface Form {
    step: number;
    cursor: number;
    server: string;
    path: string;
    presets: boolean[];
    routes: Route[];
    routeRow: number;
    name: string;
    alias: string;
    aliasEdited: boolean; // the alias was typed, so it no longer follows the name
    field: number;
    busy: string;
  }
  let form = $state<Form | null>(null);
  const STEPS = ['server', 'path', 'presets', 'presets', 'routes', 'name', 'confirm'];

  let term: HTMLDivElement | undefined = $state();
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  // Helpers.

  const project = (name: string) => projects.find((p) => p.name === name);
  const server = (name: string) => servers.find((s) => s.name === name);
  const kindOf = (key: string): Row['kind'] =>
    key === 'home' ? 'home' : key.startsWith('srv:') ? 'server' : 'project';
  const nameOf = (key: string) => key.slice(4);

  // say shows text in a toast at the foot of the screen for two seconds, as
  // the interface tells of what a key did. The demo's own notes, about what
  // it cannot do, go no further.
  function say(text: string, problem = false) {
    toast = { text, problem };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast = null), 2000);
  }

  // alert is say for the interface's own news, which its log keeps too,
  // under the row with key.
  function alert(key: string, text: string, problem = false) {
    noteOn(key, text);
    say(text, problem);
  }

  function push(e: Omit<Entry, 'seq' | 'at'>) {
    entries.push({ ...e, seq: ++seq, at: stamp(now) });
    if (entries.length > 400) entries.splice(0, entries.length - 400);
  }

  // noteOn adds a line of the interface's own to the log of the row with key.
  function noteOn(key: string, text: string) {
    push({ keys: key === 'home' ? [] : [key], source: 'nearhost', text });
  }

  // setState moves p to st and announces it in its log, as the engine does.
  function setState(p: Project, st: State, message = '') {
    if (p.state === st && p.message === message) return;
    p.state = st;
    p.message = message;
    if (st === 'running' && !p.since) p.since = now;
    if (st !== 'running') p.since = 0;
    push({
      keys: projectKeys(p.name, p.server),
      source: p.name,
      text: `state: ${st}${message ? ': ' + message : ''}`,
      tone: st === 'error' ? 'r' : '',
    });
  }

  // serverLog adds a line of a server's connection to its log and its
  // projects'.
  function serverLog(s: Server, text: string) {
    push({ keys: serverKeys(s.name), source: s.name, text: `${s.name}: ${text}` });
  }

  function uptime(p: Project) {
    if (p.state !== 'running' || !p.since) return '';
    const d = Math.max(0, now - p.since);
    const m = Math.floor(d / 60_000);
    if (m < 1) return `${Math.floor(d / 1000)}s`;
    if (m < 60) return `${m}m`;
    if (m < 24 * 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
    return `${Math.floor(m / 1440)}d ${Math.floor(m / 60) % 24}h`;
  }

  const matches = (name: string) => name.toLowerCase().includes(query.toLowerCase());

  function splitMatch(name: string): [string, string, string] {
    if (!query) return [name, '', ''];
    const at = name.toLowerCase().indexOf(query.toLowerCase());
    if (at < 0) return [name, '', ''];
    return [name.slice(0, at), name.slice(at, at + query.length), name.slice(at + query.length)];
  }

  // The sidebar's rows, in order; groups whose projects are filtered out go.
  let rows = $derived.by(() => {
    const out: Row[] = [];
    if (!query) out.push({ key: 'home', kind: 'home', name: 'home' });
    for (const s of servers) {
      const ps = projects.filter((p) => p.server === s.name && (!query || matches(p.name)));
      if (query && ps.length === 0) continue;
      out.push({ key: 'srv:' + s.name, kind: 'server', name: s.name });
      if (collapsed[s.name] && !query) continue;
      for (const p of ps) out.push({ key: 'prj:' + p.name, kind: 'project', name: p.name });
    }
    return out;
  });

  let selKind = $derived(kindOf(sel));
  let selName = $derived(nameOf(sel));
  let selProject = $derived(selKind === 'project' ? project(selName) : undefined);
  let selServer = $derived(selKind === 'server' ? server(selName) : undefined);
  let running = $derived(projects.filter((p) => p.state === 'running').length);
  let serversUp = $derived(
    new Set(projects.filter((p) => p.state === 'running').map((p) => p.server)).size,
  );
  let spin = $derived(SPIN[frame % SPIN.length]);

  // What needs the user, as Home lists it: servers that cannot connect, and
  // projects in error. A server dropped on purpose is no problem.
  interface Problem {
    dot: [string, Tone];
    title: string;
    what: string;
    why: string;
    fix: string;
    blocks: string[];
    server?: Server; // the server r and y act on
  }
  let problems = $derived.by(() => {
    const out: Problem[] = [];
    for (const s of servers) {
      if (s.name === 'local' || s.link === 'connected' || s.held || !s.error) continue;
      out.push({
        dot: [linkMark(s.link), linkTone(s.link)],
        title: s.name,
        what: connectionText(s),
        why: s.error,
        fix: serverFix(s),
        blocks: projects.filter((p) => p.server === s.name).map((p) => p.name),
        server: s,
      });
    }
    for (const p of projects) {
      if (p.state !== 'error') continue;
      out.push({
        dot: ['✕', 'r'],
        title: p.name,
        what: 'error',
        why: p.message,
        fix: fixFor(p),
        blocks: [],
      });
    }
    return out;
  });
  let retryable = $derived(problems.filter((x) => x.server));

  // Each state has a glyph of its own as well as a colour: ● running or
  // connected, ○ off, ✕ an error, ◐ on its way, and the spinner while it
  // starts or connects.
  function stateTone(st: State): Tone {
    return st === 'running' ? 'b' : st === 'error' ? 'r' : st === 'stopped' ? 'd' : 'a';
  }
  function stateDot(st: State) {
    return st === 'running'
      ? '●'
      : st === 'starting'
        ? spin
        : st === 'degraded'
          ? '◐'
          : st === 'error'
            ? '✕'
            : '○';
  }
  function linkTone(l: Link): Tone {
    return l === 'connected' ? 'b' : l === 'auth failed' ? 'r' : l === 'disconnected' ? 'd' : 'a';
  }
  // linkMark is a server's mark where the spinner does not turn.
  function linkMark(l: Link) {
    return l === 'connected' ? '●' : l === 'auth failed' ? '✕' : l === 'disconnected' ? '○' : '◐';
  }
  function linkDot(l: Link) {
    return l === 'connecting' || l === 'reconnecting' ? spin : linkMark(l);
  }
  // The word for a server's connection: dropped when dropped on purpose.
  const linkWord = (s: Server) => (s.held ? 'dropped' : s.link);
  function connectionText(s: Server) {
    if (s.held) return 'dropped';
    if (s.link === 'auth failed' && s.tries)
      return `auth failed · ${s.tries === 1 ? 'tried once' : `tried ${s.tries} times`}`;
    return s.link;
  }
  function serverFix(s: Server) {
    if (s.link === 'reconnecting')
      return `Nearhost tries again by itself. If it keeps failing, run ssh ${s.host} once in a terminal to check access.`;
    return `Run ssh ${s.host} once in a terminal to fix access, then press r.`;
  }
  // fixFor says what to do about a project, for the panel's fix line.
  function fixFor(p: Project) {
    const host = server(p.server)?.host ?? '';
    if (p.state === 'degraded')
      return `None needed while Nearhost reconnects. If it stays degraded, run \`ssh ${host}\` once in a terminal to fix access.`;
    if (p.state !== 'error') return '';
    if (p.server !== 'local' && server(p.server)?.link !== 'connected')
      return `Run \`ssh ${host}\` once in a terminal to fix access, then press enter.`;
    return 'Resolve what is named above, then press enter to start it again.';
  }
  function statusTone(status: number): Tone {
    return status >= 500
      ? 'r'
      : status >= 400
        ? 'a'
        : status >= 300
          ? 'd'
          : status === 101
            ? 'b'
            : '';
  }
  function localPort(p: Project, r: Route) {
    if (r.role === 'web' && (p.state === 'running' || p.state === 'degraded'))
      return String(p.webLocal);
    if (r.role === 'loopback' && p.server !== 'local') return String(r.port);
    return '–';
  }
  function routeDot(p: Project, r: Route): [string, Tone] {
    if (r.role === 'ignore') return ['–', 'd'];
    if (p.state === 'running') return ['●', 'b'];
    if (p.state === 'starting' || p.state === 'degraded') return ['◐', 'a'];
    return ['○', 'd'];
  }

  // Home shows the combined log; a row, the lines filed under it.
  const entriesFor = (key: string) =>
    key === 'home' ? entries : entries.filter((e) => e.keys.includes(key));

  // The full-screen log's keys, the most useful first: its footer shows as
  // many as fit, and ? lists them all, by group.
  const LOG_KEYS = [
    ['move', 'j/k', 'scroll'],
    ['view', 'enter', 'expand'],
    ['view', 'tab', 'kind'],
    ['search', '/', 'search'],
    ['log', '?', 'keys'],
    ['request', 'c', 'copy curl'],
    ['request', 'r', 'replay'],
    ['log', 'esc', 'back'],
    ['move', 'G', 'follow'],
    ['view', 'w', 'wrap'],
    ['view', 'v', 'reveal cookies'],
    ['move', 'g', 'top'],
    ['move', 'pgup/pgdn', 'page'],
    ['view', 'shift+tab', 'kind back'],
    ['log', 'q', 'back'],
    ['log', 'p', 'review request'],
  ];
  const LOG_HELP = ['move', 'view', 'search', 'log', 'request'].map((title) => ({
    title,
    keys: LOG_KEYS.filter(([g]) => g === title).map(([, k, label]) => [
      k,
      k === '?' ? 'close this list' : label,
    ]),
  }));

  // The terminal is 120 cells wide: the footer drops the minor keys, in
  // this order, until the rest fit beside where the selection is, and ? then
  // says there is more.
  const COLUMNS = 120;
  const MINOR = [
    'q quit',
    'n add',
    's server',
    'enter collapse',
    'tab routes',
    'd remove',
    'e edit',
  ];
  const itemsWidth = (items: FooterItem[]) =>
    items.reduce((w, it, i) => w + (i ? 3 : 0) + it.key.length + 1 + it.label.length, 0);
  function fitFooter(items: FooterItem[], room: number) {
    for (const minor of MINOR) {
      if (itemsWidth(items) <= room) return items;
      items = items
        .filter((it) => `${it.key} ${it.label}` !== minor)
        .map((it) => (it.key === '?' ? { key: '?', label: 'more' } : it));
    }
    return items;
  }

  // The footer: the keys that work now, as the real one lists them.
  let footer = $derived.by((): FooterItem[] => {
    if (quitting || exited) return [];
    if (form || quitBox || confirmBox) return [];
    if (logView) {
      // As many as fit, the last cut short as the real one cuts it.
      const room = COLUMNS - 3 - footerContext.length;
      const out: FooterItem[] = [];
      let used = 0;
      for (const [, key, label] of LOG_KEYS) {
        const w = (out.length ? 3 : 0) + key.length + 1 + label.length;
        if (used + w > room - 2) {
          out.push({ key: '…', label: '' });
          break;
        }
        out.push({ key, label });
        used += w;
      }
      return out;
    }
    if (routeFocus)
      return [
        { key: '↑↓', label: 'route' },
        { key: 'space', label: 'loopback/ignore' },
        { key: 'w', label: 'web' },
        { key: 'y', label: 'copy advice' },
        { key: 'tab', label: 'done' },
      ];
    if (filtering)
      return [
        { key: '↑↓', label: 'move' },
        { key: 'enter', label: 'keep filter' },
        { key: 'esc', label: 'clear filter' },
      ];
    let items: FooterItem[] = [];
    if (selProject) {
      const verb =
        selProject.state === 'stopped' || selProject.state === 'error' ? 'start' : 'stop';
      items = [
        { key: 'enter', label: verb },
        { key: 'o', label: 'open' },
        { key: 'tab', label: 'routes' },
        { key: 'e', label: 'edit' },
        { key: 'd', label: 'remove' },
      ];
    } else if (selKind === 'home') {
      if (retryable.length) items = [{ key: 'r', label: 'retry' }];
    } else if (selServer) {
      items = [{ key: 'enter', label: 'collapse' }];
      if (selServer.name !== 'local') {
        items.push(
          { key: 'r', label: 'reconnect' },
          { key: 'c', label: connectsOnC(selServer) ? 'connect' : 'drop' },
          { key: 'e', label: 'edit' },
          { key: 'd', label: 'remove' },
        );
      }
    }
    return fitFooter(
      [
        ...items,
        { key: 'l', label: 'log' },
        { key: '/', label: 'filter' },
        { key: 's', label: 'server' },
        { key: 'n', label: 'add' },
        { key: '?', label: 'help' },
        { key: 'q', label: 'quit' },
      ],
      COLUMNS - 3 - footerContext.length,
    );
  });

  let footerContext = $derived.by(() => {
    if (form || quitBox || confirmBox || quitting || exited) return '';
    if (logView) return nameOf(logView.key) || 'home';
    if (selProject) {
      const at = projects.indexOf(selProject) + 1;
      return `${selProject.name} ${at}/${projects.length}`;
    }
    if (selServer) return selServer.name;
    return 'home';
  });

  const HELP = [
    {
      title: 'move · mouse',
      keys: [
        ['j/k', 'up and down'],
        ['h', 'home'],
        ['tab', 'routes'],
        ['/', 'filter by name'],
        ['esc', 'clear filter'],
        ['drag', 'copy text'],
        ['2click', 'copy a word'],
        ['click', 'open an address'],
      ],
    },
    {
      title: 'project',
      keys: [
        ['enter', 'start or stop'],
        ['o', 'open in browser'],
        ['e', 'edit'],
        ['d', 'remove'],
        ['y', 'copy advice'],
        ['i', 'show or hide ignored ports'],
        ['r', 're-read .nearhostrc'],
        ['a', 'review .nearhostrc'],
      ],
    },
    {
      title: 'server',
      keys: [
        ['s', 'add server'],
        ['r', 'reconnect'],
        ['c', 'connect or drop'],
        ['e', 'edit'],
        ['d', 'remove'],
        ['tab', 'passthroughs, documents, grants'],
        ['enter', 'collapse, or open a document'],
        ['x', 'close, revoke or remove'],
      ],
    },
    {
      title: 'nearhost',
      keys: [
        ['n', 'add project'],
        ['p', 'review request'],
        ['A', 'always allow'],
        ['l', 'full-screen log'],
        ['?', 'close help'],
        ['q', 'quit'],
      ],
    },
  ];

  // Actions.

  function selectRow(key: string) {
    if (key !== sel) routeFocus = false;
    sel = key;
  }

  function move(delta: number) {
    const at = Math.max(
      0,
      rows.findIndex((r) => r.key === sel),
    );
    const next = rows[Math.min(Math.max(at + delta, 0), rows.length - 1)];
    if (next) selectRow(next.key);
  }

  function later(ms: number, fn: () => void) {
    setTimeout(fn, ms);
  }

  // waiting is the state of a project whose server s is not connected:
  // starting while Nearhost waits for it, or an error when ssh was turned down.
  function waiting(s: Server): [State, string] {
    if (s.held) return ['starting', `waiting for ${s.name}: ${s.name} was disconnected on purpose`];
    if (s.link === 'auth failed') return ['error', `ssh ${s.host}: ${s.error}`];
    return ['starting', `waiting for ${s.name}${s.error ? ': ' + s.error : ''}`];
  }

  function startProject(p: Project) {
    const s = server(p.server);
    setState(p, 'starting');
    if (s && s.name !== 'local' && s.link !== 'connected') {
      const [st, message] = waiting(s);
      setState(p, st, message);
      return;
    }
    later(1200, () => {
      if (p.state === 'starting' && !p.message) setState(p, 'running');
    });
  }

  function stopProject(p: Project) {
    setState(p, 'stopped');
  }

  // follow moves the projects on s with its connection: degraded while it
  // is not connected, waiting while they start, and running again once it is.
  function follow(s: Server) {
    for (const p of projects) {
      if (p.server !== s.name || p.state === 'stopped') continue;
      if (s.link === 'connected') {
        if (p.state === 'degraded') setState(p, 'running');
        else if (p.state !== 'running') startProject(p);
        continue;
      }
      if (p.state === 'running' || p.state === 'degraded') {
        const why = s.held
          ? `server ${s.name} was disconnected on purpose`
          : `server ${s.name} is ${s.link}${s.error ? ': ' + s.error : ''}`;
        setState(p, 'degraded', why);
      } else setState(p, ...waiting(s));
    }
  }

  function enter() {
    if (selServer) {
      collapsed[selServer.name] = !collapsed[selServer.name];
      return;
    }
    if (!selProject) return;
    if (selProject.state === 'stopped' || selProject.state === 'error') startProject(selProject);
    else stopProject(selProject);
  }

  // dial connects s again, as its session does: vps turns the key down.
  function dial(s: Server) {
    s.held = false;
    s.link = 'connecting';
    serverLog(s, 'connecting');
    follow(s);
    later(1400, () => {
      if (s.link !== 'connecting') return;
      if (s.name === 'vps') {
        s.tries = 1; // a retry counts its failures afresh
        s.error = deniedUntil(now);
        s.link = 'auth failed';
        serverLog(s, 'auth failed: ' + s.error);
      } else {
        s.link = 'connected';
        s.error = '';
        s.tries = 0;
        serverLog(s, 'connected');
      }
      follow(s);
    });
  }

  function reconnect(s: Server) {
    noteOn('srv:' + s.name, `Reconnecting ${s.name}.`);
    dial(s);
  }

  const connectsOnC = (s: Server) =>
    s.held || s.link === 'disconnected' || s.link === 'auth failed';

  function toggleConnection(s: Server) {
    if (connectsOnC(s)) {
      noteOn('srv:' + s.name, `Connecting ${s.name}.`);
      dial(s);
      return;
    }
    noteOn('srv:' + s.name, `Dropping the connection to ${s.name}.`);
    s.held = true;
    s.link = 'disconnected';
    serverLog(s, 'disconnected');
    follow(s);
  }

  async function copy(key: string, text: string, said: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert(key, said);
    } catch {
      say('The clipboard is not available here.', true);
    }
  }

  // quit quits as keep_running says: it stops Nearhost, leaves it running,
  // or asks which in the quit box. A Nearhost this interface did not start
  // is left running. Ctrl-C never asks, and at the box it stops.
  function quit(ctrlC = false) {
    if (quitting) return;
    if (quitBox) {
      if (ctrlC) end('stop', false);
      return;
    }
    if (!startedHere || keepRunning) end('leave', false);
    else if (keepRunning === null && !ctrlC) quitBox = { leave: false, remember: false };
    else end('stop', false);
  }

  // end ends the interface, saving the choice as keep_running when asked.
  function end(how: 'stop' | 'leave', remember: boolean) {
    quitBox = null;
    if (remember) keepRunning = how === 'leave';
    showHelp = false;
    quitting = how;
    later(900, () => {
      quitting = '';
      exited = how;
    });
  }

  function quitBoxKey(k: string) {
    const b = quitBox!;
    if (k === 'Tab' || k === 'ArrowLeft' || k === 'ArrowRight') b.leave = !b.leave;
    else if (k === ' ') b.remember = !b.remember;
    else if (k === 'Enter') end(b.leave ? 'leave' : 'stop', b.remember);
    else if (k === 'Escape') quitBox = null;
    else return k.length === 1;
    return true;
  }

  function confirmKey(k: string) {
    const c = confirmBox!;
    if (k === 'y') {
      confirmBox = null;
      c.then();
    } else if (k === 'n' || k === 'Escape') confirmBox = null;
    else return k.length === 1;
    return true;
  }

  function removeProject(p: Project) {
    confirmBox = {
      title: `Remove ${p.name}?`,
      ask: 'It stops now and leaves the config.',
      then: () => {
        projects.splice(projects.indexOf(p), 1);
        selectRow('srv:' + p.server);
        alert('srv:' + p.server, `Removed ${p.name}.`);
      },
    };
  }

  function removeServer(s: Server) {
    const on = projects.filter((p) => p.server === s.name).map((p) => p.name);
    confirmBox = {
      title: `Remove ${s.name}?`,
      ask: on.length ? `Its projects go with it and stop now: ${on.join(', ')}.` : '',
      then: () => {
        projects = projects.filter((p) => p.server !== s.name);
        servers.splice(servers.indexOf(s), 1);
        selectRow('home');
        alert('home', `Removed ${s.name}.`);
      },
    };
  }

  function relaunch() {
    // After Leave running, the next nearhost attaches to the one running.
    startedHere = exited !== 'leave';
    exited = '';
    showHelp = false;
    routeFocus = false;
    logView = null;
    form = null;
    sel = 'home';
  }

  function openForm() {
    let srv = 'local';
    if (selServer) srv = selServer.name;
    if (selProject) srv = selProject.server;
    form = {
      step: 0,
      cursor: Math.max(
        0,
        servers.findIndex((s) => s.name === srv),
      ),
      server: srv,
      path: '~/code/',
      presets: [true, true],
      routes: [
        { port: 80, role: 'web', label: 'app (APP_PORT)' },
        { port: 5173, role: 'loopback', label: 'Vite (VITE_PORT)' },
        { port: 3306, role: 'ignore', label: 'db (FORWARD_DB_PORT)' },
      ],
      routeRow: 0,
      name: 'shop',
      alias: 'shop.test',
      aliasEdited: false,
      field: 0,
      busy: '',
    };
  }

  // The .test name a project name gives, as the alias follows the name.
  function aliasFor(name: string) {
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    // An empty name saves as shop, so its alias is shop.test too.
    return (slug || 'shop') + '.test';
  }

  // The names web route i is served at on the routes step: the alias on the
  // first web route, and none on another, since the demo gives no hosts.
  function webNames(f: Form, i: number) {
    const primary = f.routes.findIndex((r) => r.role === 'web');
    return i === primary && f.alias ? [f.alias] : [];
  }

  // What route i opens on this machine.
  function opens(f: Form, i: number) {
    const r = f.routes[i];
    if (r.role === 'web') {
      const names = webNames(f, i);
      return names.length ? 'https://' + names[0] : '–';
    }
    return r.role === 'loopback' ? `localhost:${r.port}` : '–';
  }

  // What the selected route's role does, in full: [tone, text, link, rest].
  function roleLine(f: Form): [Tone, string, string, string] {
    const r = f.routes[f.routeRow];
    const where = f.server === 'local' ? 'on this machine' : 'on ' + f.server;
    const more =
      " One port is the project's web port. To serve another port as well, give it names of its own with h.";
    if (r.role === 'web') {
      const names = webNames(f, f.routeRow);
      const primary = f.routeRow === f.routes.findIndex((x) => x.role === 'web');
      if (!names.length && !primary)
        return [
          'a',
          `web: port ${r.port} has no names of its own, and only one web route can go without, served at the alias. Give it names with h, or change its role with ← or →.`,
          '',
          '',
        ];
      if (!names.length)
        return [
          'd',
          `web: Nearhost serves port ${r.port} ${where} at the project's alias, which the next step sets.${more}`,
          '',
          '',
        ];
      return [
        'd',
        'web: your browser opens ',
        'https://' + names[0],
        `, and Nearhost sends it to port ${r.port} ${where}.${more}`,
      ];
    }
    if (r.role === 'loopback')
      return [
        'd',
        `loopback: localhost:${r.port} on this machine reaches port ${r.port} ${where}, for what the app's pages load from that port themselves, such as Vite's dev server.`,
        '',
        '',
      ];
    return ['d', `ignore: Nearhost opens nothing for port ${r.port}.`, '', ''];
  }

  function formBusy(text: string, ms: number, then: () => void) {
    if (!form) return;
    form.busy = text;
    later(ms, () => {
      if (!form || form.busy !== text) return;
      form.busy = '';
      then();
    });
  }

  function saveForm() {
    if (!form) return;
    let name = form.name.trim() || 'shop';
    while (project(name)) name += '2';
    const p: Project = {
      name,
      server: form.server,
      path: form.path,
      alias: form.alias.trim() || name + '.test',
      preset: ['laravel', 'vite'].filter((_, i) => form!.presets[i]).join(', '),
      state: 'stopped',
      message: '',
      since: 0,
      webLocal: 52150 + projects.length,
      routes: form.routes.map((r) => ({ ...r })),
      advice: form.presets[1] ? vite(form.alias.trim() || name + '.test') : undefined,
      paths: ['/', '/products', '/cart', '/api/cart', '/checkout'],
    };
    projects.push(p);
    const added = projects[projects.length - 1]; // the reactive copy
    form = null;
    collapsed[added.server] = false;
    query = '';
    selectRow('prj:' + added.name);
    alert('prj:' + added.name, `Added ${added.name}.`);
    startProject(added);
  }

  function formKey(k: string, ev: KeyboardEvent): boolean {
    const f = form;
    if (!f) return false;
    if (k === 'Escape') {
      f.busy = '';
      if (f.step === 0) form = null;
      else f.step = f.step === 4 ? 1 : f.step === 5 ? 4 : f.step - 1;
      if (f.step === 2 || f.step === 3) f.step = 1;
      return true;
    }
    if (f.busy) return true;
    const up = k === 'ArrowUp' || (k === 'k' && f.step !== 1 && f.step !== 5);
    const down = k === 'ArrowDown' || (k === 'j' && f.step !== 1 && f.step !== 5);
    switch (f.step) {
      case 0: {
        const n = servers.length + 1;
        if (up) f.cursor = (f.cursor + n - 1) % n;
        else if (down) f.cursor = (f.cursor + 1) % n;
        else if (k === 'Enter') {
          if (f.cursor === servers.length) {
            say('Adding a server asks for its SSH host. Try it with nearhost.');
            return true;
          }
          const s = servers[f.cursor];
          if (s.link !== 'connected') {
            say(`${s.name} is not connected; pick another server.`);
            return true;
          }
          f.server = s.name;
          f.path = s.name === 'local' ? '~/code/shop' : '~/code/';
          formBusy(
            s.name === 'local' ? '' : `Connecting to ${s.name}…`,
            s.name === 'local' ? 0 : 700,
            () => {
              if (form) form.step = 1;
            },
          );
          if (s.name === 'local') {
            f.busy = '';
            f.step = 1;
          }
        } else return false;
        return true;
      }
      case 1: {
        if (k === 'Enter') {
          if (f.path.endsWith('/')) f.path += 'shop';
          const base = f.path.replace(/\/$/, '').split('/').pop() || 'shop';
          f.name = base;
          f.alias = base + '.test';
          const where = f.server === 'local' ? 'this machine' : f.server;
          formBusy(`Reading ${f.path} on ${where}…`, 900, () => {
            if (form) form.step = 3;
          });
        } else if (k === 'Backspace') f.path = f.path.slice(0, -1);
        else if (k === 'Tab') {
          if (f.path.endsWith('/')) f.path += 'shop';
        } else if (k.length === 1 && !ev.metaKey && !ev.ctrlKey) f.path += k;
        else return false;
        return true;
      }
      case 3: {
        if (up) f.routeRow = (f.routeRow + 1) % 2;
        else if (down) f.routeRow = (f.routeRow + 1) % 2;
        else if (k === ' ') f.presets[f.routeRow] = !f.presets[f.routeRow];
        else if (k === 'Enter') {
          f.routeRow = 0;
          f.step = 4;
        } else return false;
        return true;
      }
      case 4: {
        const n = f.routes.length;
        const roles: Role[] = ['web', 'loopback', 'ignore'];
        if (up) f.routeRow = (f.routeRow + n - 1) % n;
        else if (down) f.routeRow = (f.routeRow + 1) % n;
        else if (k === ' ') {
          const r = f.routes[f.routeRow];
          r.role = r.role === 'ignore' ? 'loopback' : 'ignore';
        } else if (k === 'ArrowLeft' || k === 'ArrowRight') {
          const r = f.routes[f.routeRow];
          const step = k === 'ArrowRight' ? 1 : 2;
          r.role = roles[(roles.indexOf(r.role) + step) % 3];
        } else if (k === 'h' && f.routes[f.routeRow].role === 'web') {
          say('h types the names a web route is served at. Try it with nearhost.');
        } else if (k === 'Enter') {
          const web = f.routes.filter((r) => r.role === 'web');
          if (!web.length) {
            say('Pick a web route: it is what the address serves.');
            return true;
          }
          if (web.length > 1) {
            const ports = web.map((r) => r.port);
            say(
              `Only one web route can go without names of its own, and ports ${ports.slice(0, -1).join(', ')} and ${ports.at(-1)} have none.`,
            );
            return true;
          }
          f.field = 0;
          f.step = 5;
        } else return false;
        return true;
      }
      case 5: {
        if (k === 'Tab' || up || down) f.field = f.field ? 0 : 1;
        else if (k === 'Enter') {
          if (f.field === 0) f.field = 1;
          else f.step = 6;
        } else if (k === 'Backspace' || (k.length === 1 && !ev.metaKey && !ev.ctrlKey)) {
          const typed = (s: string) => (k === 'Backspace' ? s.slice(0, -1) : s + k);
          if (f.field === 1) {
            f.alias = typed(f.alias);
            f.aliasEdited = true;
          } else {
            f.name = typed(f.name);
            if (!f.aliasEdited) f.alias = aliasFor(f.name); // the alias follows the name
          }
        } else return false;
        return true;
      }
      case 6: {
        if (k === 'Enter') formBusy('Saving…', 600, saveForm);
        else return false;
        return true;
      }
    }
    return false;
  }

  // An entry as text, as the log's search reads it.
  const plain = (e: Entry) =>
    e.method
      ? `${e.at} ${e.source} ${e.method} ${e.path} ${e.status}`
      : `${e.at} ${e.source} ${e.text}`;
  const isError = (e: Entry) => (e.status ?? 0) >= 500 || e.tone === 'r';

  let logLines = $derived.by(() => {
    if (!logView) return [];
    const want = logView.search.toLowerCase();
    let all = entriesFor(logView.key);
    if (want) all = all.filter((e) => plain(e).toLowerCase().includes(want));
    switch (logView.kind) {
      case 1:
        return all.filter((e) => e.method);
      case 2:
        return all.filter((e) => !e.method);
      case 3:
        return all.filter(isError);
    }
    return all;
  });
  // The lines the full-screen log shows: the end while it follows, else
  // those around the cursor.
  let logWindow = $derived.by(() => {
    if (!logView?.cursor) return logLines.slice(-60);
    const at = logLines.findIndex((e) => e.seq === logView!.cursor);
    return logLines.slice(Math.max(0, at - 12), at + 40);
  });
  let errorCount = $derived(logView ? entriesFor(logView.key).filter(isError).length : 0);
  // The lines that came while the log was paused.
  let newer = $derived(
    logView?.cursor ? logLines.filter((e) => e.seq > logView!.pausedAt).length : 0,
  );

  // pause moves the log's cursor to the line with seq, which stops it
  // following; 0 follows again.
  function pause(v: LogView, to: number) {
    if (to && !v.cursor) v.pausedAt = seq;
    v.cursor = to;
  }

  function logKey(k: string, ev: KeyboardEvent): boolean {
    const v = logView;
    if (!v) return false;
    if (v.searching) {
      if (k === 'Enter') v.searching = false;
      else if (k === 'Escape') {
        v.searching = false;
        v.search = '';
      } else if (k === 'Backspace') v.search = v.search.slice(0, -1);
      else if (k.length === 1 && !ev.metaKey && !ev.ctrlKey) v.search += k;
      else return false;
      return true;
    }
    if (showHelp && (k === '?' || k === 'Escape')) {
      showHelp = false;
      return true;
    }
    const lines = logLines;
    const at = v.cursor ? lines.findIndex((e) => e.seq === v.cursor) : lines.length - 1;
    const cur = lines[at];
    v.said = '';
    if (v.confirm) {
      // Any key but y keeps the request unsent.
      const e = lines.find((x) => x.seq === v.confirm);
      v.confirm = 0;
      if (k === 'y' && e) replay(v, e);
      return true;
    }
    switch (k) {
      case '?':
        showHelp = true;
        return true;
      case 'Escape':
      case 'q':
        if (v.search && k === 'Escape') v.search = '';
        else {
          logView = null;
          showHelp = false;
        }
        return true;
      case '/':
        v.searching = true;
        return true;
      case 'j':
      case 'ArrowDown':
        if (at >= lines.length - 1) v.cursor = 0;
        else pause(v, lines[at + 1].seq);
        return true;
      case 'k':
      case 'ArrowUp':
        if (lines.length) pause(v, lines[Math.max(at - 1, 0)].seq);
        return true;
      case 'g':
      case 'Home':
        if (lines.length) pause(v, lines[0].seq);
        return true;
      case 'PageUp':
        if (lines.length) pause(v, lines[Math.max(at - 20, 0)].seq);
        return true;
      case 'PageDown':
        if (at + 20 >= lines.length - 1) v.cursor = 0;
        else pause(v, lines[at + 20].seq);
        return true;
      case 'G':
      case 'End':
        v.cursor = 0;
        return true;
      case 'Tab':
        v.kind = (v.kind + (ev.shiftKey ? KINDS.length - 1 : 1)) % KINDS.length;
        return true;
      case 'w':
        v.wrap = !v.wrap;
        return true;
      case 'v':
        v.reveal = !v.reveal;
        return true;
      case 'Enter':
        if (cur?.method) {
          v.open = v.open === cur.seq ? 0 : cur.seq;
          if (!v.cursor) pause(v, cur.seq);
        }
        return true;
      case 'c':
        if (cur?.method) {
          const p = project(cur.source);
          const how = cur.method === 'GET' ? '' : ` -X ${cur.method}`;
          copy(
            v.key,
            `curl -i --globoff${how} 'https://${p?.alias ?? cur.source + '.test'}${cur.path}'`,
            `Copied ${cur.method} ${cur.path} as curl.`,
          );
        }
        return true;
      case 'r':
        if (cur?.method) {
          // A request that could change something asks first.
          if (cur.method === 'GET' || cur.method === 'HEAD') replay(v, cur);
          else v.confirm = cur.seq;
        }
        return true;
    }
    return false;
  }

  // replay sends a request again, and says how it went.
  function replay(v: LogView, e: Entry) {
    const p = project(e.source);
    if (!p || p.state !== 'running') {
      v.said = `Could not send ${e.method} ${e.path} again: ${e.source} is not running.`;
      noteOn(v.key, v.said);
      return;
    }
    const status = request(p, e.method!, e.path!, true);
    v.said = `Sent ${e.method} ${e.path} again: ${status}.`;
    noteOn(v.key, v.said);
  }

  function routesKey(k: string): boolean {
    const p = selProject;
    if (!p) return false;
    const n = p.routes.length;
    switch (k) {
      case 'ArrowUp':
      case 'k':
        routeRow = (routeRow + n - 1) % n;
        return true;
      case 'ArrowDown':
      case 'j':
        routeRow = (routeRow + 1) % n;
        return true;
      case ' ': {
        const r = p.routes[routeRow];
        if (r.role === 'web') {
          say('Make another route web first, with w.');
          return true;
        }
        r.role = r.role === 'loopback' ? 'ignore' : 'loopback';
        return true;
      }
      case 'w': {
        for (const r of p.routes) if (r.role === 'web') r.role = 'loopback';
        p.routes[routeRow].role = 'web';
        return true;
      }
      case 'y':
        copyAdvice(p);
        return true;
      case 'Tab':
      case 'Escape':
        routeFocus = false;
        return true;
    }
    return false;
  }

  function filterKey(k: string, ev: KeyboardEvent): boolean {
    switch (k) {
      case 'Escape':
        filtering = false;
        query = '';
        return true;
      case 'Enter':
        filtering = false;
        return true;
      case 'ArrowUp':
        move(-1);
        return true;
      case 'ArrowDown':
        move(1);
        return true;
      case 'Backspace':
        query = query.slice(0, -1);
        break;
      default:
        if (k.length !== 1 || ev.metaKey || ev.ctrlKey) return false;
        query += k;
    }
    // Keep the selection on a project that matches.
    const first = rows.find((r) => r.kind === 'project');
    if (!rows.some((r) => r.key === sel)) selectRow(first?.key ?? 'home');
    return true;
  }

  // action runs what the key or footer action s does.
  function action(s: string): boolean {
    switch (s) {
      case 'e':
        if (selProject || (selServer && selServer.name !== 'local'))
          say('Editing opens the same form as adding. Try it with nearhost.');
        return true;
      case 'd':
        if (selProject) removeProject(selProject);
        else if (selServer && selServer.name !== 'local') removeServer(selServer);
        return true;
      case 'c':
        if (selServer && selServer.name !== 'local') toggleConnection(selServer);
        return true;
      case 'r':
        if (selServer && selServer.name !== 'local') reconnect(selServer);
        else if (selKind === 'home') for (const x of retryable) reconnect(x.server!);
        return true;
      case 'tab':
      case 'Tab':
        if (!selProject) return false;
        routeFocus = true;
        routeRow = 0;
        return true;
      case 'y': {
        const host = retryable[0]?.server?.host;
        if (selProject) copyAdvice(selProject);
        else if (selKind === 'home' && host) copy('home', 'ssh ' + host, `Copied ssh ${host}.`);
        return true;
      }
      case 'q':
        quit();
        return true;
      case '?':
        showHelp = !showHelp;
        return true;
      case 'l':
        showHelp = false;
        logView = {
          key: sel,
          kind: 0,
          cursor: 0,
          pausedAt: 0,
          open: 0,
          search: '',
          searching: false,
          wrap: true,
          reveal: false,
          said: '',
          confirm: 0,
        };
        return true;
      case 'k':
      case 'up':
      case 'ArrowUp':
      case '↑↓':
        move(-1);
        return true;
      case 'j':
      case 'down':
      case 'ArrowDown':
        move(1);
        return true;
      case 'h':
      case 'esc':
      case 'Escape':
        if (query) {
          query = '';
          if (s !== 'h') return true;
        }
        selectRow('home');
        return true;
      case '/':
        filtering = true;
        return true;
      case 'n':
        openForm();
        return true;
      case 's':
        say('Adding a server asks for its SSH host. Try it with nearhost.');
        return true;
      case 'enter':
      case 'Enter':
        enter();
        return true;
      case 'o':
        if (selProject) say(`nearhost opens https://${selProject.alias} in your browser.`);
        return true;
      case 'i':
        // With the routes focused every route shows, so i changes nothing.
        if (selProject && !routeFocus) showIgnored = !showIgnored;
        return true;
    }
    return false;
  }

  function key(ev: KeyboardEvent) {
    if (ev.metaKey || ev.altKey || (ev.ctrlKey && ev.key !== 'c')) return;
    const k = ev.key;
    let handled: boolean;
    if (ev.ctrlKey && k === 'c') {
      if (!exited) quit(true);
      handled = true;
    } else if (exited) {
      if (k === 'Enter') relaunch();
      handled = k === 'Enter';
    } else if (quitting) handled = true;
    else if (quitBox) handled = quitBoxKey(k);
    else if (confirmBox) handled = confirmKey(k);
    else if (form) handled = formKey(k, ev);
    else if (logView) handled = logKey(k, ev);
    else if (showHelp && (k === '?' || k === 'Escape')) {
      showHelp = false;
      handled = true;
    } else if (routeFocus && !filtering && routesKey(k)) handled = true;
    else if (filtering) handled = filterKey(k, ev);
    else handled = action(k);
    if (handled) ev.preventDefault();
  }

  // A footer action that was clicked runs as its key would.
  function footerClick(k: string) {
    term?.focus();
    const keys: Record<string, string> = {
      enter: 'Enter',
      esc: 'Escape',
      tab: 'Tab',
      space: ' ',
      '↑↓': 'ArrowDown',
      'j/k': 'ArrowDown',
    };
    key(new KeyboardEvent('keydown', { key: keys[k] ?? k }));
  }

  function clickRow(r: Row) {
    if (form || logView || quitBox || confirmBox) return;
    term?.focus();
    selectRow(r.key);
  }

  // Traffic: running projects get requests now and then.
  function request(p: Project, method: string, path: string, replay = false) {
    const roll = Math.random();
    let status = method === 'POST' ? 302 : 200;
    if (!replay && roll < 0.04) status = 500;
    else if (!replay && roll < 0.09) status = 404;
    const html = !path.startsWith('/api') && !path.includes('.');
    push({
      keys: projectKeys(p.name, p.server),
      source: p.name,
      method,
      path,
      status,
      ms: Math.round(8 + Math.random() * (html ? 90 : 40)),
      type: html ? 'text/html' : path.endsWith('.js') ? 'text/javascript' : 'application/json',
      size: `${(0.4 + Math.random() * 20).toFixed(1)} kB`,
      tone: status >= 500 ? 'r' : '',
    });
    return status;
  }

  function copyAdvice(p: Project) {
    if (p.advice) copy('prj:' + p.name, p.advice.snippet, `Copied the advice for ${p.name}.`);
    else alert('prj:' + p.name, `${p.name} has no advice to copy.`, true);
  }

  function tick() {
    const live = projects.filter((p) => p.state === 'running');
    if (!live.length) return;
    const p = live[Math.floor(Math.random() * live.length)];
    const path = p.paths[Math.floor(Math.random() * p.paths.length)];
    request(p, path === '/login' ? 'POST' : 'GET', path);
  }

  onMount(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let visible = false;
    const seen = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    if (term) seen.observe(term);
    const base = Date.now();
    const clockTimer = setInterval(() => {
      now = START + (Date.now() - base);
    }, 1000);
    const spinTimer = setInterval(() => {
      if (visible && !reduced) frame++;
    }, 83);
    let traffic: ReturnType<typeof setTimeout>;
    const next = () => {
      traffic = setTimeout(
        () => {
          if (visible && !reduced && !document.hidden) tick();
          next();
        },
        900 + Math.random() * 2200,
      );
    };
    next();
    later(2200, () => {
      const other = project('otherapp');
      if (other?.state === 'starting' && !other.message) setState(other, 'running');
    });
    return () => {
      seen.disconnect();
      clearInterval(clockTimer);
      clearInterval(spinTimer);
      clearTimeout(traffic);
    };
  });

  // Rendering helpers for the panel's log.
  const pad = (s: string | number, n: number) => String(s).padEnd(n);
  const took = (ms?: number) => (ms === undefined ? '' : `${ms}ms`.padStart(5));
  // A source in its eight cells, cut short with … as the real log cuts it.
  const fit8 = (s: string) => (s.length > 8 ? s.slice(0, 7) + '…' : s);
  const recent = (key: string, n: number) => entriesFor(key).slice(-n);
</script>

{#snippet line(e: Entry, sources: boolean)}
  <span class="d c10">{e.at}</span>{#if e.method}{#if sources}<span class="c10"
        >{fit8(e.source)}</span
      ><span class="grow">{e.method} {e.path}</span>{:else}<span class="c10">{e.method}</span><span
        class="grow">{e.path}</span
      >{/if}<span class="st {statusTone(e.status ?? 0)}">{e.status}</span><span class="d took"
      >{took(e.ms)}</span
    >
  {:else}<span class="c10">{fit8(e.source)}</span><span class="grow {e.tone}">{e.text}</span>{/if}
{/snippet}

{#snippet rule(label: string, right: string = '')}
  <div class="ruled">
    <span class="d">{label}{' '}</span><span class="hr"></span>{#if right}<span class="d"
        >{' '}{right}{' '}</span
      ><span class="b">●</span>{/if}
  </div>
{/snippet}

<!-- A labelled value of a panel, its later lines under its first. -->
{#snippet field(label: string, value: string, tone: Tone = '')}
  <div class="fld">
    <span class="d lab">{label}</span><span class="val {tone}">{value}</span>
  </div>
{/snippet}

<!-- How the machine is, as the header says it: in full, or one dot on a phone. -->
{#snippet summary()}
  <span class="wideonly"
    ><span class="d">proxy</span> <span class="b">●</span> :443 <span class="d">·</span>
    <span class="d">CA</span> trusted <span class="d">·</span>
    <span class="d">hosts</span>
    ok{#if problems.length}{' '}<span class="d">·</span>{' '}<span class="r"
        >{problems.length} problem{problems.length > 1 ? 's' : ''}</span
      >{/if}{' '}</span
  ><span class="narrowonly"
    ><span class={problems.length ? 'r' : 'b'}>{problems.length ? '✕' : '●'}</span>
    <span class="d">proxy · CA · hosts</span>{' '}</span
  >
{/snippet}

{#snippet panelLog(label: string, key: string, sources: boolean)}
  <div class="l"></div>
  {@render rule(label, 'following')}
  <div class="tail">
    <div class="tailin">
      {#each recent(key, 30) as e (e.seq)}<div class="l lr" class:wrapped={!e.method}>
          {@render line(e, sources)}
        </div>{/each}
    </div>
  </div>
{/snippet}

<!-- Sample data, kept out of search snippets and AI answers. -->
<div class="frame" data-nosnippet>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
  <div
    class="term"
    class:focused
    bind:this={term}
    tabindex="0"
    role="application"
    aria-label="A working mock-up of the nearhost interface. Use the keys it lists in its footer."
    aria-roledescription="terminal"
    onkeydown={key}
    onfocus={() => (focused = true)}
    onblur={() => (focused = false)}
  >
    <div class="titlebar">
      <span class="lights" aria-hidden="true"><i></i><i></i><i></i></span>
      <span>nearhost — 120×36</span>
      <span class="focus-hint">{focused ? 'keys go to nearhost' : 'click to use the keys'}</span>
    </div>

    {#if exited}
      <div class="screen shell">
        <div class="l"><span class="d">~/code/myapp</span> <span class="b">$</span> nearhost</div>
        {#if exited === 'leave'}
          <div class="l wrap">
            Nearhost is still running in the background. Stop it with nearhost stop.
          </div>
        {/if}
        <div class="l">
          <span class="d">~/code/myapp</span> <span class="b">$</span> <span class="caret"></span>
        </div>
        <div class="l"></div>
        <button type="button" class="l again" onclick={relaunch}>
          <span class="b">enter</span> <span class="d">run nearhost again</span>
        </button>
      </div>
    {:else}
      <div class="screen" class:dimmed={!!form || !!quitBox || !!confirmBox}>
        {#if logView}
          {@const lp = project(nameOf(logView.key))}
          {@const sources = !logView.key.startsWith('prj:')}
          <div class="f head">
            <span
              >{' '}<span class="b s">∩</span> <span class="s">nearhost</span>
              {#if logView.key !== 'home'}<span class="d">›</span>
                {nameOf(logView.key)}{' '}{/if}<span class="d">›</span> log</span
            >
            {#if lp}<span
                ><span class={stateTone(lp.state)}>{stateDot(lp.state)}</span>
                {lp.state} <span class="d">·</span>
                <span class="b u">https://{lp.alias}</span>{' '}</span
              >{:else}<span>{@render summary()}</span>{/if}
          </div>
          <div class="hr row"></div>
          <div class="f">
            <span class="tabs"
              >{' '}{#each KINDS as kind, i (kind)}<button
                  type="button"
                  class:on={logView.kind === i}
                  onclick={() => logView && (logView.kind = i)}
                  >{' '}{kind}{kind === 'errors' && errorCount ? ` ${errorCount}` : ''}{' '}</button
                >{' '}{/each}{#if logView.searching || logView.search}{'   '}<span class="b">/</span
                >{' '}{logView.search}{#if logView.searching}<span class="caret"
                  ></span>{/if}{/if}</span
            >
            <span class="d"
              >{logView.kind || logView.search
                ? `${logLines.length} of ${entriesFor(logView.key).length}`
                : logLines.length} lines · {logView.cursor ? 'paused' : 'following'}{' '}</span
            >
          </div>
          <div class="l"></div>
          <div class="logfull" class:following={!logView.cursor}>
            {#each logWindow as e (e.seq)}
              {@const on = logView.cursor ? e.seq === logView.cursor : false}
              <div class="l lr" class:sel={on} class:wrapped={logView.wrap && !e.method}>
                <span class="b bar">{on ? '▌' : ' '}</span>{@render line(e, sources)}
              </div>
              {#if logView.open === e.seq}
                {@const rp = project(e.source)}
                <div class="l">
                  <span class="d">{'   │ '}{pad('request', 9)}</span>host: {rp?.alias}
                  <span class="d">·</span>
                  accept: {e.type} <span class="d">·</span> cookie: {logView.reveal
                    ? 'session=8f3a1c9e2b'
                    : '•••'}
                </div>
                <div class="l">
                  <span class="d">{'   │ '}{pad('response', 9)}</span><span
                    class={statusTone(e.status ?? 0)}>{e.status}</span
                  >
                  <span class="d">·</span>
                  {e.type} <span class="d">·</span>
                  {e.size}
                </div>
                {#if (e.status ?? 0) >= 500}
                  <div class="l">
                    <span class="d">{'   │ '}{pad('body', 9)}</span><span class="r"
                      >{'{"message":"SQLSTATE[42S22]: Column not found: owner"}'}</span
                    >
                  </div>
                {/if}
                {#if rp}
                  {@const web = rp.routes.find((r) => r.role === 'web')}
                  <div class="l">
                    <span class="d">{'   │ '}{pad('route', 9)}</span>{web?.port} web
                    <span class="d">→</span>
                    127.0.0.1:{rp.webLocal}{#if rp.server !== 'local'}{' '}<span class="d">→</span>
                      {rp.server}:{web?.port} <span class="d">over ssh</span>{/if}
                  </div>
                {/if}
                <div class="l">
                  <span class="d">{'   │ '}</span><span class="b">c</span>
                  <span class="d">copy as curl ·</span>
                  <span class="b">r</span> <span class="d">replay ·</span>
                  <span class="b">v</span>
                  <span class="d">{logView.reveal ? 'hide' : 'reveal'} ·</span>
                  <span class="b">enter</span>
                  <span class="d">collapse</span>
                </div>
              {/if}
            {/each}
          </div>
          {#if logView.confirm}
            {@const e = logLines.find((x) => x.seq === logView!.confirm)}
            <div class="f">
              <span class="a">{' '}Send {e?.method} {e?.path} again? It may change something.</span>
              <span
                ><span class="b">y</span>
                <span class="d">send · any other key keeps it</span>{' '}</span
              >
            </div>
          {:else if logView.said}
            <div class="f"><span>{' '}{logView.said}</span></div>
          {:else if newer}
            <div class="f">
              <span class="a">{' '}▼ {newer} new lines below</span>
              <span
                ><span class="b">G</span>
                <span class="d">jump to the end and follow</span>{' '}</span
              >
            </div>
          {/if}
        {:else}
          <div class="f head">
            <span>{' '}<span class="b s">∩</span> <span class="s">nearhost</span></span>
            <span>{@render summary()}</span>
          </div>
          <div class="hr row"></div>

          <div class="body">
            <nav class="side" aria-label="Projects and servers">
              {#if filtering || query}
                <div class="l">
                  {' '}<span class="b">/</span>
                  {query}{#if filtering}<span class="caret"></span>{/if}
                </div>
                <div class="l d">
                  {' '}{projects.filter((p) => matches(p.name)).length} of {projects.length} match
                </div>
              {/if}
              {#each rows as r (r.key)}
                {@const on = r.key === sel}
                <button type="button" class="f rowbtn" class:sel={on} onclick={() => clickRow(r)}>
                  {#if r.kind === 'home'}
                    <span
                      ><span class="b">{on ? '▌' : ' '}</span><span class:s={on}>home</span></span
                    >
                    <span class={running ? 'b' : 'd'}
                      >{running ? `${running} running` : 'nothing running'}{' '}</span
                    >
                  {:else if r.kind === 'server'}
                    {@const s = server(r.name)!}
                    <span
                      ><span class="b">{on ? '▌' : ' '}</span><span class="d"
                        >{collapsed[s.name] ? '▸' : '▾'}</span
                      >
                      <span class:s={on}>{s.name}</span></span
                    >
                    {#if s.name === 'local'}
                      {@const here = projects.filter((p) => p.server === 'local')}
                      <span class="d"
                        >{query
                          ? `${here.filter((p) => matches(p.name)).length} of ${here.length}`
                          : here.length}{' '}</span
                      >
                    {:else}
                      <span
                        ><span class={linkTone(s.link)}>{linkDot(s.link)}</span><span
                          class={s.link === 'connected' ? '' : linkTone(s.link)}
                          >{' '}{linkWord(s)}{' '}</span
                        ></span
                      >
                    {/if}
                  {:else}
                    {@const p = project(r.name)!}
                    {@const [a, m, z] = splitMatch(p.name)}
                    <span
                      ><span class="b">{on ? '▌' : ' '}</span>{'  '}<span class={stateTone(p.state)}
                        >{stateDot(p.state)}</span
                      >
                      <span class:s={on}>{a}<span class="m">{m}</span>{z}</span></span
                    >
                    <span class={on || p.state !== 'running' ? stateTone(p.state) : 'd'}
                      >{p.state}{' '}</span
                    >
                  {/if}
                </button>
                {#if r.kind === 'home'}<div class="l"></div>{/if}
              {/each}
            </nav>

            <div class="panel">
              {#if selProject}
                {@const p = selProject}
                {@const up = uptime(p)}
                {@const fix = fixFor(p)}
                <div class="f">
                  <span
                    ><span class="s">{p.name}</span>{'  '}<span class="b u">https://{p.alias}</span
                    ></span
                  >
                  <span
                    ><span class={stateTone(p.state)}>{stateDot(p.state)}</span>
                    {p.state}{#if up}<span class="d">{` · up ${up}`}</span>{/if}</span
                  >
                </div>
                <div class="l meta">
                  <span
                    ><span class="d">server</span>
                    {p.server === 'local' ? 'this machine' : p.server}</span
                  >{#if p.preset}<span><span class="d">preset</span> {p.preset}</span>{/if}<span
                    ><span class="d">path</span> {p.path}</span
                  >
                </div>
                {#if p.message}{@render field('why', p.message)}{/if}
                {#if fix}{@render field('fix', fix)}{/if}
                <div class="l"></div>
                <div class="l d routes">
                  <span class="bar"></span><span class="c8">port</span><span class="c12">role</span
                  ><span class="grow">label</span><span class="c10">local</span><span class="stc"
                    >status</span
                  >
                </div>
                {@const fold = !showIgnored && !routeFocus}
                {@const ignored = p.routes.filter((r) => r.role === 'ignore').map((r) => r.port)}
                {#each p.routes as r, i (r.port)}
                  {#if !(fold && r.role === 'ignore')}
                    {@const [dot, tone] = routeDot(p, r)}
                    <div
                      class="l routes"
                      class:d={r.role === 'ignore'}
                      class:sel={routeFocus && i === routeRow}
                    >
                      <span class="b">{routeFocus && i === routeRow ? '▌' : ' '}</span><span
                        class="c8">{r.port}</span
                      ><span class="c12 {r.role === 'web' ? 'b' : ''}">{r.role}</span><span
                        class="grow">{r.label}</span
                      ><span class="c10">{localPort(p, r)}</span><span class="stc {tone}"
                        >{dot}</span
                      >
                    </div>
                  {/if}
                {/each}
                {#if ignored.length && !routeFocus}
                  {#if fold}
                    <div class="l d">
                      {' '}{ignored.length} ignored: {ignored.join(' ')}{'  ·  '}<span class="b"
                        >i</span
                      > show
                    </div>
                  {:else}
                    <div class="l">
                      {' '}<span class="b">i</span><span class="d"
                        >{` hide the ${ignored.length} ignored`}</span
                      >
                    </div>
                  {/if}
                {/if}
                {#if p.advice}
                  <div class="l"></div>
                  <div class="advice">
                    <span class="a">▲ {p.advice.message}</span>
                    <span class="nowrap"
                      ><span class="b">y</span> <span class="d">copy fix</span></span
                    >
                  </div>
                {/if}
                {@render panelLog('log', sel, false)}
              {:else if selServer?.name === 'local'}
                <div class="l s">local</div>
                <div class="l"></div>
                <div class="l wrap">Projects on this machine. There is nothing to connect to.</div>
                {@render panelLog('log', sel, true)}
              {:else if selServer}
                {@const s = selServer}
                <div class="f">
                  <span class="s">{s.name}</span>
                  <span
                    ><span class={linkTone(s.link)}>{linkDot(s.link)}</span>
                    {connectionText(s)}</span
                  >
                </div>
                <div class="l"></div>
                {@render field('ssh host', s.host)}
                {#if s.held}
                  {@render field('why', 'you dropped the connection; its projects wait')}
                  {@render field('fix', 'Press c to connect it.')}
                {:else if s.error && s.link !== 'connected'}
                  {@render field('why', s.error)}
                  {@render field('fix', serverFix(s))}
                {/if}
                {@render field(
                  'projects',
                  projects
                    .filter((p) => p.server === s.name)
                    .map((p) => p.name)
                    .join(', ') || 'none',
                )}
                {@render panelLog('log', sel, true)}
              {:else}
                <div class="l s">Nearhost</div>
                <div class="l">
                  <span class="d">{pad('proxy', 10)}</span><span class="b">●</span> https :443
                  <span class="d">·</span> http :80
                </div>
                <div class="l">
                  <span class="d">{pad('page', 10)}</span><span class="b u"
                    >https://nearhost.localhost:6327</span
                  >
                </div>
                <div class="l">
                  <span class="d">{pad('local CA', 10)}</span><span class="b">●</span> trusted
                  <span class="d">· expires 2036-10-13</span>
                </div>
                <div class="l">
                  <span class="d">{pad('hosts', 10)}</span><span class="b">●</span>
                  {running ? `${running} name${running > 1 ? 's' : ''}` : 'no names configured'}
                </div>
                <div class="l">
                  <span class="d">{pad('config', 10)}</span>~/.config/nearhost/config.yaml
                </div>
                <div class="l">
                  <span class="d">{pad('running', 10)}</span>{running} of {projects.length} projects
                  <span class="d">on</span>
                  {`${serversUp} of ${servers.length} servers`}
                </div>
                {#if problems.length}
                  <div class="l"></div>
                  {@render rule('problems')}
                  {#each problems as x (x.title)}
                    <div class="l"></div>
                    <div class="l">
                      <span class={x.dot[1]}>{x.dot[0]}</span>
                      <span class="s">{x.title}</span>{'  '}<span class={x.dot[1]}>{x.what}</span>
                    </div>
                    <div class="indent">
                      {#if x.why}{@render field('why', x.why)}{/if}
                      {#if x.fix}{@render field('fix', x.fix)}{/if}
                      {#if x.blocks.length}{@render field('blocks', x.blocks.join(', '))}{/if}
                    </div>
                  {/each}
                  {#if retryable.length}
                    <div class="l"></div>
                    <div class="l">
                      {'  '}<span class="b">r</span> <span class="d">retry now ·</span>
                      <span class="b">y</span>
                      <span class="d">copy command</span>
                    </div>
                  {/if}
                {/if}
                {@render panelLog('recent', 'home', true)}
              {/if}
            </div>
          </div>
        {/if}

        <!-- What a key did, for two seconds, above the footer. -->
        <div class="toastwrap" role="status">
          {#if toast}
            <div class="toast">
              <span class={toast.problem ? 'a' : 'b'}>●</span>
              {toast.text}
            </div>
          {/if}
        </div>
        <div class="hr row"></div>
        {#if showHelp}
          <div class="help">
            {#each logView ? LOG_HELP : HELP as g (g.title)}
              <div>
                <div class="l s">{g.title}</div>
                {#each g.keys as [k, label] (k + label)}
                  <div class="l">
                    <span class="b k" class:kw={k.length > 6}>{k}</span><span class="d"
                      >{label}</span
                    >
                  </div>
                {/each}
              </div>
            {/each}
          </div>
        {:else}
          <div class="f foot">
            <span class="keys">
              {#if quitting}
                <span class="a"
                  >{' '}{quitting === 'leave' ? 'Leaving Nearhost running…' : 'Stopping…'}</span
                >
              {:else}
                {#each footer as it, i (it.key + it.label)}{#if it.key === '…'}<span class="d"
                      >{' '}…</span
                    >{:else}{#if i}<span class="d sep">{' · '}</span>{/if}<button
                      type="button"
                      onclick={() => footerClick(it.key)}
                      ><span class="b">{it.key}</span> <span class="d">{it.label}</span></button
                    >{/if}{/each}
              {/if}
            </span>
            <span class="d ctx">{footerContext}{' '}</span>
          </div>
        {/if}
      </div>

      {#if quitBox}
        {@const b = quitBox}
        <div class="overlay small" role="dialog" aria-label="Quit Nearhost">
          <div class="l s">Quit Nearhost</div>
          <div class="l"></div>
          <div class="wrap">Stop Nearhost, or leave it running in the background?</div>
          <div class="l"></div>
          <div class="l">
            <button type="button" onclick={() => end('stop', b.remember)}
              ><span class="b">{b.leave ? '  ' : '▸ '}</span><span class:chosen={!b.leave}
                >[ Stop ]</span
              ></button
            >{'   '}<button type="button" onclick={() => end('leave', b.remember)}
              ><span class="b">{b.leave ? '▸ ' : '  '}</span><span class:chosen={b.leave}
                >[ Leave running ]</span
              ></button
            >
          </div>
          <div class="l"></div>
          <div class="l">
            {'  '}<button
              type="button"
              role="checkbox"
              aria-checked={b.remember}
              onclick={() => (b.remember = !b.remember)}
              >{#if b.remember}<span class="b">[x]</span>{:else}[ ]{/if} Don't ask again</button
            >
          </div>
          <div class="formkeys">
            <span class="b">enter</span> <span class="d">choose ·</span> <span class="b">tab</span>
            <span class="d">move ·</span> <span class="b">space</span> <span class="d">tick ·</span>
            <span class="b">esc</span> <span class="d">cancel</span>
          </div>
        </div>
      {/if}

      {#if confirmBox}
        <div class="overlay small" role="dialog" aria-label={confirmBox.title}>
          <div class="l s">{confirmBox.title}</div>
          <div class="l"></div>
          {#if confirmBox.ask}<div class="wrap">{confirmBox.ask}</div>{/if}
          <div class="formkeys">
            <span class="b">y</span> <span class="d">remove ·</span> <span class="b">n</span>
            <span class="d">keep</span>
          </div>
        </div>
      {/if}

      {#if form}
        {@const f = form}
        <div class="overlay" role="dialog" aria-label="Add project">
          <div class="f">
            <span
              ><span class="s">Add project</span><span class="d">{` · ${STEPS[f.step]}`}</span
              ></span
            >
            <span class="d">{f.step + 1} of 7</span>
          </div>
          <div class="l progress" style="--at: {(f.step + 1) / 7}"><span></span></div>
          <div class="l"></div>
          {#if f.step >= 3 && f.step < 6}
            <div class="l"><span class="d">{pad('server', 10)}</span>{f.server}</div>
            <div class="l"><span class="d">{pad('path', 10)}</span>{f.path}</div>
            {#if f.step > 3}
              <div class="l">
                <span class="d">{pad('presets', 10)}</span>{['laravel', 'vite']
                  .filter((_, i) => f.presets[i])
                  .join(', ') || 'none'}
              </div>
            {/if}
            <div class="l"></div>
          {/if}
          {#if f.step === 0}
            {#each servers as s, i (s.name)}
              <button
                type="button"
                class="l rowbtn"
                onclick={() => ((f.cursor = i), formKey('Enter', new KeyboardEvent('keydown')))}
              >
                <span class="b">{f.cursor === i ? '▸ ' : '  '}</span>{pad(
                  s.name,
                  16,
                )}{#if s.name === 'local'}<span class="d">this machine</span>{:else}<span
                    class={linkTone(s.link)}>{linkDot(s.link)}</span
                  > <span class="d">{s.host}</span>{/if}
              </button>
            {/each}
            <div class="l">
              <span class="b">{f.cursor === servers.length ? '▸ ' : '  '}</span>New server…
            </div>
          {:else if f.step === 1}
            <div class="l">
              <span class="d">{pad('path', 10)}</span>{f.path}{#if !f.busy}<span class="caret"
                ></span>{#if f.path.endsWith('/')}<span class="d">shop/</span>{/if}{/if}
            </div>
            {#if f.path.endsWith('/') && !f.busy}
              <div class="l">
                <span class="d">{pad('', 10)}</span><span class="b">shop</span>{'  '}<span class="d"
                  >blog admin-panel scratch</span
                >
              </div>
            {/if}
          {:else if f.step === 3}
            <div class="l">Presets that suit this project:</div>
            <div class="l"></div>
            {#each ['laravel  Laravel', 'vite  Vite'] as text, i (text)}
              <div class="l">
                <span class="b">{f.routeRow === i ? '▸ ' : '  '}</span>{#if f.presets[i]}<span
                    class="b">[x]</span
                  >{:else}[ ]{/if}
                {text}<span class="d">{' · nearhost/presets'}</span>
              </div>
            {/each}
          {:else if f.step === 4}
            <div class="l">Found {f.routes.length} ports. Pick what to serve.</div>
            <div class="l"></div>
            {@const opened = f.routes.map((_, i) => opens(f, i))}
            {@const opensWidth = Math.max(5, ...opened.map((o) => Math.min(o.length, 28)))}
            {@const [tone, said, link, rest] = roleLine(f)}
            <div class="l d">
              {'      port    role          ' + pad('opens', opensWidth + 2) + 'label'}
            </div>
            {#each f.routes as r, i (r.port)}
              {@const on = i === f.routeRow}
              <div class="l" class:sel={on} class:d={r.role === 'ignore'}>
                <span class="b">{on ? '▌' : ' '}</span><span class={r.role === 'ignore' ? 'd' : 'b'}
                  >{r.role === 'ignore' ? '[ ]' : '[x]'}</span
                >
                {pad(r.port, 8)}<span class:b={on || r.role === 'web'}
                  >{pad(on ? `‹ ${r.role} ›` : r.role, 14)}</span
                >{pad(opened[i], opensWidth + 2)}{r.label}
              </div>
            {/each}
            <div class="l"></div>
            <div class="wrap">
              <span class={tone}>{said}</span>{#if link}<span class="b">{link}</span><span class="d"
                  >{rest}</span
                >{/if}
            </div>
          {:else if f.step === 5}
            <div class="l">
              <span class="d">{pad('name', 10)}</span>{f.name}{#if f.field === 0}<span
                  class="caret"
                >
                </span>{/if}
            </div>
            <div class="wrap hint d">
              What Nearhost calls the project: in the sidebar, the log and `nearhost up {f.name.trim() ||
                '<name>'}`.
            </div>
            <div class="l"></div>
            <div class="l">
              <span class="d">{pad('alias', 10)}https://</span>{f.alias}{#if f.field === 1}<span
                  class="caret"
                >
                </span>{/if}
            </div>
            <div class="wrap hint d">
              The address your browser opens. Any lowercase domain works, such as myapp.test or
              myapp.local.example.com.{f.aliasEdited
                ? ''
                : ' It follows the name until you change it.'}
            </div>
          {:else if f.step === 6}
            <div class="l">
              <span class="d">{pad('server', 10)}</span>{f.server === 'local'
                ? 'local (this machine)'
                : f.server}{#if f.server !== 'local'}<span class="d"
                  >{` (ssh ${server(f.server)?.host})`}</span
                >{/if}
            </div>
            <div class="l"><span class="d">{pad('path', 10)}</span>{f.path}</div>
            <div class="l"><span class="d">{pad('name', 10)}</span>{f.name}</div>
            <div class="l">
              <span class="d">{pad('alias', 10)}</span><span class="b">https://{f.alias}</span>
            </div>
            {#each f.routes as r, i (r.port)}
              <div class="l">
                <span class="d">{pad(i ? '' : 'routes', 10)}</span>{pad(r.port, 7)}{pad(
                  r.role,
                  10,
                )}{r.label}
              </div>
            {/each}
          {/if}
          {#if f.busy}
            <div class="l"></div>
            <div class="l"><span class="a">◐</span> {f.busy}</div>
          {/if}
          <div class="formkeys">
            {#if f.busy}
              <span class="b">esc</span> <span class="d">back</span>
            {:else if f.step === 0}
              <span class="b">enter</span> <span class="d">choose ·</span> <span class="b">↑↓</span>
              <span class="d">move ·</span> <span class="b">esc</span> <span class="d">cancel</span>
            {:else if f.step === 1}
              <span class="b">tab</span> <span class="d">complete ·</span> <span class="b">←→</span>
              <span class="d">move ·</span>{#if f.path.endsWith('/')}{' '}<span class="b">↑↓</span>
                <span class="d">choose ·</span>{/if}
              <span class="b">enter</span> <span class="d">next ·</span> <span class="b">esc</span>
              <span class="d">back</span>
            {:else if f.step === 3}
              <span class="b">space</span> <span class="d">tick ·</span>
              <span class="b">enter</span>
              <span class="d">next ·</span> <span class="b">esc</span> <span class="d">back</span>
            {:else if f.step === 4}
              <span class="b">space</span> <span class="d">toggle ·</span>
              <span class="b">←/→</span>
              <span class="d">role ·</span>
              {#if f.routes[f.routeRow].role === 'web'}<span class="b">h</span>
                <span class="d">hosts ·</span>{/if}
              <span class="b">enter</span>
              <span class="d">next ·</span>
              <span class="b">esc</span> <span class="d">back</span>
            {:else if f.step === 5}
              <span class="b">tab</span> <span class="d">switch ·</span> <span class="b">←→</span>
              <span class="d">move ·</span> <span class="b">enter</span>
              <span class="d">next ·</span> <span class="b">esc</span> <span class="d">back</span>
            {:else}
              <span class="b">enter</span> <span class="d">add ·</span>
              <span class="b">esc</span>
              <span class="d">back</span>
            {/if}
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  /* The terminal keeps its own colours, whatever the site's theme. */
  .frame {
    --ground: #0f1210;
    --beacon: #d6f26b;
    --text: #ecefe8;
    --dim: #7c8479;
    --amber: #f2b84b;
    --red: #f26b6b;
    --line: #2a312b;
    --selected: #1f261f;
    --faint: #3a413b;
    container-type: inline-size;
  }
  .term {
    --cell: 1.54em;
    position: relative;
    display: flex;
    flex-direction: column;
    background: var(--ground);
    color: var(--text);
    border: 1px solid var(--line);
    border-radius: var(--nh-radius-l);
    overflow: hidden;
    box-shadow: 0 40px 120px rgba(0, 0, 0, 0.5);
    font-family: var(--nh-font-mono);
    font-size: clamp(11px, calc((100cqi - 34px) / 73.5), 13.5px);
    line-height: var(--cell);
    font-variant-ligatures: none;
    outline: none;
    transition: border-color 0.15s;
  }
  .term.focused {
    border-color: color-mix(in srgb, var(--beacon) 45%, var(--line));
  }
  .titlebar {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    height: 30px;
    padding: 0 12px;
    background: #121513;
    border-bottom: 1px solid #1e231f;
    color: var(--dim);
    font-size: 11.5px;
  }
  .lights {
    display: flex;
    gap: 7px;
  }
  .lights i {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #2a312b;
  }
  .focus-hint {
    justify-self: end;
  }
  .screen {
    display: flex;
    flex-direction: column;
    height: calc(36 * var(--cell));
    padding: 10px 1ch 8px;
    box-sizing: content-box;
  }
  .shell {
    padding: 10px 2ch;
  }
  .again {
    width: max-content;
  }
  .l,
  .f {
    min-height: var(--cell);
    white-space: pre;
    overflow: hidden;
  }
  .f {
    display: flex;
    justify-content: space-between;
    gap: 2ch;
  }
  .f > span:first-child {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .hr {
    flex: 1;
    background: linear-gradient(var(--line), var(--line)) 0 50% / 100% 1px no-repeat;
  }
  .row {
    flex: none;
    height: var(--cell);
  }
  .ruled {
    display: flex;
    white-space: pre;
    height: var(--cell);
  }
  .body {
    display: flex;
    flex: 1;
    min-height: 0;
  }
  .side {
    width: 28ch;
    flex: none;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--line);
    margin-right: 0.5ch;
    overflow: hidden;
  }
  .panel {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    padding: 0 1ch 0 2ch;
    overflow: hidden;
  }
  .tail,
  .logfull {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    overflow: hidden;
  }
  .logfull:not(.following) {
    justify-content: flex-start;
  }
  .logfull {
    padding-right: 2ch;
  }
  /* The newest lines that fit, from the top, as the panel's log draws them:
     at least as tall as the log, so a short log starts at its top, and a long
     one loses its oldest lines over the top. */
  .tailin {
    flex: none;
    min-height: 100%;
    display: flex;
    flex-direction: column;
  }
  .lr {
    display: flex;
  }
  .grow {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  /* A log line that is not a request wraps, its later lines under its text. */
  .wrapped .grow {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .wrapped {
    flex: none;
  }
  /* A panel's field: the label, then the value, wrapped under itself. */
  .fld {
    display: flex;
    min-height: var(--cell);
  }
  .lab {
    width: 10ch;
    flex: none;
    white-space: pre;
  }
  .val {
    min-width: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .indent {
    padding-left: 2ch;
  }
  .routes {
    display: flex;
  }
  .c8 {
    width: 8ch;
    flex: none;
  }
  .c10 {
    width: 10ch;
    flex: none;
  }
  .took {
    width: 7ch;
    flex: none;
    text-align: right;
  }
  .st {
    width: 5ch;
    flex: none;
    text-align: right;
  }
  .c12 {
    width: 12ch;
    flex: none;
  }
  /* As wide as its header in every row, so the local column lines up with its values. */
  .stc {
    width: 6ch;
    flex: none;
    text-align: right;
  }
  /* Wraps between fields on a narrow screen rather than clipping the path. */
  .meta {
    display: flex;
    flex-wrap: wrap;
    column-gap: 4ch;
  }
  /* A long path wraps inside itself once it has a line to itself. */
  .meta > span {
    min-width: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .sel {
    background: var(--selected);
  }
  button {
    all: unset;
    cursor: pointer;
    white-space: pre;
  }
  button:focus-visible {
    outline: 1px solid var(--beacon);
  }
  .rowbtn {
    display: flex;
    justify-content: space-between;
    min-height: var(--cell);
  }
  .rowbtn:hover:not(.sel) {
    background: #151916;
  }
  .advice {
    display: flex;
    justify-content: space-between;
    gap: 2ch;
    align-items: center;
    margin: 0 0.5ch;
    padding: calc(var(--cell) / 2 - 1px) 1.5ch;
    border: 1px solid #6b5524;
    border-radius: 6px;
  }
  .nowrap {
    white-space: pre;
  }
  .help {
    display: grid;
    grid-template-columns: repeat(4, max-content);
    column-gap: 1ch;
    padding-left: 1ch;
  }
  .k {
    display: inline-block;
    width: 7ch;
  }
  /* A key longer than the column, such as pgup/pgdn, widens it. */
  .k.kw {
    width: 10ch;
  }
  /* The toast sits over the screen's foot, above the footer's rule. */
  .toastwrap {
    position: relative;
    height: 0;
  }
  .toast {
    position: absolute;
    right: 1ch;
    bottom: 0;
    max-width: min(62ch, calc(100% - 4ch));
    padding: calc(var(--cell) / 4) 1.5ch;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: pre;
    background: var(--ground);
    border: 1px solid #4a5449;
    border-radius: 6px;
  }
  .narrowonly {
    display: none;
  }
  .chosen {
    background: var(--beacon);
    color: var(--ground);
  }
  .foot .keys {
    display: flex;
    align-items: center;
    padding-left: 1ch;
    flex-wrap: wrap;
  }
  /* WCAG 2.2's 24px minimum target, for touch only: one line of text is about 18px tall. */
  @media (pointer: coarse) {
    .rowbtn,
    .foot .keys button {
      min-height: 24px;
      align-items: center;
    }
    .again {
      min-height: 24px;
    }
    .tabs button {
      display: inline-block;
      min-height: 24px;
    }
  }
  .foot .keys button:hover .d {
    color: var(--text);
  }
  .tabs .on {
    background: var(--beacon);
    color: var(--ground);
  }
  .tabs button:not(.on) {
    color: var(--dim);
  }
  .bar {
    width: 1ch;
    flex: none;
  }
  .caret {
    display: inline-block;
    width: 1ch;
    height: 1.2em;
    vertical-align: text-bottom;
    background: var(--beacon);
    animation: blink 1.06s steps(1) infinite;
  }
  @keyframes blink {
    50% {
      background: transparent;
    }
  }
  .overlay {
    position: absolute;
    left: 50%;
    top: calc(30px + 4 * var(--cell));
    transform: translateX(-50%);
    width: min(96ch, calc(100% - 4ch));
    min-height: calc(22 * var(--cell));
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    padding: calc(var(--cell) / 2) 2.5ch;
    background: #121613;
    border: 1px solid #4a5449;
    border-radius: 6px;
  }
  /* A box with no steps, such as the quit box, is as tall as what it says. */
  .overlay.small {
    width: min(76ch, calc(100% - 4ch));
    min-height: 0;
  }
  .overlay.small .formkeys {
    padding-top: var(--cell);
  }
  .progress {
    background: linear-gradient(var(--faint), var(--faint)) 0 50% / 100% 3px no-repeat;
  }
  .progress span {
    display: block;
    height: var(--cell);
    width: calc(var(--at) * 100%);
    background: linear-gradient(var(--beacon), var(--beacon)) 0 50% / 100% 3px no-repeat;
  }
  .wrap {
    white-space: normal;
  }
  .hint {
    padding-left: 10ch;
  }
  .formkeys {
    margin-top: auto;
    padding-top: var(--cell);
    white-space: pre-wrap;
  }
  .dimmed,
  .dimmed :global(*) {
    color: var(--faint) !important;
    background: none !important;
  }
  .dimmed :global(.hr) {
    background: linear-gradient(#1c201d, #1c201d) 0 50% / 100% 1px no-repeat !important;
  }
  .b {
    color: var(--beacon);
  }
  .d {
    color: var(--dim);
  }
  .a {
    color: var(--amber);
  }
  .r {
    color: var(--red);
  }
  .s {
    font-weight: 500;
    color: var(--text);
  }
  .u {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .m {
    color: var(--beacon);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  /* Below 120 columns the panes stack, as a phone has no room for both. */
  @container (max-width: 820px) {
    .term {
      font-size: 12px;
    }
    .titlebar span:nth-child(2) {
      display: none;
    }
    .titlebar {
      grid-template-columns: 1fr 1fr;
    }
    .screen {
      height: auto;
    }
    .body {
      flex-direction: column;
    }
    .side {
      width: auto;
      border-right: 0;
      border-bottom: 1px solid var(--line);
      margin: 0 0 var(--cell);
      padding-bottom: calc(var(--cell) / 2);
    }
    .tail {
      max-height: calc(8 * var(--cell));
    }
    .logfull {
      max-height: calc(24 * var(--cell));
    }
    .wideonly {
      display: none;
    }
    .narrowonly {
      display: inline;
    }
    .l,
    .lr {
      overflow-x: hidden;
    }
    /* Narrower route columns leave the label room to show, with a gap before local. */
    .routes .c8 {
      width: 6ch;
    }
    .routes .c12 {
      width: 10ch;
    }
    .routes .c10 {
      width: 7ch;
    }
    .routes .grow {
      padding-right: 1ch;
    }
    .help {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      row-gap: var(--cell);
    }
    /* A description too long for its column wraps under itself. */
    .help .l {
      display: flex;
      white-space: normal;
    }
    .help .k {
      flex: none;
    }
    .foot {
      flex-direction: column;
      gap: 0;
    }
    .foot .keys {
      row-gap: 2px;
    }
    .overlay,
    .overlay.small {
      top: 30px;
      width: 100%;
      min-height: 0;
      border-radius: 0;
      padding: calc(var(--cell) / 2) 1.5ch;
    }
    .advice {
      flex-direction: column;
      align-items: flex-start;
      white-space: normal;
    }
  }
</style>
