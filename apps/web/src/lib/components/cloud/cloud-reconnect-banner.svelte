<script lang="ts">
  import { Button } from '@custom-ereader/ui';
  import { createEventDispatcher } from 'svelte';
  import Fa from 'svelte-fa';
  import {
    faArrowsRotate,
    faSpinner,
    faTriangleExclamation
  } from '@fortawesome/free-solid-svg-icons';
  import { getFriendlyStorageSourceName } from '$lib/data/storage/storage-types';

  export let sourceName = '';
  export let busy = false;

  $: friendlySourceName = getFriendlyStorageSourceName(sourceName);

  const dispatch = createEventDispatcher<{ reconnect: void }>();
</script>

<!-- z-[1]: above the empty-library file-drop label (fixed inset-0 z-0) so
  Reconnect stays clickable with no books, but below the fixed header
  (z-10) so dropdown menus still paint on top. -->
<div
  role="alert"
  data-testid="cloud-reconnect-banner"
  class="relative z-[1] mx-auto mt-2 flex w-full max-w-3xl flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--astryx-color-border-subtle,#e4e4e7)] bg-[var(--astryx-color-warning-subtle,rgba(245,158,11,0.12))] px-3 py-2 text-sm text-[var(--astryx-color-fg-primary,#18181b)]"
>
  <div class="flex min-w-0 items-center gap-2">
    <span class="text-[var(--astryx-color-warning,#b45309)]">
      <Fa icon={faTriangleExclamation} />
    </span>
    <span class="truncate">
      Sync paused — session expired for <strong>{friendlySourceName}</strong>.
    </span>
  </div>
  <Button size="sm" variant="primary" disabled={busy} on:click={() => dispatch('reconnect')}>
    <Fa icon={busy ? faSpinner : faArrowsRotate} spin={busy} class="mr-1.5" />
    <span>{busy ? 'Reconnecting…' : 'Reconnect'}</span>
  </Button>
</div>
