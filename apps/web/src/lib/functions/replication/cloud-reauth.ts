/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import ConfirmDialog from '$lib/components/confirm-dialog.svelte';
import MessageDialog from '$lib/components/message-dialog.svelte';
import { dialogManager } from '$lib/data/dialog-manager';
import { StorageOAuthManager } from '$lib/data/storage/storage-oauth-manager';
import type { BooksDbStorageSource } from '$lib/data/database/books-db/versions/books-db';
import { triggerCloudSync } from '$lib/functions/replication/cloud-sync';

async function syncAfterReconnect(
  window: Window,
  sourceName: string,
  storageSources: BooksDbStorageSource[]
): Promise<boolean> {
  const error = await triggerCloudSync(window, sourceName, storageSources);
  if (error) {
    dialogManager.dialogs$.next([
      {
        component: MessageDialog,
        props: {
          title: 'Sync Failed',
          message: `Reconnected, but sync failed: ${error}`
        }
      }
    ]);
    return false;
  }
  return true;
}

/**
 * Explicit re-auth from a button click (banner / top-bar icon / Settings).
 * Call `StorageOAuthManager.openAuthWindowSync()` synchronously in the click
 * handler and pass it in so iOS/Safari does not block the popup.
 */
export async function reconnectAndSyncNow(
  window: Window,
  sourceName: string,
  preOpenedWindow: Window | null | undefined,
  storageSources: BooksDbStorageSource[] = []
): Promise<boolean> {
  if (!sourceName) return false;
  const connected = await StorageOAuthManager.reconnect(window, sourceName, preOpenedWindow);
  if (!connected) return false;
  return syncAfterReconnect(window, sourceName, storageSources);
}

/**
 * Prompt-first variant for passive surfaces: shows a confirm dialog, then
 * reconnects and auto-retries the pending sync. Prefer `reconnectAndSyncNow`
 * from real buttons (iOS-safe); this is for programmatic prompts.
 */
export async function reconnectAndSync(
  window: Window,
  sourceName: string,
  storageSources: BooksDbStorageSource[] = []
): Promise<boolean> {
  if (!sourceName) return false;

  const confirmed = await new Promise<boolean>((resolve) => {
    dialogManager.dialogs$.next([
      {
        component: ConfirmDialog,
        props: {
          dialogHeader: 'Session Expired',
          dialogMessage: `Syncing with "${sourceName}" is paused because the session expired.\n\nReconnect now to resume syncing? Your local progress is safe and will sync after reconnecting.`,
          contentStyles: 'white-space: pre-line;',
          resolver: resolve
        },
        disableCloseOnClick: true
      }
    ]);
  });

  if (!confirmed) return false;

  const preOpened = StorageOAuthManager.openAuthWindowSync(window);
  return reconnectAndSyncNow(window, sourceName, preOpened, storageSources);
}
