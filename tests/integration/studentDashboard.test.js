/* eslint-env jest */
const request = require('supertest');
const app = require('../../app');

describe('GET /student/dashboard', () => {
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
    await agent.post('/login').type('form').send({ staffStudentNumber: '1234567', password: 'pass' });
    const res = await agent.get('/student/dashboard');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Find a Consultation');
    expect(res.text).toContain('This week');
    expect(res.text).toContain('Next week');
  });

  test('calendar shows lecturer names from enrolled courses', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '1234567', password: 'pass' });
    const res = await agent.get('/student/dashboard');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Clark Kent');
  });

  test('calendar renders Schedule buttons for available slots', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '1234567', password: 'pass' });
    const res = await agent.get('/student/dashboard');
    expect(res.status).toBe(200);
    expect(res.text).toContain('data-testid="schedule-btn"');
  });

  test('course colour legend renders enrolled course codes', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '1234567', password: 'pass' });
    const res = await agent.get('/student/dashboard');
    expect(res.status).toBe(200);
    expect(res.text).toContain('ELEN4010');
  });
});