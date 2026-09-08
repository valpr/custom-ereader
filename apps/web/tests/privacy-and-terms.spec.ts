/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { expect, test } from '@playwright/test';

test.describe('Privacy Policy & Terms of Service', () => {
  test('privacy policy page renders required Google disclosures and metadata', async ({ page }) => {
    await page.goto('/privacy');

    // Title and main heading
    await expect(page).toHaveTitle('Privacy Policy | Valpr Reader');
    const heading = page.getByRole('heading', { name: 'Valpr Reader Privacy Policy', level: 1 });
    await expect(heading).toBeVisible();

    // Verification of Google scopes
    await expect(page.getByText('https://www.googleapis.com/auth/drive.file')).toBeVisible();

    // Verbatim Google Limited Use disclosure
    await expect(
      page.getByText(
        "Valpr Reader's use and transfer of information received from Google APIs to any other app will adhere to the Google API Services User Data Policy, including the Limited Use requirements."
      )
    ).toBeVisible();

    // Data retention & user deletion rights
    await expect(page.getByText('Data Retention & User Deletion Rights')).toBeVisible();
    await expect(page.getByText('Delete Synced Files in Google Drive')).toBeVisible();
    await expect(page.getByText('Disconnect & Revoke Google Access')).toBeVisible();

    // Navigation links
    const termsLink = page.locator('header a[href*="/terms"]');
    await expect(termsLink).toBeVisible();
    await termsLink.click();
    await expect(page).toHaveURL(/\/terms/);
  });

  test('terms of service page renders correctly', async ({ page }) => {
    await page.goto('/terms');

    await expect(page).toHaveTitle('Terms of Service | Valpr Reader');
    const heading = page.getByRole('heading', { name: 'Valpr Reader Terms of Service', level: 1 });
    await expect(heading).toBeVisible();

    await expect(page.getByText('Acceptance of Terms')).toBeVisible();
    await expect(page.getByText('Description of the Service')).toBeVisible();
    await expect(page.getByText('User Responsibilities & Content Ownership')).toBeVisible();
  });

  test('settings page has links to privacy policy and terms of service', async ({ page }) => {
    await page.goto('/settings');

    // Navigate to Data tab
    const dataTab = page.getByRole('tab', { name: 'Data' });
    await expect(async () => {
      await dataTab.click();
      await expect(dataTab).toHaveAttribute('aria-selected', 'true');
    }).toPass();

    // Privacy & Legal section
    await expect(page.getByText('Privacy & Legal')).toBeVisible();
    const privacyLink = page.getByRole('link', { name: 'View Policy' });
    await expect(privacyLink).toBeVisible();
    await expect(privacyLink).toHaveAttribute('href', /\/privacy/);

    const termsLink = page.getByRole('link', { name: 'View Terms' });
    await expect(termsLink).toBeVisible();
    await expect(termsLink).toHaveAttribute('href', /\/terms/);
  });
});
