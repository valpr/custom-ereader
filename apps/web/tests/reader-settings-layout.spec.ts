/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { expect, test } from '@playwright/test';

test.describe('Reader Settings Astryx List Layout & Sticky Font Preview', () => {
  test.describe('Desktop Viewport (1280x800)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/settings');
      await expect(page.locator('text=Reader Profiles').first()).toBeVisible({ timeout: 10000 });
    });

    test('renders sticky font preview card and Astryx list sidebar', async ({ page }) => {
      const previewCard = page.getByTestId('reader-font-preview-card');
      await expect(previewCard).toBeVisible();

      // Check preview card contains live Japanese sample text
      await expect(previewCard.locator('.live-font-preview')).toBeVisible();
      await expect(previewCard.locator('text=Example Font Preview')).toBeVisible();

      // Check sidebar exists with list items
      const sidebar = page.getByTestId('reader-settings-sidebar');
      await expect(sidebar).toBeVisible();

      // "All Settings" is selected by default
      const allSettingsItem = sidebar.locator('.astryx-list-item', { hasText: 'All Settings' });
      await expect(allSettingsItem).toBeVisible();
      await expect(allSettingsItem).toHaveClass(/is-selected/);
    });

    test('switches active section when clicking sidebar items in desktop view', async ({
      page
    }) => {
      const sidebar = page.getByTestId('reader-settings-sidebar');
      const contentPanel = page.getByTestId('reader-settings-content-panel');

      // 1. Click "Theme & Appearance"
      const appearanceItem = sidebar.locator('.astryx-list-item', {
        hasText: 'Theme & Appearance'
      });
      await appearanceItem.click();
      await expect(appearanceItem).toHaveClass(/is-selected/);

      // Appearance section should be visible in content panel
      await expect(
        contentPanel.getByRole('heading', { name: 'Appearance & Themes' })
      ).toBeVisible();

      // Other sections should not be visible in single section mode
      await expect(
        contentPanel.getByRole('heading', { name: 'Typography & Fonts' })
      ).not.toBeVisible();
      await expect(
        contentPanel.getByRole('heading', { name: 'Navigation, Gestures & Page Turns' })
      ).not.toBeVisible();

      // 2. Click "Typography & Fonts"
      const typographyItem = sidebar.locator('.astryx-list-item', {
        hasText: 'Typography & Fonts'
      });
      await typographyItem.click();
      await expect(typographyItem).toHaveClass(/is-selected/);
      await expect(appearanceItem).not.toHaveClass(/is-selected/);

      // Typography section should now be visible
      await expect(contentPanel.getByRole('heading', { name: 'Typography & Fonts' })).toBeVisible();
      await expect(
        contentPanel.getByRole('heading', { name: 'Appearance & Themes' })
      ).not.toBeVisible();

      // 3. Click "All Settings" to return to unified continuous view
      const allSettingsItem = sidebar.locator('.astryx-list-item', { hasText: 'All Settings' });
      await allSettingsItem.click();
      await expect(allSettingsItem).toHaveClass(/is-selected/);

      // Both sections should now be visible
      await expect(
        contentPanel.getByRole('heading', { name: 'Appearance & Themes' })
      ).toBeVisible();
      await expect(contentPanel.getByRole('heading', { name: 'Typography & Fonts' })).toBeVisible();
    });

    test('font preview remains reactive and sticky while adjusting typography controls', async ({
      page
    }) => {
      const previewCard = page.getByTestId('reader-font-preview-card');
      const initialSizeBadge = previewCard.locator('text=20px');
      await expect(initialSizeBadge).toBeVisible();

      // Change font size using the slider in the preview card
      const sizeSlider = previewCard.locator('input[type="range"]').first();
      await sizeSlider.focus();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');

      // Font size badge should update
      await expect(previewCard.locator('text=22px')).toBeVisible();

      // Test writing mode toggle
      const verticalButton = previewCard.getByRole('radio', { name: '縦書き' });
      await verticalButton.click();
      await expect(verticalButton).toHaveAttribute('aria-checked', 'true');

      // Live font preview should have vertical-rl writing mode style
      const livePreview = previewCard.locator('.live-font-preview');
      await expect(livePreview).toHaveCSS('writing-mode', 'vertical-rl');
    });
  });

  test.describe('Mobile Viewport (375x667)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/settings');
      await expect(page.locator('text=Reader Profiles').first()).toBeVisible({ timeout: 10000 });
    });

    test('mobile drill-down: tapping section navigates to detail, back button returns to list', async ({
      page
    }) => {
      const sidebar = page.getByTestId('reader-settings-sidebar');
      const contentPanel = page.getByTestId('reader-settings-content-panel');

      // Initially on mobile: sidebar list is visible, content panel is hidden
      await expect(sidebar).toBeVisible();
      await expect(contentPanel).toBeHidden();

      // Sticky font preview is visible at top
      const previewCard = page.getByTestId('reader-font-preview-card');
      await expect(previewCard).toBeVisible();

      // Tap "Theme & Appearance" in the list
      const appearanceItem = sidebar.locator('.astryx-list-item', {
        hasText: 'Theme & Appearance'
      });
      await appearanceItem.click();

      // Now: sidebar is hidden, content panel is visible with section details
      await expect(sidebar).toBeHidden();
      await expect(contentPanel).toBeVisible();

      // Sticky preview is still visible at the top during detail inspection
      await expect(previewCard).toBeVisible();

      // Appearance controls are visible
      await expect(
        contentPanel.getByRole('heading', { name: 'Appearance & Themes' })
      ).toBeVisible();

      // Tap "All Settings" back button
      const backButton = contentPanel.getByRole('button', { name: /All Settings/i });
      await expect(backButton).toBeVisible();
      await backButton.click();

      // Returns to list overview
      await expect(sidebar).toBeVisible();
      await expect(contentPanel).toBeHidden();
    });

    test('mobile collapsible preview toggle expands and collapses font preview', async ({
      page
    }) => {
      const previewCard = page.getByTestId('reader-font-preview-card');
      await expect(previewCard.locator('.live-font-preview')).toBeVisible();

      // Click collapse button
      const collapseButton = previewCard.getByRole('button', { name: /Collapse Preview/i });
      await expect(collapseButton).toBeVisible();
      await collapseButton.click();

      // Live font preview body should now be collapsed/hidden
      await expect(previewCard.locator('.live-font-preview')).not.toBeVisible();

      // Click expand button to restore
      const expandButton = previewCard.getByRole('button', { name: /Expand Preview/i });
      await expect(expandButton).toBeVisible();
      await expandButton.click();

      // Live preview is visible again
      await expect(previewCard.locator('.live-font-preview')).toBeVisible();
    });
  });
});
