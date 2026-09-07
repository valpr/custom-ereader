/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { expect, test } from '@playwright/test';
import { seedReaderBook } from './fixtures/book-fixture';

test.describe('Reader Loading & Initialization', () => {
  test('loads valid book and displays content and title', async ({ page }) => {
    await seedReaderBook(page);
    await page.goto('/b?id=1');

    // Title should be formatted with book title
    await expect(page).toHaveTitle(/吾輩は猫である/);

    // Book content container should be rendered and visible
    const content = page.locator('.book-content');
    await expect(content).toBeVisible();

    // Text content from chapter 1 should be present
    await expect(content).toContainText('吾輩は猫である。名前はまだ無い。');
  });

  test('redirects to book manager when book id does not exist', async ({ page }) => {
    await page.goto('/b?id=999999');

    // The reader should recognize missing data and route to /manage
    await expect(page).toHaveURL(/\/manage/);
  });

  test('end-to-end journey: upload file from manager and open reader', async ({ page }) => {
    await page.goto('/manage');

    // Prepare a mock .txt file
    const fileContent = 'これはテスト本の本文です。\n第二段落の内容です。';
    const fileInput = page.locator('input[type="file"][accept*=".txt"]').first();

    await fileInput.setInputFiles({
      name: 'playwright-uploaded-book.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(fileContent, 'utf-8')
    });

    // Wait for the book card to appear in the manager
    const bookCard = page.locator('.aspect-w-2:has-text("playwright-uploaded-book")');
    await expect(bookCard).toBeVisible({ timeout: 10000 });

    // Click the book card to enter reader
    await bookCard.click();

    // Verify URL is /b
    await expect(page).toHaveURL(/\/b\?id=/);

    // Verify content rendered
    const content = page.locator('.book-content');
    await expect(content).toBeVisible();
    await expect(content).toContainText('これはテスト本の本文です');
  });
});
