/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { test, expect } from '@playwright/test';

test.describe('Cloud Storage Settings & Single Source Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings/data');
    // Deep link renders the Data tab selected via SSR; no click needed.
    await expect(page.getByRole('tab', { name: 'Data' })).toHaveAttribute('aria-selected', 'true');
    await page.waitForLoadState('networkidle');
  });

  test('renders Cloud & Storage Sync section and dropdown selector', async ({ page }) => {
    // Check section header
    await expect(page.getByText('Cloud & Storage Sync')).toBeVisible();

    // Check dropdown selector exists
    const select = page.locator('#cloud-storage-select');
    await expect(select).toBeVisible();

    // Verify options exist
    const options = select.locator('option');
    await expect(options).toHaveCount(3); // None, Google Drive, OneDrive
    await expect(options.nth(0)).toHaveText('None (Local Storage Only)');
    await expect(options.nth(1)).toHaveText('Google Drive');
    await expect(options.nth(2)).toHaveText('OneDrive');
  });

  test('displays Local Storage Only card when None is selected', async ({ page }) => {
    const select = page.locator('#cloud-storage-select');
    await select.selectOption('');

    await expect(page.getByRole('heading', { name: 'Local Storage Only' })).toBeVisible();
    await expect(
      page.getByText(
        'Your reading progress, statistics, and bookmarks are saved strictly on this device.'
      )
    ).toBeVisible();
  });

  test('displays Google Drive provider card with opt-in switch when selected', async ({ page }) => {
    const select = page.locator('#cloud-storage-select');
    await select.selectOption({ label: 'Google Drive' });

    // Active provider card header
    const providerCard = page.locator('.astryx-card').filter({ hasText: 'Google Drive' });
    await expect(providerCard).toBeVisible();

    // Status shows Setup Required when unconfigured
    await expect(providerCard.getByText('Setup Required', { exact: true })).toBeVisible();

    // Sync status shows Never synced
    await expect(providerCard.getByText('Never synced')).toBeVisible();

    // Opt-in switch is present
    await expect(
      providerCard.getByText('Enable automatic background sync across devices (Recommended)')
    ).toBeVisible();

    // Connect button is present
    await expect(providerCard.getByRole('button', { name: 'Connect Google Drive' })).toBeVisible();
  });

  test('displays OneDrive provider card when selected', async ({ page }) => {
    const select = page.locator('#cloud-storage-select');
    await select.selectOption({ label: 'OneDrive' });

    const providerCard = page.locator('.astryx-card').filter({ hasText: 'OneDrive' });
    await expect(providerCard).toBeVisible();
    await expect(providerCard.getByText('Setup Required', { exact: true })).toBeVisible();
    await expect(providerCard.getByRole('button', { name: 'Connect OneDrive' })).toBeVisible();
  });

  test('clicking connect on unconfigured provider shows setup dialog without hanging', async ({
    page
  }) => {
    const select = page.locator('#cloud-storage-select');
    await select.selectOption({ label: 'Google Drive' });

    const providerCard = page.locator('.astryx-card').filter({ hasText: 'Google Drive' });
    const connectBtn = providerCard.getByRole('button', { name: 'Connect Google Drive' });
    await connectBtn.click();

    // Verify dialog pops up promptly explaining setup requirement
    await expect(page.getByText('Google Drive Setup Required')).toBeVisible();
    await expect(page.getByText('Google Drive OAuth Client ID is not configured.')).toBeVisible();
  });

  test('toggles advanced custom credentials section', async ({ page }) => {
    const advancedToggle = page.getByRole('button', {
      name: /Advanced: Custom Credentials & Directory Folders/i
    });
    await expect(advancedToggle).toBeVisible();

    // Click to expand
    await advancedToggle.click();

    // "Add Custom Source" button should now be visible
    await expect(page.getByRole('button', { name: 'Add Custom Source' })).toBeVisible();
  });
});
