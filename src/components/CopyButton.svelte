<script lang="ts">
  interface Props {
    text: string;
    label?: string;
    targetId?: string;
  }
  let { text, label = 'Copy to clipboard', targetId }: Props = $props();
  let copied = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      clearTimeout(timer);
      timer = setTimeout(() => (copied = false), 2000);
    } catch {
      const el = targetId ? document.getElementById(targetId) : null;
      if (!el) return;
      const range = document.createRange();
      range.selectNodeContents(el);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }
</script>

<button type="button" class="copy" aria-label={label} onclick={copy}>
  {#if copied}
    <svg
      width="18"
      height="18"
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
      width="18"
      height="18"
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
</button>
<span class="sr-only" aria-live="polite">{copied ? 'Copied' : ''}</span>

<style>
  .copy {
    background: transparent;
    border: 0;
    color: var(--nh-muted);
    width: 44px;
    height: 44px;
    border-radius: var(--nh-radius-s);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .copy:hover {
    color: var(--nh-text);
    background: var(--nh-raised);
  }
</style>
