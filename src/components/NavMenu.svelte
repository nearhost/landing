<script lang="ts">
  interface Link {
    href: string;
    label: string;
  }
  let { links }: { links: Link[] } = $props();
  let open = $state(false);

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') open = false;
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="menu" onkeydown={onKeydown}>
  <button
    type="button"
    class="toggle"
    aria-expanded={open}
    aria-controls="nav-menu-list"
    onclick={() => (open = !open)}
  >
    <span class="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      aria-hidden="true"
    >
      {#if open}
        <path d="M6 6l12 12M18 6 6 18" />
      {:else}
        <path d="M4 7h16M4 12h16M4 17h16" />
      {/if}
    </svg>
  </button>
  {#if open}
    <ul id="nav-menu-list" class="list">
      {#each links as link (link.href)}
        <li><a href={link.href} onclick={() => (open = false)}>{link.label}</a></li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .menu {
    position: relative;
  }
  .toggle {
    background: transparent;
    border: 1px solid var(--nh-line);
    color: var(--nh-text);
    width: 44px;
    height: 44px;
    border-radius: var(--nh-radius-s);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .list {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    min-width: 200px;
    margin: 0;
    padding: 8px;
    list-style: none;
    background: var(--nh-surface);
    border: 1px solid var(--nh-line);
    border-radius: var(--nh-radius-m);
    display: flex;
    flex-direction: column;
  }
  .list a {
    display: block;
    padding: 12px 14px;
    border-radius: var(--nh-radius-s);
    font-weight: 500;
  }
  .list a:hover {
    background: var(--nh-raised);
    color: var(--nh-text);
  }
</style>
