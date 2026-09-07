/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { expect, test } from '@playwright/test';

test.describe('Reader Profiles System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    // Ensure we are on the Reader tab
    await expect(page.locator('text=Reader Profiles').first()).toBeVisible({ timeout: 10000 });
  });

  test('displays default reader profiles and active indicator', async ({ page }) => {
    await expect(page.locator('text=PC / Desktop')).toBeVisible();
    await expect(page.locator('text=Mobile / Phone')).toBeVisible();
    await expect(page.locator('text=Tablet / E-Reader')).toBeVisible();

    // Default profile should show Active badge
    const activeBadge = page.locator('text=Active').first();
    await expect(activeBadge).toBeVisible();
  });

  test('switches profile and updates reading settings values', async ({ page }) => {
    // Initial desktop font size should be 20px
    const fontSizeDisplay = page.locator('text=20px').first();
    await expect(fontSizeDisplay).toBeVisible();

    // Click on Mobile / Phone profile
    await page.locator('[role="button"]:has-text("Mobile / Phone")').click();

    // Font size should update to 17px for mobile profile
    await expect(page.locator('text=17px').first()).toBeVisible();

    // Switch back to PC / Desktop
    await page.locator('[role="button"]:has-text("PC / Desktop")').click();
    await expect(page.locator('text=20px').first()).toBeVisible();
  });

  test('detects modifications and allows reverting', async ({ page }) => {
    // Modify font size slider by triggering an input change or pressing arrow key
    const slider = page.locator('input[type="range"]').first();
    await slider.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');

    // "Unsaved Changes" notification banner should appear
    await expect(page.getByTestId('unsaved-changes-banner')).toBeVisible();
    await expect(page.locator('button:has-text("Revert")').first()).toBeVisible();

    // Click Revert
    await page.locator('button:has-text("Revert")').first().click();

    // Unsaved changes banner should disappear and font size returns to 20px
    await expect(page.getByTestId('unsaved-changes-banner')).not.toBeVisible();
    await expect(page.locator('text=20px').first()).toBeVisible();
  });

  test('creates a new custom profile via modal', async ({ page }) => {
    // Click "New Profile" button
    await page.locator('button:has-text("New Profile")').click();

    // Modal should be visible
    await expect(page.locator('text=Create Reader Profile')).toBeVisible();

    // Fill in profile name
    const nameInput = page.locator('#new-profile-name');
    await nameInput.fill('OLED Night Reader');

    // Click "Create Profile" button in modal
    await page.locator('button:has-text("Create Profile")').last().click();

    // New profile should appear in the list and be active
    await expect(page.locator('text=OLED Night Reader')).toBeVisible();
  });
});
