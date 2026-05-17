const { test, expect } = require('@playwright/test');
const db = require('../../database/db');

const JOIN_ID = 'E2E-STUDENT-JOIN-001';
const FULL_ID = 'E2E-STUDENT-JOIN-FULL';

const nextWeekday = () => {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000); // SAST offset
  d.setUTCDate(d.getUTCDate() + 1);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().split('T')[0];
};

const insertConsultation = (constId, maxStudents = 5) => {
  db.prepare('DELETE FROM consultation_attendees WHERE const_id = ?').run(constId);
  db.prepare('DELETE FROM consultations WHERE const_id = ?').run(constId);
  db.prepare(`
    INSERT INTO consultations (
      const_id, consultation_title, consultation_date, consultation_time,
      lecturer_id, duration_min, max_number_of_students, venue, status, allow_join
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(constId, 'SD3 - Assignment 3 Q&A', nextWeekday(), '10:00',
         'A000356', 60, maxStudents, 'Room 101', 'Booked', 1);
};

test.beforeEach(() => {
  db.prepare('UPDATE students SET failed_attempts = 0, login_pin = NULL WHERE student_number = 2434427').run();
  insertConsultation(JOIN_ID, 5);
});

test.afterEach(() => {
  for (const id of [JOIN_ID, FULL_ID]) {
    db.prepare('DELETE FROM consultation_attendees WHERE const_id = ?').run(id);
    db.prepare('DELETE FROM consultations WHERE const_id = ?').run(id);
  }
  db.prepare('DELETE FROM students WHERE student_number IN (8888888, 9999999)').run();
});

test.describe('Student joins a consultation', () => {
  test('student can join an available consultation from the calendar', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="staffStudentNumber"]', '2434427');
    await page.fill('input[name="password"]', 'Password01');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/student/);
    await expect(page.locator('body')).toContainText('Dashboard');

    await page.goto('/student/dashboard?view=find');
    await expect(page.getByRole('heading', { name: 'Find a Consultation' })).toBeVisible();

    const joinBtn = page.locator(`form[action="/consultations/${JOIN_ID}/join"] button`);
    await expect(joinBtn).toBeVisible();
    await joinBtn.click();

    await expect(page).toHaveURL(/student/);
    await expect(page.locator('body')).toContainText('Successfully joined consultation');
  });

  test('student cannot join a full consultation', async ({ page }) => {
    insertConsultation(FULL_ID, 1);
    db.prepare('INSERT OR IGNORE INTO students (student_number, name, email, password, degree_code) VALUES (8888888, ?, ?, ?, ?)')
      .run('Other Student', 'other@students.wits.ac.za', 'Password01', 'BSCENGINFO');
    db.prepare('INSERT INTO consultation_attendees (const_id, student_number) VALUES (?, 8888888)').run(FULL_ID);

    await page.goto('/login');
    await page.fill('input[name="staffStudentNumber"]', '2434427');
    await page.fill('input[name="password"]', 'Password01');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/student/);

    await page.goto('/student/dashboard?view=find');

    const fullJoinBtn = page.locator(`form[action="/consultations/${FULL_ID}/join"] button`);
    await expect(fullJoinBtn).not.toBeVisible();

    await page.goto(`/consultations/${FULL_ID}`);
    await expect(page.getByRole('button', { name: 'Join Consultation' })).not.toBeVisible();
    await expect(page.locator('body')).toContainText('0 spots remaining');
  });
});
