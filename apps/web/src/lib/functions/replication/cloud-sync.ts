/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { getStorageHandler } from '$lib/data/storage/storage-handler-factory';
import { StorageDataType, StorageKey, StorageSourceDefault } from '$lib/data/storage/storage-types';
import {
  autoReplication$,
  cacheStorageData$,
  clearPendingCloudSync,
  database,
  markLastSync,
  readingGoalsMergeMode$,
  replicationSaveBehavior$,
  statisticsMergeMode$,
  syncTarget$
} from '$lib/data/store';
import {
  getConnectionState,
  StorageConnectionState
} from '$lib/data/storage/storage-oauth-manager';
import { AutoReplicationType } from '$lib/functions/replication/replication-options';
import { replicateData } from '$lib/functions/replication/replicator';
import { logger } from '$lib/data/logger';
import type { BooksDbStorageSource } from '$lib/data/database/books-db/versions/books-db';

const SYNC_DATA_TYPES = [
  StorageDataType.PROGRESS,
  StorageDataType.STATISTICS,
  StorageDataType.READING_GOALS,
  StorageDataType.USER_BOOKMARKS
];

/**
 * Book-scoped data: safe to mirror to every connected cloud. These are the
 * per-book reading position / bookmark payloads that respect each book's
 * preferred storage source.
 */
export const BOOK_SCOPED_DATA_TYPES = [StorageDataType.PROGRESS, StorageDataType.USER_BOOKMARKS];

/**
 * Aggregate data: kept on the primary sync target (`$syncTarget$`) only.
 * Statistics and reading goals describe global reading behaviour, not a single
 * book, so fanning them out to every cloud would produce conflicting merges.
 */
export const PRIMARY_ONLY_DATA_TYPES = [StorageDataType.STATISTICS, StorageDataType.READING_GOALS];

function isCloudType(type: StorageKey) {
  return type === StorageKey.GDRIVE || type === StorageKey.ONEDRIVE;
}

function isSourceConnected(source: BooksDbStorageSource | undefined | null) {
  if (!source) return false;
  if (source.disconnected) return false;
  return getConnectionState(source.name, source) === StorageConnectionState.CONNECTED;
}

export interface CloudSyncTarget {
  name: string;
  source: BooksDbStorageSource;
  isPrimary: boolean;
}

/**
 * Resolve the currently connected cloud sources, primary first. App-default
 * sources (ttu-gdrive-default / ttu-onedrive-default) have no DB record, so
 * they are included only when an in-memory token marks them CONNECTED.
 */
export async function getConnectedCloudSyncTargets(
  storageSources: BooksDbStorageSource[] = []
): Promise<CloudSyncTarget[]> {
  let sources = storageSources;
  if (!sources.length) {
    const db = await database.db;
    sources = await db.getAll('storageSource');
  }
  const primary = syncTarget$.getValue();
  const targets: CloudSyncTarget[] = [];
  const seen = new Set<string>();

  const pushTarget = (source: BooksDbStorageSource) => {
    if (!isCloudType(source.type)) return;
    if (source.disconnected) return;
    if (!isSourceConnected(source)) return;
    if (seen.has(source.name)) return;
    seen.add(source.name);
    targets.push({ name: source.name, source, isPrimary: source.name === primary });
  };

  for (const s of sources) {
    pushTarget(s);
  }

  for (const def of [StorageSourceDefault.GDRIVE_DEFAULT, StorageSourceDefault.ONEDRIVE_DEFAULT]) {
    if (seen.has(def)) continue;
    const resolved = resolveSource(def, sources);
    if (resolved && isSourceConnected(resolved)) {
      seen.add(def);
      targets.push({ name: def, source: resolved, isPrimary: def === primary });
    }
  }

  // Primary first (callers may re-sort for apply order).
  return targets.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
}

function resolveSource(
  sourceName: string,
  storageSources: BooksDbStorageSource[]
): BooksDbStorageSource | null {
  const found = storageSources?.find((s) => s.name === sourceName);
  if (found) return found;
  if (sourceName === StorageSourceDefault.GDRIVE_DEFAULT) {
    return {
      name: StorageSourceDefault.GDRIVE_DEFAULT,
      type: StorageKey.GDRIVE,
      storedInManager: false,
      encryptionDisabled: false,
      data: new ArrayBuffer(0),
      lastSourceModified: 0
    } as BooksDbStorageSource;
  }
  if (sourceName === StorageSourceDefault.ONEDRIVE_DEFAULT) {
    return {
      name: StorageSourceDefault.ONEDRIVE_DEFAULT,
      type: StorageKey.ONEDRIVE,
      storedInManager: false,
      encryptionDisabled: false,
      data: new ArrayBuffer(0),
      lastSourceModified: 0
    } as BooksDbStorageSource;
  }
  return null;
}

/**
 * Retry a cloud sync after re-authentication. Reads current store settings
 * so banner/header callers share one implementation with Settings.
 * Returns an error message (empty string on success).
 */
export async function triggerCloudSync(
  window: Window,
  sourceName: string,
  storageSources: BooksDbStorageSource[] = [],
  requestedTypes: StorageDataType[] = SYNC_DATA_TYPES
): Promise<string> {
  if (!sourceName) return 'No storage source';
  const dataTypes = requestedTypes?.length ? requestedTypes : SYNC_DATA_TYPES;
  try {
    let sources = storageSources;
    if (!sources.length) {
      const db = await database.db;
      sources = await db.getAll('storageSource');
    }
    const source = resolveSource(sourceName, sources);
    if (!source) return `No storage source with name ${sourceName} found`;

    const targetHandler = getStorageHandler(
      window,
      source.type,
      source.name,
      true,
      cacheStorageData$.getValue(),
      replicationSaveBehavior$.getValue(),
      statisticsMergeMode$.getValue(),
      readingGoalsMergeMode$.getValue()
    );
    const localStorageHandler = getStorageHandler(
      window,
      StorageKey.BROWSER,
      '',
      true,
      cacheStorageData$.getValue(),
      replicationSaveBehavior$.getValue(),
      statisticsMergeMode$.getValue(),
      readingGoalsMergeMode$.getValue()
    );

    const db = await database.db;
    const books = await db.getAll('data');
    const contexts = books.map((b) => ({
      id: b.id,
      title: b.title,
      imagePath: b.coverImage || ''
    }));

    const error = await replicateData(
      localStorageHandler,
      targetHandler,
      false,
      contexts,
      dataTypes
    );
    if (error) return error;

    if (
      autoReplication$.getValue() === AutoReplicationType.All ||
      autoReplication$.getValue() === AutoReplicationType.Down
    ) {
      const downError = await replicateData(
        targetHandler,
        localStorageHandler,
        false,
        contexts,
        dataTypes
      );
      if (downError) return downError;
    }

    markLastSync(sourceName);
    clearPendingCloudSync(sourceName);
    return '';
  } catch (err: any) {
    const message = err?.message || 'Unknown sync error';
    logger.error(`Cloud sync retry failed for ${sourceName}: ${message}`);
    return message;
  }
}

/**
 * Sync every connected cloud: aggregate data (statistics, reading goals) goes
 * to the primary target only while book-scoped data (progress, user bookmarks)
 * is mirrored to all connected clouds. Aggregates errors per source.
 * Returns an error message (empty string when every target succeeded).
 */
export async function triggerCloudSyncAll(
  window: Window,
  storageSources: BooksDbStorageSource[] = []
): Promise<string> {
  const targets = await getConnectedCloudSyncTargets(storageSources);
  if (!targets.length) return 'No connected cloud sources';

  const errors: string[] = [];
  const sourceList = targets.map((t) => t.source);

  await Promise.allSettled(
    targets.map(async (target) => {
      const types = target.isPrimary ? SYNC_DATA_TYPES : BOOK_SCOPED_DATA_TYPES;
      const error = await triggerCloudSync(window, target.name, sourceList, types);
      if (error) {
        errors.push(`${target.name}: ${error}`);
      }
    })
  );

  return errors.length ? errors.join('; ') : '';
}
