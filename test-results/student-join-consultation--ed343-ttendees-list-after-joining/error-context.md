# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: student-join-consultation.spec.js >> Student joins a consultation >> student appears in the attendees list after joining
- Location: tests\e2e\student-join-consultation.spec.js:74:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Join Consultation' })

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - text: "ReferenceError: res is not defined"
  - text: at getStudentUser (C:\Users\sunet\OneDrive\Desktop\Uni\2026\SDIII\GroupLab\Code2\2026-group-lab-002\src\controllers\consultation-detail-controller.js:9:5)
  - text: at showConsultationDetail (C:\Users\sunet\OneDrive\Desktop\Uni\2026\SDIII\GroupLab\Code2\2026-group-lab-002\src\controllers\consultation-detail-controller.js:19:16)
  - text: at Layer.handleRequest (C:\Users\sunet\OneDrive\Desktop\Uni\2026\SDIII\GroupLab\Code2\2026-group-lab-002\node_modules\router\lib\layer.js:152:17)
  - text: at next (C:\Users\sunet\OneDrive\Desktop\Uni\2026\SDIII\GroupLab\Code2\2026-group-lab-002\node_modules\router\lib\route.js:157:13)
  - text: at Route.dispatch (C:\Users\sunet\OneDrive\Desktop\Uni\2026\SDIII\GroupLab\Code2\2026-group-lab-002\node_modules\router\lib\route.js:117:3)
  - text: at handle (C:\Users\sunet\OneDrive\Desktop\Uni\2026\SDIII\GroupLab\Code2\2026-group-lab-002\node_modules\router\index.js:435:11)
  - text: at Layer.handleRequest (C:\Users\sunet\OneDrive\Desktop\Uni\2026\SDIII\GroupLab\Code2\2026-group-lab-002\node_modules\router\lib\layer.js:152:17)
  - text: at C:\Users\sunet\OneDrive\Desktop\Uni\2026\SDIII\GroupLab\Code2\2026-group-lab-002\node_modules\router\index.js:295:15
  - text: at param (C:\Users\sunet\OneDrive\Desktop\Uni\2026\SDIII\GroupLab\Code2\2026-group-lab-002\node_modules\router\index.js:600:14)
  - text: at param (C:\Users\sunet\OneDrive\Desktop\Uni\2026\SDIII\GroupLab\Code2\2026-group-lab-002\node_modules\router\index.js:610:14)
```

# Test source

```ts
  1   | const { test, expect } = require('@playwright/test');
  2   | const db = require('../../database/db');
  3   | 
  4   | const JOIN_ID = 'E2E-STUDENT-JOIN-001';
  5   | const FULL_ID = 'E2E-STUDENT-JOIN-FULL';
  6   | 
  7   | const nextWeekday = () => {
  8   |   const d = new Date(Date.now() + 2 * 60 * 60 * 1000); // SAST offset
  9   |   d.setUTCDate(d.getUTCDate() + 1);
  10  |   while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() + 1);
  11  |   return d.toISOString().split('T')[0];
  12  | };
  13  | 
  14  | const insertConsultation = (constId, maxStudents = 5) => {
  15  |   db.prepare('DELETE FROM consultation_attendees WHERE const_id = ?').run(constId);
  16  |   db.prepare('DELETE FROM consultations WHERE const_id = ?').run(constId);
  17  |   db.prepare(`
  18  |     INSERT INTO consultations (
  19  |       const_id, consultation_title, consultation_date, consultation_time,
  20  |       lecturer_id, duration_min, max_number_of_students, venue, status, allow_join
  21  |     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  22  |   `).run(constId, 'SD3 - Assignment 3 Q&A', nextWeekday(), '10:00',
  23  |          'A000356', 60, maxStudents, 'Room 101', 'Booked', 1);
  24  | };
  25  | 
  26  | test.beforeEach(() => {
  27  |   db.prepare('UPDATE students SET failed_attempts = 0, login_pin = NULL WHERE student_number = 1234567').run();
  28  |   insertConsultation(JOIN_ID, 5);
  29  | });
  30  | 
  31  | test.afterEach(() => {
  32  |   for (const id of [JOIN_ID, FULL_ID]) {
  33  |     db.prepare('DELETE FROM consultation_attendees WHERE const_id = ?').run(id);
  34  |     db.prepare('DELETE FROM consultations WHERE const_id = ?').run(id);
  35  |   }
  36  |   db.prepare('DELETE FROM students WHERE student_number IN (8888888, 9999999)').run();
  37  | });
  38  | 
  39  | test.describe('Student joins a consultation', () => {
  40  |   test('student can join an available consultation from the calendar', async ({ page }) => {
  41  |     await page.goto('/login');
  42  |     await page.fill('input[name="staffStudentNumber"]', '1234567');
  43  |     await page.fill('input[name="password"]', 'Password01');
  44  |     await page.click('button[type="submit"]');
  45  | 
  46  |     await expect(page).toHaveURL(/student/);
  47  |     await expect(page.locator('body')).toContainText('Dashboard');
  48  | 
  49  |     await page.goto('/student/dashboard?view=find');
  50  |     await expect(page.getByRole('heading', { name: 'Find a Consultation' })).toBeVisible();
  51  | 
  52  |     const joinBtn = page.locator(`form[action="/consultations/${JOIN_ID}/join"] button`);
  53  |     await expect(joinBtn).toBeVisible();
  54  |     await joinBtn.click();
  55  | 
  56  |     await expect(page).toHaveURL(/student/);
  57  |     await expect(page.locator('body')).toContainText('Successfully joined consultation');
  58  |   });
  59  | 
  60  |   test('join button is no longer shown after the student has already joined', async ({ page }) => {
  61  |     await page.goto('/login');
  62  |     await page.fill('input[name="staffStudentNumber"]', '1234567');
  63  |     await page.fill('input[name="password"]', 'Password01');
  64  |     await page.click('button[type="submit"]');
  65  | 
  66  |     await page.goto(`/consultations/${JOIN_ID}`);
  67  |     await page.getByRole('button', { name: 'Join Consultation' }).click();
  68  |     await expect(page).toHaveURL(/student/);
  69  | 
  70  |     await page.goto(`/consultations/${JOIN_ID}`);
  71  |     await expect(page.getByRole('button', { name: 'Join Consultation' })).not.toBeVisible();
  72  |   });
  73  | 
  74  |   test('student appears in the attendees list after joining', async ({ page }) => {
  75  |     await page.goto('/login');
  76  |     await page.fill('input[name="staffStudentNumber"]', '1234567');
  77  |     await page.fill('input[name="password"]', 'Password01');
  78  |     await page.click('button[type="submit"]');
  79  | 
  80  |     await page.goto(`/consultations/${JOIN_ID}`);
> 81  |     await page.getByRole('button', { name: 'Join Consultation' }).click();
      |                                                                   ^ Error: locator.click: Test timeout of 30000ms exceeded.
  82  |     await expect(page).toHaveURL(/student/);
  83  | 
  84  |     await page.goto(`/consultations/${JOIN_ID}`);
  85  |     await expect(page.locator('body')).toContainText('Aditya Raghunandan');
  86  |   });
  87  | 
  88  |   test('student cannot join a full consultation', async ({ page }) => {
  89  |     insertConsultation(FULL_ID, 1);
  90  |     db.prepare('INSERT OR IGNORE INTO students (student_number, name, email, password, degree_code) VALUES (8888888, ?, ?, ?, ?)')
  91  |       .run('Other Student', 'other@students.wits.ac.za', 'Password01', 'BSCENGINFO');
  92  |     db.prepare('INSERT INTO consultation_attendees (const_id, student_number) VALUES (?, 8888888)').run(FULL_ID);
  93  | 
  94  |     await page.goto('/login');
  95  |     await page.fill('input[name="staffStudentNumber"]', '1234567');
  96  |     await page.fill('input[name="password"]', 'Password01');
  97  |     await page.click('button[type="submit"]');
  98  | 
  99  |     await expect(page).toHaveURL(/student/);
  100 | 
  101 |     await page.goto('/student/dashboard?view=find');
  102 | 
  103 |     const fullJoinBtn = page.locator(`form[action="/consultations/${FULL_ID}/join"] button`);
  104 |     await expect(fullJoinBtn).not.toBeVisible();
  105 | 
  106 |     await page.goto(`/consultations/${FULL_ID}`);
  107 |     await expect(page.getByRole('button', { name: 'Join Consultation' })).not.toBeVisible();
  108 |     await expect(page.locator('body')).toContainText('0 spots remaining');
  109 |   });
  110 | });
  111 | 
```