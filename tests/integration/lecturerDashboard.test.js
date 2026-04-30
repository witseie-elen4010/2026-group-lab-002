/* eslint-env jest */
const request = require('supertest');
const app = require('../../app');

describe('GET /lecturer/dashboard', () => {
  test('redirects to /login when not authenticated', async () => {
    const res = await request(app).get('/lecturer/dashboard');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/login');
  });

  test('renders dashboard with correct headings when authenticated as a lecturer', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: 'A000356', password: 'pass' });
    const res = await agent.get('/lecturer/dashboard');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Lecturer Dashboard');
    expect(res.text).toContain('Upcoming Consultations');
  });
});
