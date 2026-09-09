/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { test, expect } from '@playwright/test';
import { seedReaderBook } from './fixtures/book-fixture';

test.describe('Manage Books Source Filter', () => {
  test('displays unified All/Browser/GDrive/OneDrive filter chips', async ({ page }) => {
    await seedReaderBook(page);
    await page.goto('/manage');

    const bookCard = page.locator('.aspect-w-2').first();
    await expect(bookCard).toBeVisible({ timeout: 10000 });

    const filterGroup = page.getByRole('group', { name: 'Filter library by source' });
    await expect(filterGroup).toBeVisible({ timeout: 10000 });

    // All sources are always listed (no dynamic hiding)
    await expect(filterGroup.getByRole('button', { name: 'All' })).toBeVisible();
    await expect(filterGroup.getByRole('button', { name: /Browser/ })).toBeVisible();
    await expect(filterGroup.getByRole('button', { name: /GDrive/ })).toBeVisible();
    await expect(filterGroup.getByRole('button', { name: /OneDrive/ })).toBeVisible();
  });
});
