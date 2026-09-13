/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

/**
 * Mobile (Pixel 9) smoke tests for the reader header.
 * Runs in the `mobile` project only (see playwright.config.ts).
 */

import { expect, test } from '@playwright/test';
import { seedReaderBook } from '../fixtures/book-fixture';
import { expectNoHorizontalOverflow } from '../helpers/mobile-assertions';

test.describe('Mobile: reader header', () => {
  test('primary actions are reachable by tap', async ({ page }) => {
    await seedReaderBook(page);
    await page.goto('/b?id=1');

    await expect(page.locator('.book-content')).toBeVisible();

    await page.locator('button.fixed.inset-x-0.top-0').tap();
    await expect(page.locator('button[aria-label="Go to Book Manager"]')).toBeVisible({
      timeout: 5000
    });

    await expect(page.locator('button[aria-label="Go to Reader Settings"]')).toBeVisible();

    const moreActions = page.locator('button[aria-label="More Actions"]');
    await expect(moreActions).toBeVisible();
    await moreActions.tap();
    await expect(page.locator('button:has-text("Statistics")')).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });
});
