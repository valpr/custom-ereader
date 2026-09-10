/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { expect, test } from '@playwright/test';
import { SAMPLE_BOOK, seedReaderBook } from './fixtures/book-fixture';

test.describe('Book Card Options Menu', () => {
  test('shows an always-visible options button that opens upload and details actions', async ({
    page
  }) => {
    await seedReaderBook(page);
    await page.goto('/manage');

    const bookCard = page.locator('.aspect-w-2').first();
    await expect(bookCard).toBeVisible({ timeout: 10000 });

    // No hover needed: the kebab is always visible (unlike the hover-only delete X)
    const menuBtn = page.getByRole('button', {
      name: `Book options for ${SAMPLE_BOOK.title}`
    });
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    await expect(page.getByRole('button', { name: 'Upload to primary cloud' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'View details' })).toBeVisible();
  });

  test('view details opens a dialog with book metadata and closes', async ({ page }) => {
    await seedReaderBook(page);
    await page.goto('/manage');

    const bookCard = page.locator('.aspect-w-2').first();
    await expect(bookCard).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: `Book options for ${SAMPLE_BOOK.title}` }).click();
    await page.getByRole('button', { name: 'View details' }).click();

    const details = page.getByTestId('book-details-dialog');
    await expect(details).toBeVisible();
    await expect(page.locator('.astryx-dialog-surface')).toContainText(SAMPLE_BOOK.title);
    await expect(details).toContainText('Characters');
    await expect(details).toContainText('Last Read');
    await expect(details).toContainText('Browser');

    await page.locator('.astryx-dialog-surface button').filter({ hasText: 'Close' }).click();
    await expect(details).not.toBeVisible();
  });

  test('upload prompts to configure a primary cloud when none is set', async ({ page }) => {
    await seedReaderBook(page);
    await page.goto('/manage');

    const bookCard = page.locator('.aspect-w-2').first();
    await expect(bookCard).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: `Book options for ${SAMPLE_BOOK.title}` }).click();
    await page.getByRole('button', { name: 'Upload to primary cloud' }).click();

    const dialog = page.locator('.astryx-dialog-surface');
    await expect(dialog).toContainText('No primary cloud');
    await expect(dialog).toContainText('primary cloud sync target');
  });

  test('menu button yields to the selection overlay in select mode', async ({ page }) => {
    await seedReaderBook(page);
    await page.goto('/manage');

    const bookCard = page.locator('.aspect-w-2').first();
    await expect(bookCard).toBeVisible({ timeout: 10000 });

    const enableSelectBtn = page.locator('button[aria-label="Enable Book Selection"]');
    await expect(enableSelectBtn).toBeVisible();
    await enableSelectBtn.click();

    await bookCard.click();

    await expect(
      page.getByRole('button', { name: `Book options for ${SAMPLE_BOOK.title}` })
    ).not.toBeVisible();
  });

  test('delete X still appears on hover alongside the menu button', async ({ page }) => {
    await seedReaderBook(page);
    await page.goto('/manage');

    const bookCard = page.locator('.aspect-w-2').first();
    await expect(bookCard).toBeVisible({ timeout: 10000 });

    await expect(
      page.getByRole('button', { name: `Book options for ${SAMPLE_BOOK.title}` })
    ).toBeVisible();

    await bookCard.hover();
    await expect(page.locator('div[role="button"].bg-red-400').first()).toBeVisible();
  });
});
