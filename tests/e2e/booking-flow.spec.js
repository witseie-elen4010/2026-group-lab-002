const { test, expect } = require('@playwright/test');
const db = require('../../database/db');

const purgeE2ERows = () => {
  const rows = db.prepare("SELECT const_id FROM consultations WHERE consultation_title LIKE 'E2E Test Booking %'").all();
  for (const row of rows) {
    db.prepare('DELETE FROM consultation_attendees WHERE const_id = ?').run(row.const_id);
    db.prepare('DELETE FROM consultations WHERE const_id = ?').run(row.const_id);
  }
};

test.beforeAll(purgeE2ERows);
test.afterEach(purgeE2ERows);

test('student can book a consultation via the 10-day calendar', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="staffStudentNumber"]', '1234567');
  await page.fill('input[name="password"]', 'pass');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/student/dashboard**');
  await page.goto('/student/dashboard?view=find');
  await expect(page.locator('text=Find a Consultation')).toBeVisible();

  const scheduleBtn = page.locator('[data-testid="schedule-btn"]').first();
  await expect(scheduleBtn).toBeVisible();
  await scheduleBtn.click();

  await page.waitForURL('**/consultations/new**');
  await expect(page.locator('text=Book a Consultation')).toBeVisible();

  const firstChunk = page.locator('input[name="start_time"]').first();
  await firstChunk.click();

  const slider = page.locator('#duration-slider');
  await slider.evaluate(el => { el.value = el.min; el.dispatchEvent(new Event('input')); });

  const uniqueTitle = `E2E Test Booking ${Date.now()}`;
  await page.fill('#title', uniqueTitle);

  await page.click('button[type="submit"]');

  await page.waitForURL('**/student/dashboard**');
  await expect(page.locator('text=Consultation booked')).toBeVisible();

  await expect(page.locator(`text=${uniqueTitle}`)).toBeVisible();
});

test('booking page body does not contain "undefined" or "null" strings', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="staffStudentNumber"]', '1234567');
  await page.fill('input[name="password"]', 'pass');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/student/dashboard**');
  await page.goto('/student/dashboard?view=find');

  const scheduleBtn = page.locator('[data-testid="schedule-btn"]').first();
  await expect(scheduleBtn).toBeVisible();
  await scheduleBtn.click();

  await page.waitForURL('**/consultations/new**');
  await expect(page.locator('text=Book a Consultation')).toBeVisible();

  const bodyText = await page.locator('body').innerText();
  expect(bodyText).not.toContain('undefined');
  expect(bodyText).not.toContain('null');
});
