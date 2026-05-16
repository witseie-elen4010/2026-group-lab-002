/* eslint-env jest */
const request = require('supertest');
const app = require('../../app');

jest.mock('../../src/services/public-holidays-service', () => ({
  getSAPublicHolidays: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../src/services/weather-service', () => ({
  getWitsWeather: jest.fn().mockResolvedValue({}),
}));

const { getSAPublicHolidays } = require('../../src/services/public-holidays-service');
const { getWitsWeather } = require('../../src/services/weather-service');

function getFirstCalendarWeekday() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const d = new Date(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T12:00:00Z`);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return d.toISOString().split('T')[0];
}

describe('GET /student/dashboard', () => {
  beforeEach(() => {
    getSAPublicHolidays.mockReset();
    getSAPublicHolidays.mockResolvedValue([]);
  });

  test('responds with 200 and renders the student dashboard page', async () => {
    const res = await request(app).get('/student/dashboard');
    expect(res.status).toBe(200);
    expect(res.text).toContain('My Courses');
    expect(res.text).toContain('Upcoming Consultations');
    expect(res.text).toContain('Past Consultations');
  });

  test('shows the student welcome message', async () => {
    const res = await request(app).get('/student/dashboard');
    expect(res.text).toContain('Welcome back, Test Student');
  });

  test('renders the Find a Consultation calendar section', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '1234567', password: 'Password01' });
    const res = await agent.get('/student/dashboard?view=find');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Find a Consultation');
    expect(res.text).toMatch(/\d+ \w+ – \d+ \w+/);
  });

  test('calendar shows lecturer names from enrolled courses', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '1234567', password: 'Password01' });
    const res = await agent.get('/student/dashboard?view=find');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Clark Kent');
  });

  test('calendar renders Schedule buttons for available slots', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '1234567', password: 'Password01' });
    const res = await agent.get('/student/dashboard?view=find');
    expect(res.status).toBe(200);
    expect(res.text).toContain('data-testid="schedule-btn"');
  });

  test('course colour legend renders enrolled course codes', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '1234567', password: 'Password01' });
    const res = await agent.get('/student/dashboard?view=find');
    expect(res.status).toBe(200);
    expect(res.text).toContain('ELEN4010');
  });

  test('renders Find a Consultation normally when the holidays API is unreachable', async () => {
    getSAPublicHolidays.mockRejectedValueOnce(new Error('Network error'));
    const res = await request(app).get('/student/dashboard');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Find a Consultation');
  });

  test('shows Public holiday label when a holiday falls within the 10-day window', async () => {
    const firstWeekday = getFirstCalendarWeekday();
    getSAPublicHolidays.mockResolvedValueOnce([{ date: firstWeekday, localName: 'Test Holiday' }]);
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '1234567', password: 'Password01' });
    const res = await agent.get('/student/dashboard?view=find');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Public holiday');
  });
});

describe('public holidays and weather integration', () => {
  beforeEach(() => {
    getSAPublicHolidays.mockReset();
    getSAPublicHolidays.mockResolvedValue([]);
    getWitsWeather.mockReset();
    getWitsWeather.mockResolvedValue({});
  });

  test('dashboard renders with status 200 and contains Find a Consultation when both services throw', async () => {
    getSAPublicHolidays.mockRejectedValueOnce(new Error('Holidays API unavailable'));
    getWitsWeather.mockRejectedValueOnce(new Error('Weather API unavailable'));
    const res = await request(app).get('/student/dashboard');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Find a Consultation');
  });

  test('dashboard contains Public holiday when a holiday falls on the first of the next 10 weekdays', async () => {
    const firstWeekday = getFirstCalendarWeekday();
    getSAPublicHolidays.mockResolvedValueOnce([{ date: firstWeekday, localName: 'Test Holiday' }]);
    getWitsWeather.mockResolvedValueOnce({});
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '1234567', password: 'Password01' });
    const res = await agent.get('/student/dashboard?view=find');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Public holiday');
  });
});
