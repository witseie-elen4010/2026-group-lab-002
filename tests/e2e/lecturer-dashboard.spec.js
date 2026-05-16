const { test, expect } = require('@playwright/test');

test('lecturer dashboard shows My Courses section with seeded course after login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="staffStudentNumber"]', 'A000356');
  await page.fill('[name="password"]', 'Password01');
  await page.click('[type="submit"]');

  await page.waitForURL('**/lecturer/dashboard**');
  await expect(page.locator('a[href="/lecturer/courses"]').first()).toBeVisible();

  await page.goto('/lecturer/courses');
  await expect(page.getByRole('heading', { name: 'My Courses' })).toBeVisible();
  await expect(page.getByText('ELEN4010')).toBeVisible();
});
