<script lang="ts">
  import { onMount, tick } from 'svelte';
  import CopyIcon from '../CopyIcon.svelte';

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
    return () => {
      clearTimeout(timer);
      clearTimeout(linkTimer);
    };
  });

  // Opens a URL in a new tab, or here when the browser blocks the tab: a failed copy has
  // awaited by then, so the click may no longer count as one.
  // (With "noopener" window.open always returns null, so drop the opener by hand instead.)
  function show(url: string) {
    const tab = window.open(url, '_blank');
    if (tab) tab.opener = null;
    else location.href = url;
  }

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
      // The catch below reports a failed fetch; this stops it also surfacing as unhandled.
      text.catch(() => {});
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
      show(localTwin);
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
      show(llms);
    }
    closeMenu();
  }

  $effect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root || root.contains(event.target as Node)) return;
      open = false;
      // Let the click move focus where it lands; only when it lands nowhere (plain text, the
      // page background) does focus go back to the arrow, so keyboard users keep their place.
      setTimeout(() => {
        if (document.activeElement === document.body) arrow?.focus();
      });
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
        <CopyIcon {copied} size={14} />
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
