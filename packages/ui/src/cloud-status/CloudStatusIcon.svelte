<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import IconButton from '../button/IconButton.svelte';

  export let label = 'Cloud sync needs attention';
  export let state: 'warning' | 'info' = 'warning';

  const dispatch = createEventDispatcher<{ click: MouseEvent }>();
</script>

<span class="astryx-cloud-status" data-state={state}>
  <IconButton {label} size="sm" variant="ghost" on:click={(e) => dispatch('click', e.detail)}>
    <slot />
  </IconButton>
  <span class="astryx-cloud-status-dot" aria-hidden="true"></span>
</span>

<style>
  .astryx-cloud-status {
    position: relative;
  }
  .astryx-cloud-status-dot {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 8px;
    height: 8px;
    border-radius: var(--astryx-radius-full, 9999px);
    background-color: var(--astryx-color-warning, #f59e0b);
  }
  .astryx-cloud-status[data-state='warning'] .astryx-cloud-status-dot {
    animation: astryx-cloud-status-pulse 1.6s ease-in-out infinite;
  }
  @keyframes astryx-cloud-status-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.35;
    }
  }
</style>
