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
  test('manage banner shows expired session and survives reload', async ({ page }) => {
    await seedExpiredSession(page, 3);
    await page.goto('/manage');

    const banner = page.getByTestId('cloud-reconnect-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(FRIENDLY_SOURCE);
    await expect(banner).not.toContainText(SOURCE);
    await expect(banner).toContainText('Sync paused');
    await expect(banner).not.toContainText('will sync after reconnect');
    await expect(banner).not.toContainText('operations');
    await expect(banner.getByRole('button', { name: 'Reconnect' })).toBeEnabled();

    // Durable queue: banner persists across a full reload.
    await page.reload();
    await expect(page.getByTestId('cloud-reconnect-banner')).toBeVisible();
    await expect(page.getByTestId('cloud-reconnect-banner')).toContainText('Sync paused');
    await expect(page.getByTestId('cloud-reconnect-banner')).not.toContainText(
      'will sync after reconnect'
    );
  });

  test('reconnect stays clickable on an empty library', async ({ page }) => {
    // Empty collection renders the Upload Books empty-state, whose
    // full-screen file-drop label (fixed inset-0 z-0) used to paint over the
    // banner and swallow Reconnect clicks.
    await page.addInitScript(() => {
      window.localStorage.setItem('syncTarget', 'ttu-onedrive-default');
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

    const banner = page.getByTestId('cloud-reconnect-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('OneDrive Default');
    await expect(page.getByText('Upload Books')).toBeVisible();

    const reconnect = banner.getByRole('button', { name: 'Reconnect' });
    await expect(reconnect).toBeEnabled();

    // Hit-test the button center: it must resolve inside the banner, not the
    // empty-state label behind it. (No waitFor timeouts — all assertions.)
    const hit = await reconnect.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const target = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      if (target?.closest('[data-testid="cloud-reconnect-banner"]')) return 'banner';
      return target?.tagName ?? 'none';
    });
    expect(hit).toBe('banner');
  });

  test('banner does not cover header dropdown menus', async ({ page }) => {
    await seedExpiredSession(page, 3);
    // Narrow viewport so the full-width banner sits under the Filter menu.
    await page.setViewportSize({ width: 768, height: 800 });
    await page.goto('/manage');
    await page.waitForLoadState('networkidle');

    const banner = page.getByTestId('cloud-reconnect-banner');
    await expect(banner).toBeVisible();

    const filterButton = page.getByRole('button', { name: 'Filter library by source' });
    await expect(filterButton).toBeVisible();
    await filterButton.click();
    await expect(page.getByRole('button', { name: 'All sources' })).toBeVisible();

    // The open menu must paint above the banner: pick a point where their
    // boxes intersect and hit-test it — it must resolve inside the popover.
    // (Bounding boxes intersect either way — only paint order distinguishes.)
    const menuBox = await page.locator('div[data-popover].absolute').boundingBox();
    const bannerBox = await banner.boundingBox();
    expect(menuBox).not.toBeNull();
    expect(bannerBox).not.toBeNull();
    const x0 = Math.max(menuBox!.x, bannerBox!.x);
    const x1 = Math.min(menuBox!.x + menuBox!.width, bannerBox!.x + bannerBox!.width);
    const y0 = Math.max(menuBox!.y, bannerBox!.y);
    const y1 = Math.min(menuBox!.y + menuBox!.height, bannerBox!.y + bannerBox!.height);
    expect(x1 - x0).toBeGreaterThan(10);
    expect(y1 - y0).toBeGreaterThan(10);
    const hit = await page.evaluate(
      ({ x, y }) => {
        const target = document.elementFromPoint(x, y);
        if (target?.closest('[data-testid="cloud-reconnect-banner"]')) return 'banner';
        if (target?.closest('[data-popover]')) return 'menu';
        return target?.tagName ?? 'none';
      },
      { x: (x0 + x1) / 2, y: (y0 + y1) / 2 }
    );
    expect(hit).toBe('menu');
  });

  test('layout exposes a polite live region announcing the expired session', async ({ page }) => {
    await seedExpiredSession(page);
    await page.goto('/manage');

    const status = page.locator('div[role="status"][aria-live="polite"]');
    await expect(status.first()).toContainText(/Sync paused.*GDrive Default/);
    await expect(status.first()).not.toContainText('will sync after reconnect');
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
