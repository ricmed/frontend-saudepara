import { test, expect } from '@playwright/test';

test.describe('App shell', () => {
  test('loads the SPA and exposes the React root', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/App Saúde Pará/i);
    await expect(page.locator('#root')).toBeVisible();
  });
});
