<script lang="ts">
  import { onMount, tick } from 'svelte';

  interface Props {
    /** The absolute URL of this page's Markdown twin. */
    twin: string;
    /** The absolute URL of llms.txt. */
    llms: string;
  }
  let { twin, llms }: Props = $props();
  // The twin on this origin, so the dev server and PR previews copy and open their own.
  const localTwin = $derived(new URL(twin).pathname);

  // Until mounted only the plain link renders, so the server HTML works without JS.
  let mounted = $state(false);
  let open = $state(false);
  let alignStart = $state(false);
  let copied = $state(false);
  let linkCopied = $state(false);
  let linkTimer: ReturnType<typeof setTimeout> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let root: HTMLElement | undefined = $state();
  let arrow: HTMLButtonElement | undefined = $state();
  let menu: HTMLElement | undefined = $state();

  onMount(() => {
    mounted = true;
  });

  function showCopied() {
    copied = true;
    clearTimeout(timer);
    timer = setTimeout(() => (copied = false), 2000);
  }

  async function copyPage() {
    try {
      const text = fetch(localTwin).then(async (res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return new Blob([await res.text()], { type: 'text/plain' });
      });
      // Safari only lets the click write to the clipboard before anything is awaited, so
      // hand it the pending fetch as a promised item rather than waiting for it first.
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
        await navigator.clipboard.write([new ClipboardItem({ 'text/plain': text })]);
      } else {
        await navigator.clipboard.writeText(await (await text).text());
      }
      showCopied();
    } catch {
      // No twin or no clipboard: show the Markdown instead, so the reader can still take it.
      window.open(localTwin, '_blank', 'noopener');
    }
  }

  function items(): HTMLElement[] {
    return menu ? [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')] : [];
  }

  async function openMenu() {
    alignStart = false;
    open = true;
    await tick();
    // The menu opens leftwards from the button. Once the button wraps under a long title,
    // that runs out of the title row (or off a phone screen), so open rightwards instead.
    // The island wrapper has display: contents and no box, so measure the row around it.
    const row = root?.parentElement?.closest(':not(astro-island)');
    const rowLeft = row?.getBoundingClientRect().left ?? 0;
    if (menu && menu.getBoundingClientRect().left < Math.max(rowLeft, 8)) alignStart = true;
    items()[0]?.focus();
  }

  function closeMenu() {
    open = false;
    arrow?.focus();
  }

  function onMenuKeydown(event: KeyboardEvent) {
    const all = items();
    const at = all.indexOf(document.activeElement as HTMLElement);
    const moves: Record<string, number> = {
      ArrowDown: (at + 1) % all.length,
      ArrowUp: (at - 1 + all.length) % all.length,
      Home: 0,
      End: all.length - 1,
    };
    if (event.key in moves) {
      event.preventDefault();
      all[moves[event.key]]?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
    } else if (event.key === 'Tab') {
      open = false;
    }
  }

  async function copyLlms() {
    try {
      await navigator.clipboard.writeText(llms);
      linkCopied = true;
      clearTimeout(linkTimer);
      linkTimer = setTimeout(() => (linkCopied = false), 2000);
    } catch {
      window.open(llms, '_blank', 'noopener');
    }
    closeMenu();
  }

  $effect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (root && !root.contains(event.target as Node)) closeMenu();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  });
</script>

<div class="markdown-menu" data-markdown-menu bind:this={root}>
  {#if !mounted}
    <a class="btn" href={twin}>View Markdown</a>
  {:else}
    <div class="split">
      <button type="button" class="btn main" onclick={copyPage}>
        {#if copied}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        {:else}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="12" height="12" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        {/if}
        Copy as Markdown
      </button>
      <button
        type="button"
        class="btn arrow"
        aria-label="More Markdown options"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? 'markdown-menu-items' : undefined}
        bind:this={arrow}
        onclick={() => (open ? closeMenu() : openMenu())}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    </div>
    {#if open}
      <div
        id="markdown-menu-items"
        class="menu"
        class:start={alignStart}
        role="menu"
        aria-label="Markdown options"
        tabindex="-1"
        bind:this={menu}
        onkeydown={onMenuKeydown}
      >
        <a role="menuitem" tabindex="-1" href={twin}>
          View Markdown<small>Open this page as .md</small>
        </a>
        <button role="menuitem" tabindex="-1" type="button" onclick={copyLlms}>
          Copy llms.txt link<small>For pointing an agent at all the docs</small>
        </button>
      </div>
    {/if}
  {/if}
  <span class="sr-only" aria-live="polite"
    >{linkCopied ? 'Link copied' : copied ? 'Copied' : ''}</span
  >
</div>

<style>
  .markdown-menu {
    position: relative;
    display: inline-flex;
    font-size: 13px;
    line-height: 1.4;
  }
  .split {
    display: inline-flex;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 32px;
    padding: 6px 11px;
    background: var(--nh-surface);
    border: 1px solid var(--nh-line);
    border-radius: var(--nh-radius-s);
    color: var(--nh-text);
    font: inherit;
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
  }
  .btn:hover {
    background: var(--nh-raised);
  }
  .btn svg {
    width: 14px;
    height: 14px;
  }
  .main {
    border-radius: var(--nh-radius-s) 0 0 var(--nh-radius-s);
  }
  .arrow {
    padding: 6px 8px;
    border-left: none;
    border-radius: 0 var(--nh-radius-s) var(--nh-radius-s) 0;
  }
  .menu {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 10;
    width: 250px;
    padding: 6px;
    background: var(--nh-raised);
    border: 1px solid var(--nh-line);
    border-radius: var(--nh-radius-m);
    display: flex;
    flex-direction: column;
  }
  .menu.start {
    right: auto;
    left: 0;
  }
  .menu [role='menuitem'] {
    display: block;
    width: 100%;
    margin: 0;
    padding: 7px 9px;
    background: transparent;
    border: 0;
    border-radius: var(--nh-radius-s);
    color: var(--nh-text);
    font: inherit;
    text-align: start;
    text-decoration: none;
    cursor: pointer;
  }
  .menu [role='menuitem']:hover,
  .menu [role='menuitem']:focus {
    background: var(--nh-surface);
  }
  .menu small {
    display: block;
    color: var(--nh-muted);
    font-size: 12px;
  }
</style>
