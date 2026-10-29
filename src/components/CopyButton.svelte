<script lang="ts">
  import CopyIcon from './CopyIcon.svelte';

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
  <CopyIcon {copied} size={18} />
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
