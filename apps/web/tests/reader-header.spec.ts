/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { expect, test } from '@playwright/test';
import { seedReaderBook } from './fixtures/book-fixture';

test.describe('Reader Header & Core Bar Controls', () => {
  test.beforeEach(async ({ page }) => {
    await seedReaderBook(page);
  });

  async function openHeader(page: any) {
    await expect(page.locator('.book-content')).toBeVisible();
    const topTrigger = page.locator('button.fixed.inset-x-0.top-0');
    await topTrigger.click();
    await expect(page.locator('button[aria-label="Go to Book Manager"]')).toBeVisible({
      timeout: 5000
    });
  }

  test('header reveals on top trigger click and dismisses on outside click', async ({ page }) => {
    await page.goto('/b?id=1');
    await openHeader(page);

    const managerBtn = page.locator('button[aria-label="Go to Book Manager"]');
    await expect(managerBtn).toBeVisible();

    // Click outside header on book content to dismiss
    await page.locator('.book-content').click({ position: { x: 50, y: 200 } });
    await expect(managerBtn).toBeHidden({ timeout: 5000 });
  });

  test('return to book manager navigates back to /manage', async ({ page }) => {
    await page.goto('/b?id=1');
    await openHeader(page);

    const managerBtn = page.locator('button[aria-label="Go to Book Manager"]');
    await managerBtn.click();

    await expect(page).toHaveURL(/\/manage/);
    await expect(
      page
        .locator('h1, h2, div')
        .filter({ hasText: /吾輩は猫である/i })
        .first()
    ).toBeVisible();
  });

  test('complete book button opens confirmation dialog', async ({ page }) => {
    await page.goto('/b?id=1');
    await openHeader(page);

    const completeBtn = page.locator('button[aria-label="Complete Book"]');
    await completeBtn.click();

    // ConfirmDialog should appear with Complete Book title
    const dialogTitle = page.locator('text=Complete Book');
    await expect(dialogTitle).toBeVisible();

    // Cancel button closes dialog
    const cancelBtn = page.locator('button:has-text("Cancel")');
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      await expect(dialogTitle).toBeHidden();
    }
  });

  test('reader settings button navigates to settings view', async ({ page }) => {
    await page.goto('/b?id=1');
    await openHeader(page);

    const settingsBtn = page.locator('button[aria-label="Go to Reader Settings"]');
    await settingsBtn.click();

    await expect(page).toHaveURL(/\/settings/);
  });
});
