/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { expect, test, type Page } from '@playwright/test';

const PRIMARY_SOURCE = 'trusted-gdrive';

interface SeedSource {
  name: string;
  type: 'gdrive' | 'onedrive';
}

async function seedStorageSources(page: Page, sources: SeedSource[]) {
  await page.goto('/');
  await page.evaluate(async (list) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('books', 7);
      request.onupgradeneeded = () => {
        const d = request.result;
        if (!d.objectStoreNames.contains('storageSource')) {
          d.createObjectStore('storageSource', { keyPath: 'name' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('storageSource', 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      for (const source of list) {
        tx.objectStore('storageSource').put({
          name: source.name,
          type: source.type,
          storedInManager: true,
          encryptionDisabled: false,
          data: new ArrayBuffer(0),
          lastSourceModified: Date.now()
        });
      }
    });
  }, sources);
}

test.describe('Cloud sync scope (multi-cloud)', () => {
  test('labels the primary sync target with statistics scope', async ({ page }) => {
    await page.goto('/settings/data');

    await expect(page.getByText('Statistics Sync Target')).toBeVisible();
    await expect(page.getByText(/reading progress syncs to every connected cloud/)).toBeVisible();
  });

  test.describe('per-source connection status', () => {
    test.beforeEach(async ({ page }) => {
      await seedStorageSources(page, [
        { name: PRIMARY_SOURCE, type: 'gdrive' },
        { name: 'archive-onedrive', type: 'onedrive' }
      ]);
    });

    test('custom cloud sources render their own status chip', async ({ page }) => {
      await page.goto('/settings/data');

      // Wait for the storage list to hydrate (custom sources appear in the
      // dropdown only after the persisted storage-source records load).
      await expect(
        page.getByRole('option', { name: 'trusted-gdrive (Google Drive)' })
      ).toBeAttached();
      await expect(
        page.getByRole('option', { name: 'archive-onedrive (OneDrive)' })
      ).toBeAttached();

      await page.getByRole('button', { name: /Advanced: Custom Credentials/ }).click();

      const gdriveRow = page.locator('.astryx-list-item', { hasText: 'Custom Google Drive' });
      await expect(gdriveRow.getByText('Disconnected').first()).toBeVisible();

      const onedriveRow = page.locator('.astryx-list-item', { hasText: 'Custom OneDrive' });
      await expect(onedriveRow.getByText('Disconnected').first()).toBeVisible();
    });

    test('per-source status chip survives a reload', async ({ page }) => {
      await page.goto('/settings/data');

      await expect(
        page.getByRole('option', { name: 'trusted-gdrive (Google Drive)' })
      ).toBeAttached();
      await page.getByRole('button', { name: /Advanced: Custom Credentials/ }).click();
      await expect(
        page
          .locator('.astryx-list-item', { hasText: 'Custom Google Drive' })
          .getByText('Disconnected')
          .first()
      ).toBeVisible();

      await page.reload();
      await expect(
        page.getByRole('option', { name: 'trusted-gdrive (Google Drive)' })
      ).toBeAttached();
      await page.getByRole('button', { name: /Advanced: Custom Credentials/ }).click();

      await expect(
        page
          .locator('.astryx-list-item', { hasText: 'Custom Google Drive' })
          .getByText('Disconnected')
          .first()
      ).toBeVisible();
      await expect(
        page
          .locator('.astryx-list-item', { hasText: 'Custom OneDrive' })
          .getByText('Disconnected')
          .first()
      ).toBeVisible();
    });
  });

  test.describe('per-source last sync time', () => {
    test('active provider card reads per-source sync time from persisted metadata', async ({
      page
    }) => {
      await page.addInitScript(
        ({ source, minsAgo }) => {
          window.localStorage.setItem('syncTarget', source);
          window.localStorage.setItem(
            'lastSyncBySource',
            JSON.stringify({ [source]: Date.now() - minsAgo * 60_000 })
          );
        },
        { source: PRIMARY_SOURCE, minsAgo: 1 }
      );
      await seedStorageSources(page, [{ name: PRIMARY_SOURCE, type: 'gdrive' }]);

      await page.goto('/settings/data');
      await expect(page.getByText('Synced 1 minute ago')).toBeVisible();

      // Metadata is durable: after a full reload the card still reflects it.
      await page.reload();
      await expect(page.getByText('Synced 1 minute ago')).toBeVisible();
    });
  });
});
