/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { test, expect } from '@playwright/test';
import { seedReaderBook } from './fixtures/book-fixture';

test.describe('Manage Books Storage Source Dropdown', () => {
  test('only displays Browser when cloud sources are unauthenticated or have no data', async ({
    page
  }) => {
    await seedReaderBook(page);
    await page.goto('/manage');

    const bookCard = page.locator('.aspect-w-2').first();
    await expect(bookCard).toBeVisible({ timeout: 10000 });

    const button = page.getByRole('button', { name: 'Select Storage Source' });
    await expect(button).toBeVisible();

    await expect(async () => {
      await button.click();
      await expect(page.getByText('Browser', { exact: true })).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 10000 });

    // Browser must be present in the dropdown
    await expect(page.getByText('Browser', { exact: true })).toBeVisible();

    // GDrive and OneDrive must NOT be populated when unauthenticated/no data
    await expect(page.getByText('GDrive', { exact: true })).not.toBeVisible();
    await expect(page.getByText('OneDrive', { exact: true })).not.toBeVisible();
  });
});
