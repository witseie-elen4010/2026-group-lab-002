const { test, expect } = require('@playwright/test');
const db = require('../../database/db');

const purgeE2ECancelRows = () => {
  const rows = db.prepare(
    "SELECT const_id FROM consultations WHERE consultation_title LIKE 'E2E Cancel Test %'"
  ).all();
  for (const row of rows) {
    db.prepare('DELETE FROM consultation_attendees WHERE const_id = ?').run(row.const_id);
    db.prepare('DELETE FROM consultations WHERE const_id = ?').run(row.const_id);
  }
};

test.beforeAll(purgeE2ECancelRows);
test.afterEach(purgeE2ECancelRows);

test('organiser can cancel their own consultation', async ({ page }) => {
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

  const firstChunk = page.locator('input[name="start_time"]').first();
  await firstChunk.click();
  const slider = page.locator('#duration-slider');
  await slider.evaluate(el => { el.value = el.min; el.dispatchEvent(new Event('input')); });

  const uniqueTitle = `E2E Cancel Test ${Date.now()}`;
  await page.fill('#title', uniqueTitle);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/student/dashboard**');
  await expect(page.locator('text=Consultation booked')).toBeVisible();

  await page.goto('/student/dashboard?view=upcoming');
  await page.getByText(uniqueTitle).first().click();
  await page.waitForURL('**/consultations/**');

  page.once('dialog', dialog => dialog.accept());
  await page.click('[data-testid="cancel-btn"]');

  await page.waitForURL('**/student/dashboard**');
  await expect(page.locator('text=cancelled')).toBeVisible();
});

test('non-organiser cannot cancel a consultation', async ({ page }) => {
  const row = db.prepare(
    "SELECT const_id FROM consultations WHERE organiser = 2345678 AND status = 'Booked' LIMIT 1"
  ).get();

  if (!row) {
    test.skip();
    return;
  }

  await page.goto('/login');
  await page.fill('input[name="staffStudentNumber"]', '1234567');
  await page.fill('input[name="password"]', 'pass');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/student/dashboard**');

  await page.goto(`/consultations/${row.const_id}`);
  await expect(page.locator('[data-testid="cancel-btn"]')).not.toBeVisible();
});

test.skip('student can join a joinable consultation', async ({ page }) => {
  // TODO: Enable once dashboard join link is updated to POST (PR pending)
});
