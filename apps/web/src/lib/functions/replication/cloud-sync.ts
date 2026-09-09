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
  lastSyncTimestamp$,
  readingGoalsMergeMode$,
  replicationSaveBehavior$,
  statisticsMergeMode$
} from '$lib/data/store';
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
  storageSources: BooksDbStorageSource[] = []
): Promise<string> {
  if (!sourceName) return 'No storage source';
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
      SYNC_DATA_TYPES
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
        SYNC_DATA_TYPES
      );
      if (downError) return downError;
    }

    lastSyncTimestamp$.next(Date.now());
    clearPendingCloudSync(sourceName);
    return '';
  } catch (err: any) {
    const message = err?.message || 'Unknown sync error';
    logger.error(`Cloud sync retry failed for ${sourceName}: ${message}`);
    return message;
  }
}
