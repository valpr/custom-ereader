<script lang="ts">
  import DialogTemplate from '$lib/components/dialog-template.svelte';
  import Ripple from '$lib/components/ripple.svelte';
  import { getCardDateInfo, getSourceLabel } from '$lib/components/book-card/book-card-info';
  import type { StorageKey } from '$lib/data/storage/storage-types';
  import { buttonClasses } from '$lib/css-classes';
  import { createEventDispatcher } from 'svelte';

  export let title = '';
  export let characters = 0;
  export let progress = 0;
  export let lastBookOpen = 0;
  export let lastBookmarkModified = 0;
  export let lastBookModified = 0;
  export let sources: StorageKey[] = [];

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  $: sourceLabels = (sources || []).map(getSourceLabel);
  $: progressLabel = `${Math.round((progress || 0) * 100)}%`;
</script>

<DialogTemplate>
  <svelte:fragment slot="header">
    <span class="break-words">{title}</span>
  </svelte:fragment>
  <svelte:fragment slot="content">
    <div data-testid="book-details-dialog" class="w-64">
      <div>Sources:</div>
      <div class="w-64">{sourceLabels.length ? sourceLabels.join(', ') : 'No Data'}</div>
      <div class="mt-4">Progress:</div>
      <div class="w-64">{progressLabel}</div>
      <div class="mt-4">Characters:</div>
      <div class="w-64">{characters || 'No Data'}</div>
      <div class="mt-4">Last Read:</div>
      <div class="w-64">{getCardDateInfo(lastBookOpen)}</div>
      <div class="mt-4">Bookmarked:</div>
      <div class="w-64">{getCardDateInfo(lastBookmarkModified)}</div>
      <div class="mt-4">Last Update:</div>
      <div class="w-64">{getCardDateInfo(lastBookModified)}</div>
    </div>
  </svelte:fragment>
  <div class="flex grow justify-end" slot="footer">
    <button class={buttonClasses} on:click={() => dispatch('close')}>
      Close
      <Ripple />
    </button>
  </div>
</DialogTemplate>
