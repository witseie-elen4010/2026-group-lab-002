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

test.beforeAll(() => {
  purgeE2ECancelRows();
  db.prepare('UPDATE students SET failed_attempts = 0, login_pin = NULL WHERE student_number = 1234567').run();
});
test.afterEach(purgeE2ECancelRows);

test('organiser can cancel their own consultation', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="staffStudentNumber"]', '1234567');
  await page.fill('input[name="password"]', 'Password01');
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
  await page.fill('input[name="password"]', 'Password01');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/student/dashboard**');

  await page.goto(`/consultations/${row.const_id}`);
  await expect(page.locator('[data-testid="cancel-btn"]')).not.toBeVisible();
});

test('non-organiser attendee can leave a consultation', async ({ page }) => {
  const row = db.prepare(
    "SELECT c.const_id FROM consultations c JOIN consultation_attendees ca ON ca.const_id = c.const_id WHERE ca.student_number = 2345678 AND c.status = 'Booked' LIMIT 1"
  ).get();

  if (!row) {
    test.skip();
    return;
  }

  db.prepare('INSERT OR IGNORE INTO consultation_attendees (const_id, student_number) VALUES (?, 1234567)').run(row.const_id);

  await page.goto('/login');
  await page.fill('input[name="staffStudentNumber"]', '1234567');
  await page.fill('input[name="password"]', 'Password01');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/student/dashboard**');

  await page.goto(`/consultations/${row.const_id}`);
  await expect(page.locator('[data-testid="leave-btn"]')).toBeVisible();
  await page.click('[data-testid="leave-btn"]');

  await page.waitForURL('**/student/dashboard**');
  await expect(page.locator('text=left the consultation')).toBeVisible();

  db.prepare('DELETE FROM consultation_attendees WHERE const_id = ? AND student_number = 1234567').run(row.const_id);
});

test('student can join a joinable consultation', async ({ page }) => {
  const constId = 'E2E-CANCEL-JOIN-001';
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
  d.setUTCDate(d.getUTCDate() + 1);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() + 1);
  const dateStr = d.toISOString().split('T')[0];

  db.prepare('DELETE FROM consultation_attendees WHERE const_id = ?').run(constId);
  db.prepare('DELETE FROM consultations WHERE const_id = ?').run(constId);
  db.prepare(`
    INSERT INTO consultations
      (const_id, consultation_title, consultation_date, consultation_time,
       lecturer_id, duration_min, max_number_of_students, venue, status, allow_join)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(constId, 'E2E Cancel Test Join', dateStr, '10:00',
         'A000356', 60, 5, 'Room 101', 'Booked', 1);

  await page.goto('/login');
  await page.fill('input[name="staffStudentNumber"]', '1234567');
  await page.fill('input[name="password"]', 'Password01');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/student/dashboard**');

  await page.goto(`/consultations/${constId}`);
  await page.getByRole('button', { name: 'Join Consultation' }).click();

  await expect(page).toHaveURL(/student/);
  await expect(page.locator('body')).toContainText('Successfully joined consultation');

  db.prepare('DELETE FROM consultation_attendees WHERE const_id = ?').run(constId);
  db.prepare('DELETE FROM consultations WHERE const_id = ?').run(constId);
});
