/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import type { BookCardProps } from '$lib/components/book-card/book-card-props';
import { getStorageHandler } from '$lib/data/storage/storage-handler-factory';
import { StorageKey } from '$lib/data/storage/storage-types';
import { isStorageSourceAvailable } from '$lib/data/storage/storage-view';
import { MergeMode } from '$lib/data/merge-mode';
import { ReplicationSaveBehavior } from '$lib/functions/replication/replication-options';
import { Observable } from 'rxjs';

export const UNIFIED_SOURCES: StorageKey[] = [
  StorageKey.BROWSER,
  StorageKey.GDRIVE,
  StorageKey.ONEDRIVE
];

export function normalizeTitle(title: string): string {
  return title.trim().toLowerCase();
}

export function mergeBookLists(
  lists: { source: StorageKey; cards: BookCardProps[] }[]
): BookCardProps[] {
  const byTitle = new Map<string, BookCardProps & { sources: StorageKey[] }>();

  for (const { source, cards } of lists) {
    for (const card of cards || []) {
      if (!card?.title) continue;
      const key = normalizeTitle(card.title);
      const existing = byTitle.get(key);

      if (!existing) {
        byTitle.set(key, { ...card, sources: [source] });
        continue;
      }

      if (!existing.sources.includes(source)) {
        existing.sources.push(source);
      }

      // Prefer Browser metadata for progress/open state; take max for size/recency.
      const preferIncoming =
        source === StorageKey.BROWSER && !existing.sources.includes(StorageKey.BROWSER);
      existing.characters = Math.max(existing.characters || 0, card.characters || 0);
      existing.lastBookModified = Math.max(
        existing.lastBookModified || 0,
        card.lastBookModified || 0
      );
      existing.lastBookOpen = Math.max(existing.lastBookOpen || 0, card.lastBookOpen || 0);
      existing.lastBookmarkModified = Math.max(
        existing.lastBookmarkModified || 0,
        card.lastBookmarkModified || 0
      );
      if ((card.progress || 0) > (existing.progress || 0)) {
        existing.progress = card.progress;
      }
      if (preferIncoming) {
        existing.id = card.id;
        existing.imagePath = card.imagePath || existing.imagePath;
      } else if (!existing.imagePath && card.imagePath) {
        existing.imagePath = card.imagePath;
      }
      existing.isPlaceholder = existing.isPlaceholder && card.isPlaceholder;
    }
  }

  return [...byTitle.values()];
}

export interface UnifiedFetchOptions {
  gDriveSourceName?: string;
  oneDriveSourceName?: string;
  includeClouds?: boolean;
  /**
   * Primary-only listing: when defined, only the cloud whose source name
   * matches is fetched. Pass the `$syncTarget$` value (or '' for local-only)
   * so the secondary cloud is never touched by background listing — it is
   * fetched on demand only when the user opens one of its books or switches
   * targets. `undefined` (legacy) includes every available cloud.
   */
  primarySourceName?: string;
}

export interface SourceBookList {
  source: StorageKey;
  cards: BookCardProps[];
}

/**
 * Fetches Browser + primary cloud lists in parallel. Unavailable/failed
 * sources resolve to [] so one offline cloud never breaks the whole library.
 * FS is intentionally excluded in v1. The secondary cloud is excluded unless
 * `primarySourceName` is left undefined (legacy): pass `$syncTarget$` so only
 * the primary target is listed and background listing never touches — and can
 * never expire — a secondary session.
 *
 * Background refresh: askForStorageUnlock=false so an expired cloud session
 * defers to the reconnect banner instead of popping an unlock modal, and the
 * caller owns loading state (handler getBookList pokes the shared
 * listLoading$ without a matching reset for direct calls).
 */
export async function fetchUnifiedBookLists(
  window: Window,
  options: UnifiedFetchOptions = {}
): Promise<{ source: StorageKey; cards: BookCardProps[] }[]> {
  const {
    gDriveSourceName = '',
    oneDriveSourceName = '',
    includeClouds = true,
    primarySourceName
  } = options;

  const browserPromise = getStorageHandler(
    window,
    StorageKey.BROWSER,
    '',
    true,
    false,
    ReplicationSaveBehavior.NewOnly,
    MergeMode.MERGE,
    MergeMode.MERGE,
    false
  )
    .getBookList()
    .catch(() => [] as BookCardProps[])
    .then((cards) => ({ source: StorageKey.BROWSER as StorageKey, cards }));

  if (!includeClouds) {
    return [await browserPromise];
  }

  const cloudTasks: Promise<{ source: StorageKey; cards: BookCardProps[] }>[] = [];

  const includeGDrive =
    !!gDriveSourceName &&
    (primarySourceName === undefined || gDriveSourceName === primarySourceName);
  const includeOneDrive =
    !!oneDriveSourceName &&
    (primarySourceName === undefined || oneDriveSourceName === primarySourceName);

  if (includeGDrive && isStorageSourceAvailable(StorageKey.GDRIVE, gDriveSourceName, window)) {
    cloudTasks.push(
      getStorageHandler(
        window,
        StorageKey.GDRIVE,
        gDriveSourceName,
        false,
        false,
        ReplicationSaveBehavior.NewOnly,
        MergeMode.MERGE,
        MergeMode.MERGE,
        false
      )
        .getBookList()
        .catch(() => [] as BookCardProps[])
        .then((cards) => ({ source: StorageKey.GDRIVE as StorageKey, cards }))
    );
  }

  if (
    includeOneDrive &&
    isStorageSourceAvailable(StorageKey.ONEDRIVE, oneDriveSourceName, window)
  ) {
    cloudTasks.push(
      getStorageHandler(
        window,
        StorageKey.ONEDRIVE,
        oneDriveSourceName,
        false,
        false,
        ReplicationSaveBehavior.NewOnly,
        MergeMode.MERGE,
        MergeMode.MERGE,
        false
      )
        .getBookList()
        .catch(() => [] as BookCardProps[])
        .then((cards) => ({ source: StorageKey.ONEDRIVE as StorageKey, cards }))
    );
  }

  return Promise.all([browserPromise, ...cloudTasks]);
}

/**
 * Streaming variant of fetchUnifiedBookLists: emits the local Browser list
 * first so the library renders immediately, then re-emits as the primary
 * cloud list arrives. A slow or offline cloud can no longer hold up the page.
 * Each emission is the full set of lists known so far; failed sources resolve
 * to [] just like the batched version. Emits at least once and completes.
 * Pass `primarySourceName: $syncTarget$` to list Browser + primary only; the
 * secondary cloud is never fetched in the background.
 */
export function fetchUnifiedBookListsStream(
  window: Window,
  options: UnifiedFetchOptions = {}
): Observable<SourceBookList[]> {
  const {
    gDriveSourceName = '',
    oneDriveSourceName = '',
    includeClouds = true,
    primarySourceName
  } = options;

  return new Observable<SourceBookList[]>((subscriber) => {
    let cancelled = false;
    const lists: SourceBookList[] = [];
    const emit = () => {
      if (!cancelled) subscriber.next([...lists]);
    };

    const browserPromise = getStorageHandler(
      window,
      StorageKey.BROWSER,
      '',
      true,
      false,
      ReplicationSaveBehavior.NewOnly,
      MergeMode.MERGE,
      MergeMode.MERGE,
      false
    )
      .getBookList()
      .catch(() => [] as BookCardProps[])
      .then((cards) => ({ source: StorageKey.BROWSER as StorageKey, cards }));

    browserPromise.then(
      (browserList) => {
        if (cancelled) return;
        lists.push(browserList);
        emit();

        if (!includeClouds) {
          subscriber.complete();
          return;
        }

        const cloudTasks: Promise<SourceBookList>[] = [];

        const includeGDrive =
          !!gDriveSourceName &&
          (primarySourceName === undefined || gDriveSourceName === primarySourceName);
        const includeOneDrive =
          !!oneDriveSourceName &&
          (primarySourceName === undefined || oneDriveSourceName === primarySourceName);

        if (
          includeGDrive &&
          isStorageSourceAvailable(StorageKey.GDRIVE, gDriveSourceName, window)
        ) {
          cloudTasks.push(
            getStorageHandler(
              window,
              StorageKey.GDRIVE,
              gDriveSourceName,
              false,
              false,
              ReplicationSaveBehavior.NewOnly,
              MergeMode.MERGE,
              MergeMode.MERGE,
              false
            )
              .getBookList()
              .catch(() => [] as BookCardProps[])
              .then((cards) => ({ source: StorageKey.GDRIVE as StorageKey, cards }))
          );
        }

        if (
          includeOneDrive &&
          isStorageSourceAvailable(StorageKey.ONEDRIVE, oneDriveSourceName, window)
        ) {
          cloudTasks.push(
            getStorageHandler(
              window,
              StorageKey.ONEDRIVE,
              oneDriveSourceName,
              false,
              false,
              ReplicationSaveBehavior.NewOnly,
              MergeMode.MERGE,
              MergeMode.MERGE,
              false
            )
              .getBookList()
              .catch(() => [] as BookCardProps[])
              .then((cards) => ({ source: StorageKey.ONEDRIVE as StorageKey, cards }))
          );
        }

        if (!cloudTasks.length) {
          subscriber.complete();
          return;
        }

        // Emit incrementally as each cloud arrives; never reject the stream.
        let pending = cloudTasks.length;
        cloudTasks.forEach((task) => {
          task.then(
            (entry) => {
              if (cancelled) return;
              lists.push(entry);
              emit();
              pending -= 1;
              if (pending === 0) subscriber.complete();
            },
            () => {
              if (cancelled) return;
              pending -= 1;
              if (pending === 0) subscriber.complete();
            }
          );
        });
      },
      () => {
        if (cancelled) return;
        lists.push({ source: StorageKey.BROWSER as StorageKey, cards: [] });
        emit();
        subscriber.complete();
      }
    );

    return () => {
      cancelled = true;
    };
  });
}
