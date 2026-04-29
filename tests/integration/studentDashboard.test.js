/* eslint-env jest */
const request = require('supertest');
const app = require('../../app');

describe('GET /student/dashboard', () => {
  test('responds with 200 and renders the student dashboard page', async () => {
    const res = await request(app).get('/student/dashboard');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Upcoming Consultations');
    expect(res.text).toContain('Past Consultations');
  });

  test('shows the student welcome message', async () => {
    const res = await request(app).get('/student/dashboard');
    expect(res.text).toContain('Welcome back, Test Student');
  });
});