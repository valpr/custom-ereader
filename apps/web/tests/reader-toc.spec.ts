/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { expect, test } from '@playwright/test';
import { seedReaderBook } from './fixtures/book-fixture';

test.describe('Reader Table of Contents (TOC) Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await seedReaderBook(page, {}, { viewMode: 'paginated', writingMode: 'horizontal-tb' });
  });

  test('opens TOC drawer from header and lists chapters', async ({ page }) => {
    await page.goto('/b?id=1');
    await expect(page.locator('.book-content')).toBeVisible();

    // Open header
    const topTrigger = page.locator('button.fixed.inset-x-0.top-0');
    await topTrigger.click();

    // Click Open Table of Contents
    const tocBtn = page.locator('button[aria-label="Open Table of Contents"]:visible');
    await expect(tocBtn).toBeVisible();
    await tocBtn.click();

    // TOC drawer should open
    await expect(page.locator('text=Chapter Progress:')).toBeVisible();
    await expect(page.locator('div[title="Go to 第一章 吾輩の誕生"]')).toBeVisible();
    await expect(page.locator('div[title="Go to 第二章 人間というもの"]')).toBeVisible();
    await expect(page.locator('div[title="Go to 第三章 主人の家"]')).toBeVisible();

    // Close TOC via close button
    const closeBtn = page.locator('div[title="Close Table of Contents"]');
    await closeBtn.click();
    await expect(page.locator('text=Chapter Progress:')).toBeHidden();
  });

  test('jumping to chapter via TOC updates rendered section', async ({ page }) => {
    await page.goto('/b?id=1');
    await expect(page.locator('.book-content')).toBeVisible();

    // Initial section should show chapter 1 heading
    const chapter1Heading = page.getByRole('heading', { name: '第一章 吾輩の誕生' });
    await expect(chapter1Heading).toBeVisible();

    // Open header then TOC
    const topTrigger = page.locator('button.fixed.inset-x-0.top-0');
    await topTrigger.click();
    await page.locator('button[aria-label="Open Table of Contents"]:visible').click();

    // Click Chapter 2
    const chapter2Item = page.locator('div[title="Go to 第二章 人間というもの"]');
    await expect(chapter2Item).toBeVisible();
    await chapter2Item.click();

    // TOC closes upon chapter selection
    await expect(page.locator('text=Chapter Progress:')).toBeHidden();

    // The reader should now display chapter 2 heading, and chapter 1 heading is hidden
    const chapter2Heading = page.getByRole('heading', { name: '第二章 人間というもの' });
    await expect(chapter2Heading).toBeVisible();
    await expect(chapter1Heading).toBeHidden();
  });
});
