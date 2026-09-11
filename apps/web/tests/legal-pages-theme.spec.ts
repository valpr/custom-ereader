/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { expect, test, type Page } from '@playwright/test';

async function pageBackground(page: Page) {
  return page.evaluate(() => {
    const el = document.querySelector('div.min-h-screen');
    return el ? getComputedStyle(el).backgroundColor : '';
  });
}

test.describe('Legal pages follow the app theme (dark)', () => {
  test.use({ colorScheme: 'dark' });

  test('privacy page uses the dark surface in dark mode', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: 'Valpr Reader Privacy Policy' })).toBeVisible();
    await expect.poll(() => pageBackground(page)).toBe('rgb(18, 18, 20)');
  });

  test('terms page uses the dark surface in dark mode', async ({ page }) => {
    await page.goto('/terms');
    await expect(
      page.getByRole('heading', { name: 'Valpr Reader Terms of Service' })
    ).toBeVisible();
    await expect.poll(() => pageBackground(page)).toBe('rgb(18, 18, 20)');
  });
});

test.describe('Legal pages follow the app theme (light)', () => {
  test.use({ colorScheme: 'light' });

  test('privacy page uses the light surface in light mode', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: 'Valpr Reader Privacy Policy' })).toBeVisible();
    await expect.poll(() => pageBackground(page)).toBe('rgb(255, 255, 255)');
  });
});
