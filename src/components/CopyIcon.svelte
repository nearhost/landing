<script lang="ts">
  // The copy icon, or a tick once copied. Shared by the copy buttons so they stay alike.
  interface Props {
    copied: boolean;
    size: number;
  }
  let { copied, size }: Props = $props();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  {#if copied}
    <path d="M20 6 9 17l-5-5" />
  {:else}
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  {/if}
</svg>
