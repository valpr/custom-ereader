/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { expect, test, type Page } from '@playwright/test';
import { seedReaderBook } from './fixtures/book-fixture';

const SOURCE = 'ttu-gdrive-default';
const FRIENDLY_SOURCE = 'GDrive Default';

async function seedExpiredSession(page: Page, failedOps = 3) {
  await page.addInitScript(
    ({ source, ops }) => {
      window.localStorage.setItem('syncTarget', source);
      window.localStorage.setItem(
        'pendingCloudSync',
        JSON.stringify({
          [source]: { at: Date.now(), reason: 'session expired (test)', failedOps: ops }
        })
      );
    },
    { source: SOURCE, ops: failedOps }
  );
}

test.describe('Cloud re-auth deferred UX', () => {
  test('manage banner shows pending count and survives reload', async ({ page }) => {
    await seedExpiredSession(page, 3);
    await page.goto('/manage');

    const banner = page.getByTestId('cloud-reconnect-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(FRIENDLY_SOURCE);
    await expect(banner).not.toContainText(SOURCE);
    await expect(banner).toContainText('3 operations will sync after reconnect');
    await expect(banner.getByRole('button', { name: 'Reconnect' })).toBeEnabled();

    // Durable queue: banner persists across a full reload.
    await page.reload();
    await expect(page.getByTestId('cloud-reconnect-banner')).toBeVisible();
    await expect(page.getByTestId('cloud-reconnect-banner')).toContainText(
      '3 operations will sync after reconnect'
    );
  });

  test('layout exposes a polite live region announcing the expired session', async ({ page }) => {
    await seedExpiredSession(page);
    await page.goto('/manage');

    const status = page.locator('div[role="status"][aria-live="polite"]');
    await expect(status.first()).toContainText(/Sync paused.*GDrive Default/);
  });

  test('no banner for a secondary cloud with an expired session', async ({ page }) => {
    // Primary target is healthy; only the secondary cloud has pending ops.
    // Global banners stay primary-only — secondary sessions reconnect on
    // demand when one of their books is opened.
    await page.addInitScript(() => {
      window.localStorage.setItem('syncTarget', 'ttu-gdrive-default');
      window.localStorage.setItem(
        'pendingCloudSync',
        JSON.stringify({
          'ttu-onedrive-default': {
            at: Date.now(),
            reason: 'session expired (test)',
            failedOps: 2
          }
        })
      );
    });
    await page.goto('/manage');

    await expect(page.getByTestId('cloud-reconnect-banner')).toHaveCount(0);
    const status = page.locator('div[role="status"][aria-live="polite"]');
    await expect(status.first()).not.toContainText('Sync paused');
  });

  test('no banner or live announcement when session is healthy', async ({ page }) => {
    await page.goto('/manage');

    await expect(page.getByTestId('cloud-reconnect-banner')).toHaveCount(0);
    const status = page.locator('div[role="status"][aria-live="polite"]');
    await expect(status.first()).not.toContainText('Sync paused');
  });

  test('reader shows icon-only warning without a banner', async ({ page }) => {
    await seedReaderBook(page);
    await seedExpiredSession(page);
    await page.goto('/b?id=1');

    const content = page.locator('.book-content');
    await expect(content).toBeVisible({ timeout: 15000 });

    // Reader header may start hidden; reveal it.
    const showHeader = page.getByRole('button', { name: 'Show reader header' });
    if (await showHeader.isVisible()) {
      await showHeader.click();
    }

    await expect(page.getByRole('button', { name: /Cloud session expired/ })).toBeVisible();
    await expect(page.getByTestId('cloud-reconnect-banner')).toHaveCount(0);
  });
});
