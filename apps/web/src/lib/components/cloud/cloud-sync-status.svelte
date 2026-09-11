<script lang="ts">
  import {
    getExpiredSyncTargets,
    storageConnectionStates$
  } from '$lib/data/storage/storage-oauth-manager';
  import {
    lastSyncBySource$,
    lastSyncTimestamp$,
    pendingCloudSync$,
    syncTarget$,
    transientNotice$
  } from '$lib/data/store';
  import { getFriendlyStorageSourceName } from '$lib/data/storage/storage-types';
  import { onDestroy } from 'svelte';

  let syncToast: string | null = null;
  let toastTimer: ReturnType<typeof setTimeout> | undefined;
  let toastDebounce: ReturnType<typeof setTimeout> | undefined;
  let noticeTimer: ReturnType<typeof setTimeout> | undefined;
  let lastSeenSync = 0;
  let pendingClearedAt = 0;
  let prevPendingCount = 0;
  let initialized = false;
  let lastSeenNoticeId = 0;

  $: states = $storageConnectionStates$;
  $: pending = $pendingCloudSync$;
  // Primary-only: global announcements never fire for a secondary cloud.
  // Secondary sessions surface in Settings per-source status and reconnect
  // on demand when one of their books is opened.
  $: expiredSource = getExpiredSyncTargets($syncTarget$, states, pending)[0] || '';

  // "Sync complete" toast: fires when a sync lands while a pending sync
  // existed or was cleared moments ago (reconnect clears pending on
  // CONNECTED just before the retry finishes, hence the grace window).
  // The label defaults to the primary sync target. Only when a per-source
  // sync just recorded itself (manual / retry paths bump the global stamp
  // and lastSyncBySource together via markLastSync) is that source shown
  // instead. Background syncs bump only the global stamp, so a stale
  // freshest entry for the other cloud must never win — otherwise a GDrive
  // sync completes while the toast names OneDrive. Label resolution is
  // deferred a tick so markLastSync's back-to-back store updates land first.
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
          if (toastDebounce) clearTimeout(toastDebounce);
          toastDebounce = setTimeout(() => {
            const bySource = lastSyncBySource$.getValue();
            const target = syncTarget$.getValue();
            let latestName = '';
            let latest = -1;
            for (const [name, at] of Object.entries(bySource)) {
              if (typeof at === 'number' && at > latest) {
                latest = at;
                latestName = name;
              }
            }
            const completedSource =
              latestName && Math.abs(lastSeenSync - latest) < 2000 ? latestName : target;
            showToast(
              completedSource
                ? `Sync complete (${getFriendlyStorageSourceName(completedSource)})`
                : 'Sync complete'
            );
          }, 150);
        }
      }
      prevPendingCount = count;
    }
  }

  onDestroy(() => {
    if (toastDebounce) clearTimeout(toastDebounce);
    if (toastTimer) clearTimeout(toastTimer);
    if (noticeTimer) clearTimeout(noticeTimer);
  });

  // Transient notices (offline skips, other non-blocking info): each push
  // re-renders the pill and restarts the auto-dismiss timer.
  $: notice = $transientNotice$;
  $: {
    if (notice && notice.id !== lastSeenNoticeId) {
      lastSeenNoticeId = notice.id;
      if (noticeTimer) clearTimeout(noticeTimer);
      noticeTimer = setTimeout(() => {
        lastSeenNoticeId = 0;
        transientNotice$.next(null);
      }, 5000);
    }
  }

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
    Sync paused. Session expired for {getFriendlyStorageSourceName(expiredSource)}.
  {/if}
</div>

{#if notice}
  <div
    data-testid="cloud-notice-toast"
    role="status"
    class="writing-horizontal-tb fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-medium shadow-lg"
    style="background-color: var(--astryx-color-fg-primary, #18181b); color: var(--astryx-color-surface, #ffffff);"
  >
    {notice.message}
  </div>
{:else if syncToast}
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
