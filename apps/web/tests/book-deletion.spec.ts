/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { expect, test } from '@playwright/test';
import { SAMPLE_BOOK, seedReaderBook } from './fixtures/book-fixture';

test.describe('Book Deletion Confirmation', () => {
  test('shows confirmation prompt when deleting a book via card delete button and cancels deletion', async ({
    page
  }) => {
    await seedReaderBook(page);
    await page.goto('/manage');

    const bookCard = page.locator('.aspect-w-2').first();
    await expect(bookCard).toBeVisible({ timeout: 10000 });

    // Hover over the card to reveal the delete button
    await bookCard.hover();
    const deleteBtn = page.locator('div[role="button"].bg-red-400').first();
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Confirm dialog should be visible with expected header and message
    const dialogHeader = page.locator('.astryx-dialog-surface h2');
    await expect(dialogHeader).toContainText('Delete');

    const dialogContent = page.locator('.astryx-dialog-surface');
    await expect(dialogContent).toContainText('local browser copy');
    await expect(dialogContent).toContainText(SAMPLE_BOOK.title);

    // Clicking Cancel should close the dialog and keep the book
    const cancelBtn = page.locator('.astryx-dialog-surface button').filter({ hasText: 'Cancel' });
    await cancelBtn.click();
    await expect(page.locator('.astryx-dialog-surface')).not.toBeVisible();
    await expect(bookCard).toBeVisible();
  });

  test('confirms deletion via card delete button and removes the book', async ({ page }) => {
    await seedReaderBook(page);
    await page.goto('/manage');

    const bookCard = page.locator('.aspect-w-2').first();
    await expect(bookCard).toBeVisible({ timeout: 10000 });

    // Hover and click delete button
    await bookCard.hover();
    const deleteBtn = page.locator('div[role="button"].bg-red-400').first();
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Confirm dialog should be visible
    await expect(page.locator('.astryx-dialog-surface h2')).toContainText('Delete');

    // Click Delete local copy to delete
    const confirmBtn = page
      .locator('.astryx-dialog-surface button')
      .filter({ hasText: 'Delete local copy' });
    await confirmBtn.click();

    // Dialog closes and book is removed
    await expect(page.locator('.astryx-dialog-surface')).not.toBeVisible();
    await expect(bookCard).not.toBeVisible({ timeout: 10000 });
  });

  test('shows confirmation prompt when deleting selected books in select mode', async ({
    page
  }) => {
    await seedReaderBook(page);
    await page.goto('/manage');

    const bookCard = page.locator('.aspect-w-2').first();
    await expect(bookCard).toBeVisible({ timeout: 10000 });

    // Enable book selection mode
    const enableSelectBtn = page.locator('button[aria-label="Enable Book Selection"]');
    await expect(enableSelectBtn).toBeVisible();
    await enableSelectBtn.click();

    // Select the book card
    await bookCard.click();

    // Delete selected books button in header
    const deleteSelectedBtn = page.locator('button[aria-label="Delete selected Books"]');
    await expect(deleteSelectedBtn).toBeVisible();
    await deleteSelectedBtn.click();

    // Dialog appears with header and message
    await expect(page.locator('.astryx-dialog-surface h2')).toContainText('Delete');
    await expect(page.locator('.astryx-dialog-surface')).toContainText('local browser copy');
    await expect(page.locator('.astryx-dialog-surface')).toContainText(SAMPLE_BOOK.title);

    // Confirm deletion
    const confirmBtn = page
      .locator('.astryx-dialog-surface button')
      .filter({ hasText: 'Delete local copy' });
    await confirmBtn.click();

    // Book is deleted
    await expect(page.locator('.astryx-dialog-surface')).not.toBeVisible();
    await expect(bookCard).not.toBeVisible({ timeout: 10000 });
  });
});
