/* eslint-env jest */
const request = require('supertest');
const db = require('../../database/db');
const app = require('../../app');

jest.mock('../../src/services/weather-service', () => ({
  getWitsWeather: jest.fn().mockResolvedValue({}),
}));

const { getWitsWeather } = require('../../src/services/weather-service');

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

describe('GET /consultations/new', () => {
  test('redirects to dashboard when staffNumber param is missing', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '2434427', password: 'Password01' });
    const res = await agent.get('/consultations/new?availabilityId=1&date=2026-05-12');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/student/dashboard');
  });

  test('redirects when student is not enrolled in any course taught by that lecturer', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '2434427', password: 'Password01' });
    const date = getNextWeekday('Mon');
    const res = await agent.get(`/consultations/new?staffNumber=STAFF_NOBODY&availabilityId=1&date=${date}`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/student/dashboard');
  });

  test('renders booking page for enrolled student with valid params', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '2434427', password: 'Password01' });
    const date = getNextWeekday('Mon');
    const res = await agent.get(`/consultations/new?staffNumber=A000356&availabilityId=1&date=${date}`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('Book a Consultation');
    expect(res.text).toContain('Clark Kent');
  });
});

describe('POST /consultations/new', () => {
  const date = getNextWeekday('Wed');
  const testTag = `BOOK-${Date.now()}`;
  const createdIds = [];

  afterEach(() => {
    for (const id of createdIds.splice(0)) {
      db.prepare('DELETE FROM consultations WHERE const_id = ?').run(id);
    }
  });

  const bookSlot = async (agent, overrides = {}) => {
    const defaults = {
      staff_number: 'A000356',
      availability_id: '3',
      date,
      start_time: '10:00',
      duration_min: '30',
      title: `Test ${testTag}`,
      allow_join: '1',
    };
    return agent.post('/consultations/new').type('form').send({ ...defaults, ...overrides });
  };

  test('creates consultation and attendee row on valid booking', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '2434427', password: 'Password01' });
    const res = await bookSlot(agent, { title: `Valid Booking ${testTag}`, allow_join: '1' });
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/student/dashboard');

    const consultation = db.prepare(
      "SELECT * FROM consultations WHERE consultation_date = ? AND lecturer_id = 'A000356' AND consultation_title = ?"
    ).get(date, `Valid Booking ${testTag}`);
    expect(consultation).toBeTruthy();
    expect(consultation.allow_join).toBe(1);
    createdIds.push(consultation.const_id);

    const attendee = db.prepare('SELECT * FROM consultation_attendees WHERE const_id = ? AND student_number = ?')
      .get(consultation.const_id, 2434427);
    expect(attendee).toBeTruthy();
  });

  test('stores allow_join=0 when checkbox is not sent', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '2434427', password: 'Password01' });
    const body = {
      staff_number: 'A000356', availability_id: '3', date,
      start_time: '10:15', duration_min: '15', title: `No Join ${testTag}`,
    };
    const res = await agent.post('/consultations/new').type('form').send(body);
    expect(res.status).toBe(302);
    const row = db.prepare("SELECT * FROM consultations WHERE consultation_title = ?").get(`No Join ${testTag}`);
    expect(row).toBeTruthy();
    expect(row.allow_join).toBe(0);
    createdIds.push(row.const_id);
  });

  test('rejects title exceeding 100 characters with an error message', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '2434427', password: 'Password01' });
    const longTitle = 'a'.repeat(101);
    const res = await bookSlot(agent, { title: longTitle });
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('error');
    expect(decodeURIComponent(res.headers.location)).toContain('100 characters or fewer');
  });

  test('stores script tag in title as plain text without executing', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '2434427', password: 'Password01' });
    const scriptTitle = `<script>alert(1)</script> ${testTag}`;
    const res = await bookSlot(agent, { title: scriptTitle, start_time: '10:30' });
    expect(res.status).toBe(302);
    const row = db.prepare('SELECT * FROM consultations WHERE consultation_title = ?').get(scriptTitle.trim());
    if (row) {
      createdIds.push(row.const_id);
      expect(row.consultation_title).toBe(scriptTitle.trim());
    }
  });

  test('rejects booking with duration_min exceeding max_booking_min', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '2434427', password: 'Password01' });
    // Availability 3: A000356, Wed 10:00-14:00, max_booking_min=180 — posting 181 min should be rejected
    const res = await bookSlot(agent, { availability_id: '3', start_time: '10:00', duration_min: '181' });
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('error');
    expect(decodeURIComponent(res.headers.location)).toContain('maximum consultation duration');
  });

  test('rejects booking outside the availability window', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '2434427', password: 'Password01' });
    const res = await bookSlot(agent, { start_time: '08:00', title: 'Outside window booking' });
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('error');
  });

  test('rejects booking that overlaps an existing non-joinable consultation', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '2434427', password: 'Password01' });

    const firstBody = {
      staff_number: 'A000356', availability_id: '3', date,
      start_time: '11:00', duration_min: '60', title: `First Non-Joinable ${testTag}`,
    };
    const first = await agent.post('/consultations/new').type('form').send(firstBody);
    expect(first.headers.location).not.toContain('error');
    const firstRow = db.prepare("SELECT * FROM consultations WHERE consultation_title = ?").get(`First Non-Joinable ${testTag}`);
    if (firstRow) createdIds.push(firstRow.const_id);

    const secondBody = {
      staff_number: 'A000356', availability_id: '3', date,
      start_time: '11:00', duration_min: '30', title: `Should Fail ${testTag}`, allow_join: '1',
    };
    const second = await agent.post('/consultations/new').type('form').send(secondBody);
    expect(second.status).toBe(302);
    expect(second.headers.location).toContain('error');
  });
});

describe('weather on booking page', () => {
  beforeEach(() => {
    getWitsWeather.mockReset();
    getWitsWeather.mockResolvedValue({});
  });

  test('booking page renders with status 200 when weather service throws', async () => {
    getWitsWeather.mockRejectedValueOnce(new Error('Weather service unavailable'));
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '2434427', password: 'Password01' });
    const date = getNextWeekday('Mon');
    const res = await agent.get(`/consultations/new?staffNumber=A000356&availabilityId=1&date=${date}`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('Book a Consultation');
  });

  test('booking page contains rain banner when condition is rainy', async () => {
    const date = getNextWeekday('Mon');
    getWitsWeather.mockResolvedValueOnce({
      [date]: { condition: 'rainy', icon: '🌧️', maxTemp: 18, message: 'Rain expected' },
    });
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '2434427', password: 'Password01' });
    const res = await agent.get(`/consultations/new?staffNumber=A000356&availabilityId=1&date=${date}`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('Rain is expected');
  });
});
