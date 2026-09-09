/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { test, expect } from '@playwright/test';
import { seedReaderBook } from './fixtures/book-fixture';

test.describe('Manage Books Source Filter', () => {
  test('displays source filter dropdown with All/Browser/GDrive/OneDrive', async ({ page }) => {
    await seedReaderBook(page);
    await page.goto('/manage');

    const bookCard = page.locator('.aspect-w-2').first();
    await expect(bookCard).toBeVisible({ timeout: 10000 });

    const filterButton = page.getByRole('button', { name: 'Filter library by source' });
    await expect(filterButton).toBeVisible({ timeout: 10000 });
    await expect(filterButton).toContainText('All');

    await filterButton.click();

    // All sources are always listed (no dynamic hiding)
    await expect(page.getByText('All sources', { exact: true })).toBeVisible();
    await expect(page.getByText('Browser', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('GDrive', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('OneDrive', { exact: true }).first()).toBeVisible();
  });

  test('selecting a source filters the library', async ({ page }) => {
    await seedReaderBook(page);
    await page.goto('/manage');

    const bookCard = page.locator('.aspect-w-2').first();
    await expect(bookCard).toBeVisible({ timeout: 10000 });

    const filterButton = page.getByRole('button', { name: 'Filter library by source' });
    await filterButton.click();
    await page.getByRole('button', { name: 'Browser', exact: true }).click();

    // Button reflects the active filter and the local book is still shown
    await expect(filterButton).toContainText('Browser');
    await expect(bookCard).toBeVisible({ timeout: 10000 });
  });
});
