/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { expect, test } from '@playwright/test';
import { seedReaderBook } from './fixtures/book-fixture';

test.describe('Reader Header Responsive Behavior', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => console.log('LOG:', msg.text()));
    page.on('pageerror', (err) => console.log('UNCAUGHT PAGE ERROR:', err.stack || err.message));
    await seedReaderBook(page);
  });

  async function openHeader(page: any, visibleButtonLabel = 'Go to Book Manager') {
    // Wait for book content to load
    await expect(page.locator('.book-content')).toBeVisible();

    // Click the top trigger zone to open the header
    const topTrigger = page.locator('button.fixed.inset-x-0.top-0');
    await topTrigger.click();
    // Desktop shows the manager icon on the bar; mobile shows the Reader Actions menu instead
    await expect(page.locator(`button[aria-label="${visibleButtonLabel}"]:visible`)).toBeVisible({
      timeout: 5000
    });
  }

  test('desktop viewport (1280x800): all actions visible on bar, more actions hidden', async ({
    page
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/b?id=1');
    await openHeader(page);

    // Primary end actions must be visible
    await expect(page.locator('button[aria-label="Go to Reader Settings"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Go to Book Manager"]:visible')).toBeVisible();

    // Mobile Reader Actions menu must NOT be visible on wide screens
    await expect(page.locator('button[aria-label="Reader Actions"]')).toBeHidden();

    // Secondary actions should be visible on the bar
    await expect(page.locator('button[aria-label="Complete Book"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Go to Statistics"]')).toBeVisible();

    // The overflow "More Actions" button should NOT be visible on wide screens
    const moreActions = page.locator('button[aria-label="More Actions"]');
    await expect(moreActions).toBeHidden();
  });

  test('narrow mobile viewport (375x667): essentials stay on the bar, rest in the Reader Actions menu', async ({
    page
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/b?id=1');
    await openHeader(page, 'Reader Actions');

    // Essential actions stay single-tap on the bar
    await expect(page.locator('button[aria-label="Open Table of Contents"]:visible')).toBeVisible();
    await expect(page.locator('button[aria-label="Open Bookmarks"]:visible')).toBeVisible();
    await expect(page.locator('button[aria-label="Create Named Bookmark"]:visible')).toBeVisible();
    await expect(page.locator('button[aria-label="Go to Book Manager"]:visible')).toBeVisible();

    // Non-essential bar icons collapse
    await expect(page.locator('button[aria-label="Go to Reader Settings"]')).toBeHidden();
    await expect(page.locator('button[aria-label="Complete Book"]')).toBeHidden();

    // Single Reader Actions ellipsis button holds everything else
    const readerActions = page.locator('button[aria-label="Reader Actions"]');
    await expect(readerActions).toBeVisible();

    // Click Reader Actions to open the popover menu
    await readerActions.click();

    // Non-essential actions must be reachable as labeled menu rows
    await expect(page.locator('button:has-text("Complete Book")')).toBeVisible();
    await expect(page.locator('button:has-text("Statistics")')).toBeVisible();
    await expect(page.locator('button:has-text("Settings")')).toBeVisible();

    // Essentials live on the bar, not duplicated in the menu
    await expect(page.locator('button:has-text("Open Table of Contents")')).toBeHidden();
    await expect(page.locator('button:has-text("Manager")')).toBeHidden();

    // The header must remain open when interacting with the popover
    await expect(readerActions).toBeVisible();
  });

  test('dynamic resize transition: smooth collapse and expand without layout breakage', async ({
    page
  }) => {
    // Start wide
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/b?id=1');
    await openHeader(page);

    const moreActions = page.locator('button[aria-label="More Actions"]');
    const readerActions = page.locator('button[aria-label="Reader Actions"]');
    await expect(moreActions).toBeHidden();
    await expect(readerActions).toBeHidden();

    // Resize down to mobile width
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300); // Allow resize debounce/calculation

    // Now the mobile menu appears; essentials stay, the rest collapse
    await expect(readerActions).toBeVisible();
    await expect(moreActions).toBeHidden();
    await expect(page.locator('button[aria-label="Go to Book Manager"]:visible')).toBeVisible();
    await expect(page.locator('button[aria-label="Go to Reader Settings"]')).toBeHidden();
    await expect(page.locator('button[aria-label="Complete Book"]')).toBeHidden();

    // Resize back to wide
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);

    // Mobile menu disappears, and bar items reappear
    await expect(readerActions).toBeHidden();
    await expect(moreActions).toBeHidden();
    await expect(page.locator('button[aria-label="Complete Book"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Go to Statistics"]')).toBeVisible();
  });
});
