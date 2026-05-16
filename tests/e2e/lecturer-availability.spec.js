const { test, expect } = require('@playwright/test');
const db = require('../../database/db');

const purgeE2ESlots = () => {
  const slots = db.prepare(
    "SELECT availability_id FROM lecturer_availability WHERE venue = 'E2E Test Room'"
  ).all();
  for (const slot of slots) {
    db.prepare('DELETE FROM lecturer_availability WHERE availability_id = ?').run(slot.availability_id);
  }
};

test.beforeAll(purgeE2ESlots);
test.afterEach(purgeE2ESlots);

test('lecturer can add a new availability slot and it appears in the table', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="staffStudentNumber"]', 'A000358');
  await page.fill('[name="password"]', 'Password01');
  await page.click('[type="submit"]');
  await page.waitForURL('**/lecturer/dashboard**');

  await page.goto('/lecturer/availability');
  await expect(page.getByRole('heading', { name: 'Availability', exact: true })).toBeVisible();

  await page.selectOption('#day_of_week', 'Wed');
  await page.fill('#start_time', '11:00');
  await page.fill('#end_time', '12:00');
  await page.fill('#max_booking_min', '45');
  await page.fill('#venue', 'E2E Test Room');
  await page.fill('#max_number_of_students', '2');

  await page.click('[data-testid="save-slot-btn"]');
  await page.waitForURL('**/lecturer/availability**');

  await expect(page.locator('[data-testid="availability-table"]')).toBeVisible();
  await expect(page.locator('text=E2E Test Room')).toBeVisible();
});

test('lecturer can delete an availability slot', async ({ page }) => {
  db.prepare(
    "INSERT INTO lecturer_availability (staff_number, day_of_week, start_time, end_time, max_booking_min, venue, max_number_of_students) VALUES ('A000358', 'Fri', '14:00', '15:00', 60, 'E2E Test Room', 1)"
  ).run();

  await page.goto('/login');
  await page.fill('[name="staffStudentNumber"]', 'A000358');
  await page.fill('[name="password"]', 'Password01');
  await page.click('[type="submit"]');
  await page.waitForURL('**/lecturer/dashboard**');

  await page.goto('/lecturer/availability');
  await expect(page.locator('text=E2E Test Room')).toBeVisible();

  const deleteForm = page.locator('form[action*="/delete"]').filter({ has: page.locator('button', { hasText: 'Delete' }) }).last();
  await deleteForm.locator('button').click();

  await page.waitForURL('**/lecturer/availability**');
  await expect(page.locator('text=E2E Test Room')).not.toBeVisible();
});
