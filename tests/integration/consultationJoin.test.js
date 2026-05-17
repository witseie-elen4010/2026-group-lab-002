/* eslint-env jest */
const request = require('supertest');
const db = require('../../database/db');
const app = require('../../app');

const getNextWeekday = (dowTarget) => {
  const DOW = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5 };
  const target = DOW[dowTarget];
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  for (let i = 0; i < 14; i++) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (d.getUTCDay() === target) break;
  }
  return d.toISOString().split('T')[0];
};

describe('POST /consultations/:constId/join', () => {
  const date = getNextWeekday('Mon');
  const constId = `JOIN-TEST-${Date.now()}`;

  beforeEach(() => {
    db.prepare(`
      INSERT OR IGNORE INTO consultations
        (const_id, consultation_title, consultation_date, consultation_time,
         lecturer_id, organiser, availability_id, duration_min, max_number_of_students, venue, status, allow_join)
      VALUES (?, 'Join Test', ?, '10:00', 'A000356', 2434427, 1, 30, 3, 'Room 101', 'Booked', 1)
    `).run(constId, date);
    db.prepare('INSERT OR IGNORE INTO consultation_attendees (const_id, student_number) VALUES (?, ?)').run(constId, 2434427);
  });

  afterEach(() => {
    db.prepare('DELETE FROM consultation_attendees WHERE const_id = ?').run(constId);
    db.prepare('DELETE FROM consultations WHERE const_id = ?').run(constId);
    db.prepare('DELETE FROM students WHERE student_number IN (9000001, 9000002)').run();
  });

  test('rejects join when student is already an attendee', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '2434427', password: 'Password01' });
    const res = await agent.post(`/consultations/${constId}/join`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('error');
  });

  test('adds student as attendee on successful join', async () => {
    db.prepare('DELETE FROM consultation_attendees WHERE const_id = ? AND student_number = ?').run(constId, 2434427);

    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '2434427', password: 'Password01' });
    const res = await agent.post(`/consultations/${constId}/join`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/student/dashboard');

    const attendee = db.prepare('SELECT * FROM consultation_attendees WHERE const_id = ? AND student_number = ?')
      .get(constId, 2434427);
    expect(attendee).toBeTruthy();
  });

  test('rejects join when consultation is at full capacity', async () => {
    db.prepare(
      "INSERT OR IGNORE INTO students (student_number, name, email, password, degree_code) VALUES (9000001, 'ExtraA', 'extra1@x.com', 'p', 'BSCENGINFO')"
    ).run();
    db.prepare(
      "INSERT OR IGNORE INTO students (student_number, name, email, password, degree_code) VALUES (9000002, 'ExtraB', 'extra2@x.com', 'p', 'BSCENGINFO')"
    ).run();
    db.prepare('INSERT OR IGNORE INTO consultation_attendees (const_id, student_number) VALUES (?, ?)').run(constId, 9000001);
    db.prepare('INSERT OR IGNORE INTO consultation_attendees (const_id, student_number) VALUES (?, ?)').run(constId, 9000002);
    // 2434427 + 9000001 + 9000002 = 3 attendees = max_number_of_students(3)
    // capacity check fires before already-attending check → correct rejection reason

    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '2434427', password: 'Password01' });
    const res = await agent.post(`/consultations/${constId}/join`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('error');
  });
});
