<script lang="ts">
  import {
    getExpiredSyncTargets,
    storageConnectionStates$
  } from '$lib/data/storage/storage-oauth-manager';
  import { lastSyncTimestamp$, pendingCloudSync$, syncTarget$ } from '$lib/data/store';
  import { getFriendlyStorageSourceName } from '$lib/data/storage/storage-types';
  import { onDestroy } from 'svelte';

  let syncToast: string | null = null;
  let toastTimer: ReturnType<typeof setTimeout> | undefined;
  let lastSeenSync = 0;
  let pendingClearedAt = 0;
  let prevPendingCount = 0;
  let initialized = false;

  $: states = $storageConnectionStates$;
  $: pending = $pendingCloudSync$;
  // Primary-only: global announcements never fire for a secondary cloud.
  // Secondary sessions surface in Settings per-source status and reconnect
  // on demand when one of their books is opened.
  $: expiredSource = getExpiredSyncTargets($syncTarget$, states, pending)[0] || '';
  $: failedOps = (expiredSource && pending[expiredSource]?.failedOps) || 0;

  // "Sync complete" toast: fires when a sync lands while a pending sync
  // existed or was cleared moments ago (reconnect clears pending on
  // CONNECTED just before the retry finishes, hence the grace window).
  $: {
    const keys = Object.keys(pending);
    const count = keys.length;
    if (!initialized) {
      lastSeenSync = $lastSyncTimestamp$;
      prevPendingCount = count;
      initialized = true;
    } else {
      if (prevPendingCount > 0 && count === 0) {
        pendingClearedAt = Date.now();
      }
      if ($lastSyncTimestamp$ > lastSeenSync) {
        lastSeenSync = $lastSyncTimestamp$;
        if (count > 0 || Date.now() - pendingClearedAt < 60000) {
          showToast(
            count === 1
              ? `Sync complete (${getFriendlyStorageSourceName(keys[0])})`
              : 'Sync complete'
          );
        }
      }
      prevPendingCount = count;
    }
  }

  onDestroy(() => {
    if (toastTimer) clearTimeout(toastTimer);
  });

  function showToast(message: string) {
    syncToast = message;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      syncToast = null;
    }, 4000);
  }
</script>

<!--
  Always mounted outside the router outlet so assistive technology announces
  sync status transitions. Visible banners live in page flows (manage banner,
  settings card, reader icon) to respect fixed headers and reader immersion.
-->
<div role="status" aria-live="polite" class="sr-only">
  {#if expiredSource}
    Sync paused. Session expired for {getFriendlyStorageSourceName(expiredSource)}
    .{#if failedOps > 0}
      {failedOps}
      {failedOps === 1 ? 'operation' : 'operations'} will sync after reconnect.{/if}
  {/if}
</div>

{#if syncToast}
  <div
    data-testid="cloud-sync-toast"
    class="writing-horizontal-tb fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-medium shadow-lg"
    style="background-color: var(--astryx-color-fg-primary, #18181b); color: var(--astryx-color-surface, #ffffff);"
  >
    {syncToast}
  </div>
{/if}

<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
