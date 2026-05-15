const { test, expect } = require('@playwright/test');

test('homepage loads and has correct title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('KnockKnock.prof | Open the door to better consultations');
});