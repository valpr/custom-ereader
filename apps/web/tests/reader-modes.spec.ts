/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { expect, test } from '@playwright/test';
import { seedReaderBook } from './fixtures/book-fixture';

test.describe('Reader Dual-Mode Matrix & Text Orientations', () => {
  test('horizontal continuous mode: renders horizontal flow without paginated container', async ({
    page
  }) => {
    await seedReaderBook(
      page,
      {},
      {
        viewMode: 'continuous',
        writingMode: 'horizontal-tb',
        fontSize: 20
      }
    );

    await page.goto('/b?id=1');

    const bookContent = page.locator('.book-content');
    await expect(bookContent).toBeVisible();

    // Check document-level writing mode
    const htmlWritingMode = await page.evaluate(() => document.documentElement.style.writingMode);
    expect(htmlWritingMode).toBe('horizontal-tb');

    // Continuous mode classes
    await expect(bookContent).toHaveClass(/book-content--writing-horizontal-rl/);
    await expect(bookContent).not.toHaveClass(/book-content--writing-vertical-rl/);

    // Continuous mode renders content directly without .book-content-container
    const paginatedContainer = page.locator('.book-content-container');
    await expect(paginatedContainer).toHaveCount(0);

    // Verify font size style
    const fontSize = await bookContent.evaluate((el) => window.getComputedStyle(el).fontSize);
    expect(fontSize).toBe('20px');
  });

  test('horizontal paginated mode: renders multi-column paginated container', async ({ page }) => {
    await seedReaderBook(
      page,
      {},
      {
        viewMode: 'paginated',
        writingMode: 'horizontal-tb',
        fontSize: 22
      }
    );

    await page.goto('/b?id=1');

    const bookContent = page.locator('.book-content');
    await expect(bookContent).toBeVisible();

    const htmlWritingMode = await page.evaluate(() => document.documentElement.style.writingMode);
    expect(htmlWritingMode).toBe('horizontal-tb');

    await expect(bookContent).toHaveClass(/book-content--writing-horizontal-rl/);

    // Paginated mode wraps content in .book-content-container with CSS columns
    const paginatedContainer = page.locator('.book-content .book-content-container');
    await expect(paginatedContainer).toBeVisible();

    const fontSize = await bookContent.evaluate((el) => window.getComputedStyle(el).fontSize);
    expect(fontSize).toBe('22px');
  });

  test('vertical continuous mode: renders vertical Japanese reading flow', async ({ page }) => {
    await seedReaderBook(
      page,
      {},
      {
        viewMode: 'continuous',
        writingMode: 'vertical-rl',
        fontSize: 24
      }
    );

    await page.goto('/b?id=1');

    const bookContent = page.locator('.book-content');
    await expect(bookContent).toBeVisible();

    const htmlWritingMode = await page.evaluate(() => document.documentElement.style.writingMode);
    expect(htmlWritingMode).toBe('vertical-rl');

    await expect(bookContent).toHaveClass(/book-content--writing-vertical-rl/);
    await expect(bookContent).not.toHaveClass(/book-content--writing-horizontal-rl/);

    // Continuous vertical has no column container
    await expect(page.locator('.book-content-container')).toHaveCount(0);

    const fontSize = await bookContent.evaluate((el) => window.getComputedStyle(el).fontSize);
    expect(fontSize).toBe('24px');
  });

  test('vertical paginated mode: renders vertical Japanese paginated container', async ({
    page
  }) => {
    await seedReaderBook(
      page,
      {},
      {
        viewMode: 'paginated',
        writingMode: 'vertical-rl',
        fontSize: 26
      }
    );

    await page.goto('/b?id=1');

    const bookContent = page.locator('.book-content');
    await expect(bookContent).toBeVisible();

    const htmlWritingMode = await page.evaluate(() => document.documentElement.style.writingMode);
    expect(htmlWritingMode).toBe('vertical-rl');

    await expect(bookContent).toHaveClass(/book-content--writing-vertical-rl/);

    // Paginated container exists
    const paginatedContainer = page.locator('.book-content .book-content-container');
    await expect(paginatedContainer).toBeVisible();

    const fontSize = await bookContent.evaluate((el) => window.getComputedStyle(el).fontSize);
    expect(fontSize).toBe('26px');
  });
});
