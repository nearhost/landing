<script lang="ts">
  /* eslint-disable svelte/no-useless-mustaches -- a row's spaces are what lines it up, as in a terminal */
  // A working mock-up of the nearhost interface (0.4.0): the same screens,
  // keys and footer as the real one, driven by made-up projects and requests.
  import { onMount } from 'svelte';

  type State = 'running' | 'starting' | 'stopped' | 'error';
  type Role = 'web' | 'loopback' | 'ignore';
  type Link = 'connected' | 'connecting' | 'reconnecting' | 'disconnected' | 'auth failed';
  type Tone = '' | 'b' | 'a' | 'r' | 'd';

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
    tries: number;
  }
  interface Entry {
    seq: number;
    at: string;
    key: string; // the row it belongs to: home, srv:<name> or prj:<name>
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

  let servers = $state<Server[]>([
    { name: 'local', host: '', link: 'connected', tries: 0 },
    { name: 'mini', host: 'mini.lan', link: 'connected', tries: 0 },
    { name: 'vps', host: '203.0.113.40', link: 'auth failed', tries: 3 },
  ]);

  let projects = $state<Project[]>([
    {
      name: 'website',
      server: 'local',
      path: '~/code/website',
      alias: 'website.test',
      preset: 'astro',
      state: 'running',
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
    seed(offset, { key: 'prj:' + project, source: method, method, path, status, ms, type, size });

  let entries = $state<Entry[]>([
    seed(372, { key: 'srv:mini', source: 'mini', text: 'connected over ssh, 2 forwards' }),
    seed(369, { key: 'prj:myapp', source: 'forward', text: '127.0.0.1:52114 → mini:8080' }),
    seed(369, { key: 'prj:myapp', source: 'forward', text: '127.0.0.1:5173 → mini:5173' }),
    seed(368, { key: 'prj:myapp', source: 'proxy', text: 'https://myapp.test ready', tone: 'b' }),
    seed(364, { key: 'srv:vps', source: 'vps', text: 'auth failed', tone: 'r' }),
    seed(355, {
      key: 'prj:website',
      source: 'proxy',
      text: 'https://website.test ready',
      tone: 'b',
    }),
    req(361, 'myapp', 'GET', '/', 200, 41, 'text/html', '14.2 kB'),
    req(361, 'myapp', 'GET', '/@vite/client', 200, 3, 'text/javascript', '182 kB'),
    req(339, 'myapp', 'GET', '/dashboard', 200, 88, 'text/html', '22.9 kB'),
    req(326, 'myapp', 'POST', '/login', 302, 63, 'text/html', '0 B'),
    seed(308, { key: 'prj:myapp', source: 'hmr', text: 'src/pages/Dashboard.vue' }),
    req(297, 'myapp', 'GET', '/api/projects?sort=owner', 500, 212, 'application/json', '412 B'),
    req(296, 'myapp', 'GET', '/api/projects', 200, 54),
    req(290, 'myapp', 'GET', '/favicon.ico', 404, 1, 'text/html', '0 B'),
    req(250, 'website', 'GET', '/docs/', 200, 31, 'text/html', '18.0 kB'),
    seed(269, { key: 'prj:myapp', source: 'hmr', text: 'src/components/Card.vue' }),
    req(268, 'myapp', 'GET', '/dashboard', 200, 64, 'text/html', '22.9 kB'),
    req(247, 'myapp', 'GET', '/api/projects?page=2', 200, 49, 'application/json', '2.8 kB'),
    req(247, 'myapp', 'GET', '/api/user', 200, 18, 'application/json', '611 B'),
    req(0, 'myapp', 'GET', '/settings', 200, 77, 'text/html', '18.4 kB'),
  ]);

  // What is on the screen.
  let sel = $state('prj:myapp');
  let collapsed = $state<Record<string, boolean>>({});
  let routeFocus = $state(false);
  let routeRow = $state(0);
  let filtering = $state(false);
  let query = $state('');
  let showHelp = $state(false);
  let quitting = $state(false);
  let exited = $state(false);
  let flash = $state('');
  let frame = $state(0);
  let now = $state(START);
  let focused = $state(false);

  interface LogView {
    key: string;
    kind: number;
    cursor: number; // seq of the line under the cursor; 0 follows the end
    open: number; // seq of the request opened
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
    field: number;
    busy: string;
  }
  let form = $state<Form | null>(null);
  const STEPS = ['server', 'path', 'presets', 'presets', 'routes', 'name', 'confirm'];

  let term: HTMLDivElement | undefined = $state();
  let flashTimer: ReturnType<typeof setTimeout> | undefined;

  // Helpers.

  const project = (name: string) => projects.find((p) => p.name === name);
  const server = (name: string) => servers.find((s) => s.name === name);
  const kindOf = (key: string): Row['kind'] =>
    key === 'home' ? 'home' : key.startsWith('srv:') ? 'server' : 'project';
  const nameOf = (key: string) => key.slice(4);

  function say(text: string) {
    flash = text;
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => (flash = ''), 2600);
  }

  function note(key: string, source: string, text: string, tone: Tone = '') {
    entries.push({ seq: ++seq, at: stamp(now), key, source, text, tone });
    if (entries.length > 400) entries.splice(0, entries.length - 400);
  }

  function uptime(p: Project) {
    if (p.state !== 'running' || !p.since) return '';
    const d = Math.max(0, now - p.since);
    const m = Math.floor(d / 60_000);
    if (m < 1) return `${Math.floor(d / 1000)}s`;
    if (m < 60) return `${m}m`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
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
  let problems = $derived(servers.filter((s) => s.link === 'auth failed'));
  let serversUp = $derived(
    new Set(projects.filter((p) => p.state === 'running').map((p) => p.server)).size,
  );
  let spin = $derived(SPIN[frame % SPIN.length]);

  function stateTone(st: State): Tone {
    return st === 'running' ? 'b' : st === 'starting' ? 'a' : st === 'error' ? 'r' : 'd';
  }
  function stateDot(st: State) {
    return st === 'running' ? '●' : st === 'starting' ? spin : st === 'error' ? '●' : '○';
  }
  function linkTone(l: Link): Tone {
    return l === 'connected' ? 'b' : l === 'auth failed' ? 'r' : l === 'disconnected' ? 'd' : 'a';
  }
  function linkDot(l: Link) {
    return l === 'connected' ? '●' : l === 'connecting' || l === 'reconnecting' ? spin : '○';
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
    if (r.role === 'web' && p.state === 'running') return String(p.webLocal);
    if (r.role === 'loopback' && p.server !== 'local' && p.state === 'running')
      return String(r.port);
    return '–';
  }
  function routeDot(p: Project, r: Route): [string, Tone] {
    if (r.role === 'ignore') return ['–', 'd'];
    if (p.state === 'running') return ['●', 'b'];
    if (p.state === 'starting') return ['◐', 'a'];
    return ['○', 'd'];
  }

  const entriesFor = (key: string) =>
    key === 'home' ? entries.filter((e) => !e.method) : entries.filter((e) => e.key === key);

  // The footer: the keys that work now, as the real one lists them.
  let footer = $derived.by((): FooterItem[] => {
    if (quitting || exited) return [];
    if (form) return [];
    if (logView)
      return [
        { key: 'j/k', label: 'scroll' },
        { key: 'enter', label: 'expand' },
        { key: 'tab', label: 'kind' },
        { key: 'G', label: 'follow' },
        { key: 'c', label: 'copy curl' },
        { key: 'r', label: 'replay' },
        { key: 'esc', label: 'back' },
      ];
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
      if (problems.length) items = [{ key: 'r', label: 'retry' }];
    } else if (selServer) {
      items = [{ key: 'enter', label: 'collapse' }];
      if (selServer.name !== 'local') {
        const connect = selServer.link === 'disconnected' || selServer.link === 'auth failed';
        items.push(
          { key: 'r', label: 'reconnect' },
          { key: 'c', label: connect ? 'connect' : 'drop' },
          { key: 'e', label: 'edit' },
          { key: 'd', label: 'remove' },
        );
      }
    }
    return [
      ...items,
      { key: 'l', label: 'log' },
      { key: '/', label: 'filter' },
      { key: 's', label: 'server' },
      { key: 'n', label: 'add' },
      { key: '?', label: 'help' },
      { key: 'q', label: 'quit' },
    ];
  });

  let footerContext = $derived.by(() => {
    if (form || quitting || exited) return '';
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
      title: 'move',
      keys: [
        ['j/k', 'up and down'],
        ['h', 'home'],
        ['tab', 'routes'],
        ['/', 'filter by name'],
        ['esc', 'clear filter'],
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
      ],
    },
    {
      title: 'nearhost',
      keys: [
        ['n', 'add project'],
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

  function startProject(p: Project) {
    const srv = server(p.server);
    if (srv && srv.link !== 'connected') {
      p.state = 'error';
      note(
        'prj:' + p.name,
        'proxy',
        `${p.server} is not connected, so ${p.name} cannot start`,
        'r',
      );
      return;
    }
    p.state = 'starting';
    note('prj:' + p.name, 'nearhost', `Starting ${p.name}.`);
    later(1400, () => {
      if (p.state !== 'starting') return;
      for (const r of p.routes) {
        if (r.role === 'ignore' || p.server === 'local') continue;
        const local = r.role === 'web' ? p.webLocal : r.port;
        note('prj:' + p.name, 'forward', `127.0.0.1:${local} → ${p.server}:${r.port}`);
      }
      p.state = 'running';
      p.since = now;
      note('prj:' + p.name, 'proxy', `https://${p.alias} ready`, 'b');
    });
  }

  function stopProject(p: Project) {
    p.state = 'stopped';
    p.since = 0;
    note('prj:' + p.name, 'nearhost', `Stopped ${p.name}.`);
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

  function reconnect(s: Server) {
    s.link = 'reconnecting';
    note('srv:' + s.name, s.name, `Reconnecting ${s.name}.`);
    later(1500, () => {
      if (s.name === 'vps') {
        s.link = 'auth failed';
        s.tries += 1;
        note('srv:vps', 'vps', 'auth failed', 'r');
        return;
      }
      s.link = 'connected';
      note('srv:' + s.name, s.name, 'connected over ssh');
    });
  }

  function toggleConnection(s: Server) {
    const connect = s.link === 'disconnected' || s.link === 'auth failed';
    if (!connect) {
      note('srv:' + s.name, s.name, `Dropping the connection to ${s.name}.`);
      s.link = 'disconnected';
      for (const p of projects) if (p.server === s.name && p.state !== 'stopped') p.state = 'error';
      return;
    }
    note('srv:' + s.name, s.name, `Connecting ${s.name}.`);
    s.link = 'connecting';
    later(1400, () => {
      if (s.name === 'vps') {
        s.link = 'auth failed';
        s.tries += 1;
        note('srv:vps', 'vps', 'auth failed', 'r');
        return;
      }
      s.link = 'connected';
      note('srv:' + s.name, s.name, 'connected over ssh');
      for (const p of projects) if (p.server === s.name && p.state === 'error') startProject(p);
    });
  }

  async function copy(text: string, said: string) {
    try {
      await navigator.clipboard.writeText(text);
      say(said);
    } catch {
      say('The clipboard is not available here.');
    }
  }

  function quit() {
    quitting = true;
    later(900, () => {
      quitting = false;
      exited = true;
    });
  }

  function relaunch() {
    exited = false;
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
      field: 0,
      busy: '',
    };
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
          formBusy('Reading the project…', 900, () => {
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
          const role = roles[(roles.indexOf(r.role) + step) % 3];
          if (role === 'web') for (const o of f.routes) if (o.role === 'web') o.role = 'loopback';
          r.role = role;
        } else if (k === 'Enter') {
          if (!f.routes.some((r) => r.role === 'web')) {
            say('Pick a web route: it is what the address serves.');
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
        } else if (k === 'Backspace') {
          if (f.field === 0) f.name = f.name.slice(0, -1);
          else f.alias = f.alias.slice(0, -1);
        } else if (k.length === 1 && !ev.metaKey && !ev.ctrlKey) {
          if (f.field === 0) f.name += k;
          else f.alias += k;
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

  let logLines = $derived.by(() => {
    if (!logView) return [];
    const all = entriesFor(logView.key);
    switch (logView.kind) {
      case 1:
        return all.filter((e) => e.method);
      case 2:
        return all.filter((e) => !e.method);
      case 3:
        return all.filter((e) => (e.status ?? 0) >= 500 || e.tone === 'r');
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
  let errorCount = $derived(
    logView
      ? entriesFor(logView.key).filter((e) => (e.status ?? 0) >= 500 || e.tone === 'r').length
      : 0,
  );

  function logKey(k: string): boolean {
    const v = logView;
    if (!v) return false;
    const lines = logLines;
    const at = v.cursor ? lines.findIndex((e) => e.seq === v.cursor) : lines.length - 1;
    const cur = lines[at];
    switch (k) {
      case 'Escape':
      case 'q':
        logView = null;
        return true;
      case 'j':
      case 'ArrowDown':
        if (at >= lines.length - 1) v.cursor = 0;
        else v.cursor = lines[at + 1].seq;
        return true;
      case 'k':
      case 'ArrowUp':
        if (lines.length) v.cursor = lines[Math.max(at - 1, 0)].seq;
        return true;
      case 'G':
        v.cursor = 0;
        v.open = 0;
        return true;
      case 'Tab':
        v.kind = (v.kind + 1) % KINDS.length;
        v.cursor = 0;
        v.open = 0;
        return true;
      case 'Enter':
        if (cur?.method) {
          v.open = v.open === cur.seq ? 0 : cur.seq;
          if (!v.cursor) v.cursor = cur.seq;
        }
        return true;
      case 'c':
        if (cur?.method) {
          const p = project(nameOf(v.key));
          copy(
            `curl -i -X ${cur.method} 'https://${p?.alias ?? 'myapp.test'}${cur.path}'`,
            'Copied the request as curl.',
          );
        }
        return true;
      case 'r':
        if (cur?.method) {
          const p = project(nameOf(v.key));
          if (p) request(p, cur.method, cur.path!, true);
          say(`Sent ${cur.method} ${cur.path} again.`);
        }
        return true;
    }
    return false;
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
        if (p.advice) copy(p.advice.snippet, 'Copied the fix for vite.config.ts.');
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
        if (selProject || (selServer && selServer.name !== 'local'))
          say('Removing asks first. This demo keeps its projects.');
        return true;
      case 'c':
        if (selServer && selServer.name !== 'local') toggleConnection(selServer);
        return true;
      case 'r':
        if (selServer && selServer.name !== 'local') reconnect(selServer);
        else if (selKind === 'home') for (const s of problems) reconnect(s);
        return true;
      case 'tab':
      case 'Tab':
        if (!selProject) return false;
        routeFocus = true;
        routeRow = 0;
        return true;
      case 'y':
        if (selProject?.advice)
          copy(selProject.advice.snippet, 'Copied the fix for vite.config.ts.');
        else if (selKind === 'home' && problems.length)
          copy('ssh 203.0.113.40', 'Copied ssh 203.0.113.40.');
        return true;
      case 'q':
        quit();
        return true;
      case '?':
        showHelp = !showHelp;
        return true;
      case 'l':
        logView = { key: sel, kind: 0, cursor: 0, open: 0 };
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
        if (selProject) say(`Opens https://${selProject.alias} in your browser.`);
        return true;
    }
    return false;
  }

  function key(ev: KeyboardEvent) {
    if (ev.metaKey || ev.altKey || (ev.ctrlKey && ev.key !== 'c')) return;
    const k = ev.key;
    let handled: boolean;
    if (ev.ctrlKey && k === 'c') {
      if (!exited) quit();
      handled = true;
    } else if (exited) {
      if (k === 'Enter') relaunch();
      handled = k === 'Enter';
    } else if (quitting) handled = true;
    else if (form) handled = formKey(k, ev);
    else if (logView) handled = logKey(k);
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
    if (form || logView) return;
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
    entries.push({
      seq: ++seq,
      at: stamp(now),
      key: 'prj:' + p.name,
      source: method,
      method,
      path,
      status,
      ms: Math.round(8 + Math.random() * (html ? 90 : 40)),
      type: html ? 'text/html' : path.endsWith('.js') ? 'text/javascript' : 'application/json',
      size: `${(0.4 + Math.random() * 20).toFixed(1)} kB`,
    });
    if (entries.length > 400) entries.splice(0, entries.length - 400);
  }

  function tick() {
    const live = projects.filter((p) => p.state === 'running');
    if (!live.length) return;
    const p = live[Math.floor(Math.random() * live.length)];
    if (Math.random() < 0.1 && p.preset.includes('vite')) {
      note(
        'prj:' + p.name,
        'hmr',
        'src/components/' + ['Card', 'Nav', 'Table', 'Modal'][seq % 4] + '.vue',
      );
      return;
    }
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
      if (other?.state === 'starting') {
        other.state = 'running';
        other.since = now;
        note('prj:otherapp', 'forward', '127.0.0.1:52130 → mini:3000');
        note('prj:otherapp', 'proxy', 'https://otherapp.test ready', 'b');
      }
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
  const recent = (key: string, n: number) => entriesFor(key).slice(-n);
</script>

{#snippet line(e: Entry, wide: boolean)}
  <span class="d c10">{e.at}</span>{#if e.method}<span class="c10">{e.method}</span><span
      class="grow">{e.path}</span
    ><span class="st {statusTone(e.status ?? 0)}">{e.status}</span><span class="d took"
      >{took(e.ms)}</span
    >{#if wide}<span class="d wideonly c27"
        >{pad(e.type ?? '', 17)}{(e.size ?? '').padStart(8)}</span
      >{/if}
  {:else}<span class="c10">{e.source}</span><span class="grow {e.tone}">{e.text}</span>{/if}
{/snippet}

{#snippet rule(label: string, right: string = '')}
  <div class="ruled">
    <span class="d">{label}{' '}</span><span class="hr"></span>{#if right}<span class="d"
        >{' '}{right}{' '}</span
      ><span class="b">●</span>{/if}
  </div>
{/snippet}

<div class="frame">
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
        <div class="l d">Stopped the forwards and the proxy. Bye.</div>
        <div class="l">
          <span class="d">~/code/myapp</span> <span class="b">$</span> <span class="caret"></span>
        </div>
        <div class="l"></div>
        <button type="button" class="l again" onclick={relaunch}>
          <span class="b">enter</span> <span class="d">run nearhost again</span>
        </button>
      </div>
    {:else}
      <div class="screen" class:dimmed={!!form}>
        {#if logView}
          {@const lp = project(nameOf(logView.key))}
          <div class="f head">
            <span
              >{' '}<span class="b s">∩</span> <span class="s">nearhost</span>
              <span class="d">›</span>
              {nameOf(logView.key) || 'home'} <span class="d">›</span> log</span
            >
            {#if lp}<span
                ><span class={stateTone(lp.state)}>{stateDot(lp.state)}</span>
                {lp.state} <span class="d">·</span>
                <span class="b u">https://{lp.alias}</span>{' '}</span
              >{/if}
          </div>
          <div class="hr row"></div>
          <div class="f">
            <span class="tabs"
              >{' '}{#each KINDS as kind, i (kind)}<button
                  type="button"
                  class:on={logView.kind === i}
                  onclick={() =>
                    logView && ((logView.kind = i), (logView.cursor = 0), (logView.open = 0))}
                  >{' '}{kind}{' '}</button
                >{#if kind === 'errors' && errorCount}<span class="r">{errorCount}</span
                  >{/if}{' '}{/each}</span
            >
            <span class="d"
              >{logView.kind
                ? `${logLines.length} of ${entriesFor(logView.key).length}`
                : logLines.length} lines · {logView.cursor ? 'paused' : 'following'}{' '}</span
            >
          </div>
          <div class="l"></div>
          <div class="logfull" class:following={!logView.cursor}>
            {#each logWindow as e (e.seq)}
              {@const on = logView.cursor ? e.seq === logView.cursor : false}
              <div class="l lr" class:sel={on}>
                <span class="b bar">{on ? '▌' : ' '}</span>{@render line(e, true)}
              </div>
              {#if logView.open === e.seq}
                <div class="l">
                  <span class="d">{'   │ '}{pad('request', 9)}</span>host: {lp?.alias}
                  <span class="d">·</span>
                  accept: {e.type} <span class="d">·</span> cookie: •••
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
                {#if lp}
                  {@const web = lp.routes.find((r) => r.role === 'web')}
                  <div class="l">
                    <span class="d">{'   │ '}{pad('route', 9)}</span>{web?.port} web
                    <span class="d">→</span>
                    127.0.0.1:{lp.webLocal}{#if lp.server !== 'local'}{' '}<span class="d">→</span>
                      {lp.server}:{web?.port} <span class="d">over ssh</span>{/if}
                  </div>
                {/if}
                <div class="l">
                  <span class="d">{'   │ '}</span><span class="b">c</span>
                  <span class="d">copy as curl ·</span>
                  <span class="b">r</span> <span class="d">replay ·</span>
                  <span class="b">enter</span>
                  <span class="d">collapse</span>
                </div>
              {/if}
            {/each}
          </div>
        {:else}
          <div class="f head">
            <span>{' '}<span class="b s">∩</span> <span class="s">nearhost</span></span>
            <span
              ><span class="d">proxy</span> <span class="b">●</span> :443 <span class="d">·</span>
              <span class="d">CA</span> trusted <span class="d">·</span>
              <span class="d">hosts</span>
              ok{#if problems.length}{' '}<span class="d">·</span>{' '}<span class="r"
                  >{problems.length} problem</span
                >{/if}{' '}</span
            >
          </div>
          <div class="hr row"></div>

          <div class="body">
            <nav class="side" aria-label="Projects and servers">
              <div class="l"></div>
              {#if filtering || query}
                <div class="l">
                  {' '}<span class="b">/</span>
                  {query}{#if filtering}<span class="caret"></span>{/if}
                </div>
                <div class="l d">
                  {' '}{projects.filter((p) => matches(p.name)).length} of {projects.length} match
                </div>
              {/if}
              {#each rows as r, i (r.key)}
                {@const on = r.key === sel}
                {#if r.kind === 'server' && (i > 0 || filtering || query)}<div class="l"></div>{/if}
                <button type="button" class="f rowbtn" class:sel={on} onclick={() => clickRow(r)}>
                  {#if r.kind === 'home'}
                    <span
                      ><span class="b">{on ? '▌' : ' '}</span><span class:s={on}>home</span></span
                    >
                    <span class={running ? 'b' : 'd'}>{running} running{' '}</span>
                  {:else if r.kind === 'server'}
                    {@const s = server(r.name)!}
                    <span
                      ><span class="b">{on ? '▌' : ' '}</span><span class="d"
                        >{collapsed[s.name] ? '▸' : '▾'}</span
                      >
                      <span class:s={on}>{s.name}</span></span
                    >
                    {#if s.name === 'local'}
                      <span class="d"
                        >{projects.filter((p) => p.server === 'local').length}{' '}</span
                      >
                    {:else}
                      <span class={linkTone(s.link)}>{linkDot(s.link)} {s.link}{' '}</span>
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
              {/each}
            </nav>

            <div class="panel">
              <div class="l"></div>
              {#if selProject}
                {@const p = selProject}
                {@const up = uptime(p)}
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
                <div class="l"></div>
                <div class="l meta">
                  <span
                    ><span class="d">server</span>
                    {p.server === 'local' ? 'this machine' : p.server}</span
                  >{#if p.preset}<span><span class="d">preset</span> {p.preset}</span>{/if}<span
                    ><span class="d">path</span> {p.path}</span
                  >
                </div>
                {#if p.state === 'error'}
                  <div class="l">
                    <span class="d">{pad('why', 10)}</span>{p.server} is not connected.
                  </div>
                  <div class="l">
                    <span class="d">{pad('fix', 10)}</span>Select {p.server} and press
                    <span class="b">c</span> to connect.
                  </div>
                {/if}
                <div class="l"></div>
                <div class="l d routes">
                  <span class="bar"></span><span class="c8">port</span><span class="c12">role</span
                  ><span class="grow">label</span><span class="c10">local</span><span class="stc"
                    >status</span
                  >
                </div>
                {#each p.routes as r, i (r.port)}
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
                    ><span class="c10">{localPort(p, r)}</span><span class="stc {tone}">{dot}</span>
                  </div>
                {/each}
                {#if p.advice}
                  <div class="l"></div>
                  <div class="advice">
                    <span class="a">▲ {p.advice.message}</span>
                    <span class="nowrap"
                      ><span class="b">y</span> <span class="d">copy fix</span></span
                    >
                  </div>
                {/if}
                <div class="l"></div>
                {@render rule('log', 'following')}
                <div class="tail">
                  {#each recent(sel, 30) as e (e.seq)}<div class="l lr">
                      {@render line(e, false)}
                    </div>{/each}
                </div>
              {:else if selServer}
                {@const s = selServer}
                <div class="f">
                  <span class="s">{s.name}</span>
                  {#if s.name === 'local'}<span class="d">this machine</span>{:else}<span
                      class={linkTone(s.link)}>{linkDot(s.link)} {s.link}</span
                    >{/if}
                </div>
                <div class="l"></div>
                {#if s.name !== 'local'}<div class="l">
                    <span class="d">{pad('ssh host', 10)}</span>{s.host}
                  </div>{/if}
                {#if s.link === 'auth failed'}
                  <div class="l">
                    <span class="d">{pad('why', 10)}</span
                    >{'ssh: handshake failed: Permission denied (publickey)'}
                  </div>
                  <div class="l">
                    <span class="d">{pad('fix', 10)}</span>Run <span class="b">ssh {s.host}</span>
                    once in a terminal to fix access, then press <span class="b">r</span>.
                  </div>
                {/if}
                <div class="l">
                  <span class="d">{pad('projects', 10)}</span>{projects
                    .filter((p) => p.server === s.name)
                    .map((p) => p.name)
                    .join(', ') || 'none'}
                </div>
                <div class="l"></div>
                {@render rule('log', 'following')}
                <div class="tail">
                  {#each recent(sel, 30) as e (e.seq)}<div class="l lr">
                      {@render line(e, false)}
                    </div>{/each}
                </div>
              {:else}
                <div class="l s">Nearhost</div>
                <div class="l"></div>
                <div class="l">
                  <span class="d">{pad('proxy', 10)}</span><span class="b">●</span> https :443
                  <span class="d">·</span> http :80
                </div>
                <div class="l">
                  <span class="d">{pad('local CA', 10)}</span><span class="b">●</span> trusted
                  <span class="d">· expires 2036-10-13</span>
                </div>
                <div class="l">
                  <span class="d">{pad('hosts', 10)}</span><span class="b">●</span>
                  {projects.length} aliases
                </div>
                <div class="l">
                  <span class="d">{pad('config', 10)}</span>~/.config/nearhost/config.yaml
                </div>
                <div class="l">
                  <span class="d">{pad('running', 10)}</span>{running} of {projects.length} projects
                  <span class="d">on</span>
                  {`${serversUp} of ${servers.length} servers`}
                </div>
                <div class="l"></div>
                {#if problems.length}
                  {@render rule('problems')}
                  <div class="l"></div>
                  {#each problems as s (s.name)}
                    <div class="l">
                      <span class="r">○</span> <span class="s">{s.name}</span>{'  '}<span class="r"
                        >{s.link}</span
                      >
                      <span class="d">· retried {s.tries} times</span>
                    </div>
                    <div class="l">
                      <span class="d">{'  '}{pad('why', 10)}</span
                      >{'ssh: handshake failed: Permission denied (publickey)'}
                    </div>
                    <div class="l">
                      <span class="d">{'  '}{pad('fix', 10)}</span>Run
                      <span class="b">ssh {s.host}</span>
                      once in a terminal to fix access, then press <span class="b">r</span>.
                    </div>
                    <div class="l">
                      <span class="d">{'  '}{pad('blocks', 10)}</span>{projects
                        .filter((p) => p.server === s.name)
                        .map((p) => p.name)
                        .join(', ')}
                    </div>
                    <div class="l"></div>
                    <div class="l">
                      {'  '}<span class="b">r</span> <span class="d">retry now ·</span>
                      <span class="b">y</span>
                      <span class="d">copy command</span>
                    </div>
                  {/each}
                  <div class="l"></div>
                {/if}
                {@render rule('recent', 'following')}
                <div class="tail">
                  {#each recent('home', 30) as e (e.seq)}<div class="l lr">
                      <span class="d c10">{e.at}</span><span class="c12"
                        >{nameOf(e.key) || e.source}</span
                      ><span class="grow {e.tone}">{e.text}</span>
                    </div>{/each}
                </div>
              {/if}
            </div>
          </div>
        {/if}

        <div class="hr row"></div>
        {#if showHelp && !logView}
          <div class="help">
            {#each HELP as g (g.title)}
              <div>
                <div class="l s">{g.title}</div>
                {#each g.keys as [k, label] (k + label)}
                  <div class="l"><span class="b k">{k}</span><span class="d">{label}</span></div>
                {/each}
              </div>
            {/each}
          </div>
        {:else}
          <div class="f foot">
            <span class="keys">
              {#if quitting}
                <span class="a">{' '}Stopping…</span>
              {:else}
                {#each footer as it, i (it.key + it.label)}{#if i}<span class="d sep">{' · '}</span
                    >{/if}<button type="button" onclick={() => footerClick(it.key)}
                    ><span class="b">{it.key}</span> <span class="d">{it.label}</span></button
                  >{/each}
              {/if}
            </span>
            <span class="d ctx" aria-live="polite">{flash || footerContext}{' '}</span>
          </div>
        {/if}
      </div>

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
            {#each ['laravel  Laravel with Sail', 'vite  Vite dev server'] as text, i (text)}
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
            <div class="l d">{'      port    role          label'}</div>
            {#each f.routes as r, i (r.port)}
              {@const on = i === f.routeRow}
              <div class="l" class:sel={on} class:d={r.role === 'ignore'}>
                <span class="b">{on ? '▌' : ' '}</span><span class={r.role === 'ignore' ? 'd' : 'b'}
                  >{r.role === 'ignore' ? '[ ]' : '[x]'}</span
                >
                {pad(r.port, 8)}<span class:b={on || r.role === 'web'}
                  >{pad(on ? `‹ ${r.role} ›` : r.role, 14)}</span
                >{r.label}
              </div>
            {/each}
            <div class="l"></div>
            <div class="wrap">
              <span class="d">{'web is what '}</span><span class="b">https://{f.alias}</span><span
                class="d"
                >{' serves.'}{f.server === 'local'
                  ? ''
                  : ' loopback ports open on 127.0.0.1 here too, so the browser reaches them.'}</span
              >
            </div>
          {:else if f.step === 5}
            <div class="l">
              <span class="d">{pad('name', 10)}</span>{f.name}{#if f.field === 0}<span
                  class="caret"
                >
                </span>{/if}
            </div>
            <div class="l">
              <span class="d">{pad('alias', 10)}</span>{f.alias}{#if f.field === 1}<span
                  class="caret"
                >
                </span>{/if}
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
            <div class="l"><span class="a">{spin}</span> {f.busy}</div>
          {/if}
          <div class="formkeys">
            {#if f.busy}
              <span class="b">esc</span> <span class="d">back</span>
            {:else if f.step === 0}
              <span class="b">enter</span> <span class="d">choose ·</span> <span class="b">↑↓</span>
              <span class="d">move ·</span> <span class="b">esc</span> <span class="d">cancel</span>
            {:else if f.step === 1}
              <span class="b">enter</span> <span class="d">next ·</span> <span class="b">tab</span>
              <span class="d">complete ·</span> <span class="b">esc</span>
              <span class="d">back</span>
            {:else if f.step === 3}
              <span class="b">space</span> <span class="d">toggle ·</span>
              <span class="b">enter</span>
              <span class="d">next ·</span> <span class="b">esc</span> <span class="d">back</span>
            {:else if f.step === 4}
              <span class="b">space</span> <span class="d">toggle ·</span>
              <span class="b">←/→</span>
              <span class="d">role ·</span> <span class="b">enter</span>
              <span class="d">next ·</span>
              <span class="b">esc</span> <span class="d">back</span>
            {:else if f.step === 5}
              <span class="b">tab</span> <span class="d">field ·</span> <span class="b">enter</span>
              <span class="d">next ·</span> <span class="b">esc</span> <span class="d">back</span>
            {:else}
              <span class="b">enter</span> <span class="d">save and start ·</span>
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
  .lr {
    display: flex;
  }
  .grow {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
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
  .c27 {
    width: 30ch;
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
    background: #1a1810;
  }
  .nowrap {
    white-space: pre;
  }
  .help {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    padding-left: 1ch;
  }
  .k {
    display: inline-block;
    width: 7ch;
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
    width: min(76ch, calc(100% - 4ch));
    min-height: calc(22 * var(--cell));
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    padding: calc(var(--cell) / 2) 2.5ch;
    background: #121613;
    border: 1px solid #4a5449;
    border-radius: 6px;
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
    .head > span:last-child,
    .wideonly {
      display: none;
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
      grid-template-columns: repeat(2, 1fr);
      row-gap: var(--cell);
    }
    .foot {
      flex-direction: column;
      gap: 0;
    }
    .foot .keys {
      row-gap: 2px;
    }
    .overlay {
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
