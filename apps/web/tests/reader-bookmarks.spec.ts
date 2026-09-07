/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { expect, test } from '@playwright/test';
import { seedReaderBook } from './fixtures/book-fixture';

test.describe('Reader Bookmarks & Autosave Checkpoints', () => {
  test.beforeEach(async ({ page }) => {
    await seedReaderBook(page, {}, { viewMode: 'paginated', writingMode: 'horizontal-tb' });
  });

  test('fast bookmark key (KeyB) updates bookmark in IndexedDB', async ({ page }) => {
    await page.goto('/b?id=1');
    await expect(page.locator('.book-content')).toBeVisible();

    // Advance to next page
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(300);

    // Save fast bookmark
    await page.keyboard.press('b');
    await page.waitForTimeout(300);

    // Verify bookmark store in IndexedDB was updated
    const bookmarkRecord = await page.evaluate(async () => {
      return new Promise<any>((resolve, reject) => {
        const req = indexedDB.open('books', 7);
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction('bookmark', 'readonly');
          const getReq = tx.objectStore('bookmark').get(1);
          getReq.onsuccess = () => resolve(getReq.result);
          getReq.onerror = () => reject(getReq.error);
        };
        req.onerror = () => reject(req.error);
      });
    });

    expect(bookmarkRecord).toBeDefined();
    expect(bookmarkRecord.dataId).toBe(1);
  });

  test('named bookmark creation (Shift+B) and drawer inspection (Shift+R)', async ({ page }) => {
    await page.goto('/b?id=1');
    await expect(page.locator('.book-content')).toBeVisible();

    // Open BookmarkCreateDialog via Shift+B
    await page.keyboard.press('Shift+KeyB');

    // Dialog should appear
    const dialogTitle = page.locator('text=New Bookmark');
    await expect(dialogTitle).toBeVisible();

    // Enter custom label
    const labelInput = page.locator('#bookmark-label');
    await labelInput.fill('My Important Note');

    // Click Save
    const saveBtn = page.locator('button:has-text("Save")');
    await saveBtn.click();
    await expect(dialogTitle).toBeHidden();

    // Verify stored in IndexedDB userBookmark
    const userBookmarks = await page.evaluate(async () => {
      return new Promise<any[]>((resolve, reject) => {
        const req = indexedDB.open('books', 7);
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction('userBookmark', 'readonly');
          const getAllReq = tx.objectStore('userBookmark').getAll();
          getAllReq.onsuccess = () => resolve(getAllReq.result);
          getAllReq.onerror = () => reject(getAllReq.error);
        };
        req.onerror = () => reject(req.error);
      });
    });

    const created = userBookmarks.find((b) => b.label === 'My Important Note');
    expect(created).toBeDefined();

    // Open bookmark drawer via Shift+R
    await page.keyboard.press('Shift+KeyR');

    // Drawer should show Bookmarks and Autosaves tabs
    const bookmarksTab = page.locator('button:has-text("Bookmarks")');
    await expect(bookmarksTab).toBeVisible();

    // Click Bookmarks tab to view manual bookmarks
    await bookmarksTab.click();
    await expect(page.locator('text=My Important Note')).toBeVisible();

    // Close drawer
    const closeBtn = page.locator('button[title="Close"]');
    await closeBtn.click();
    await expect(bookmarksTab).toBeHidden();
  });
});
