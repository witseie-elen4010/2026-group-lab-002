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

describe('GET /consultations/:constId', () => {
  const date = getNextWeekday('Thu');
  const constId = `DETAIL-TEST-${Date.now()}`;

  beforeAll(() => {
    db.prepare(`
      INSERT OR IGNORE INTO consultations
        (const_id, consultation_title, consultation_date, consultation_time,
         lecturer_id, organiser, availability_id, duration_min, max_number_of_students, venue, status, allow_join)
      VALUES (?, 'Detail Test Consultation', ?, '11:00', 'A000356', 1234567, 1, 30, 3, 'Room 101', 'Booked', 1)
    `).run(constId, date);
    db.prepare('INSERT OR IGNORE INTO consultation_attendees (const_id, student_number) VALUES (?, ?)').run(constId, 1234567);
  });

  afterAll(() => {
    db.prepare('DELETE FROM consultation_attendees WHERE const_id = ?').run(constId);
    db.prepare('DELETE FROM consultations WHERE const_id = ?').run(constId);
  });

  test('renders detail page with correct title and attendees for enrolled student', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '1234567', password: 'pass' });
    const res = await agent.get(`/consultations/${constId}`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('Detail Test Consultation');
    expect(res.text).toContain('Aditya Raghunandan');
  });

  test('shows organiser badge for the consultation creator', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '1234567', password: 'pass' });
    const res = await agent.get(`/consultations/${constId}`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('Organiser');
  });

  test('returns 403 for a user not enrolled and not an attendee', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: 'A000357', password: 'pass' });
    const res = await agent.get(`/consultations/${constId}`);
    expect(res.status).toBe(403);
  });

  test('redirects to dashboard when consultation does not exist', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '1234567', password: 'pass' });
    const res = await agent.get('/consultations/nonexistent-id');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/student/dashboard');
  });
});
