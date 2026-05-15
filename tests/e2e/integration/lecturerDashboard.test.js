/* eslint-env jest */
const request = require('supertest');
const app = require('../../app');

describe('GET /lecturer/dashboard', () => {
  test('redirects to /login when not authenticated', async () => {
    const res = await request(app).get('/lecturer/dashboard');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/login');
  });

  test('renders dashboard when authenticated as a lecturer', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: 'A000356', password: 'pass' });
    const res = await agent.get('/lecturer/dashboard');
    expect(res.status).toBe(200);
    expect(res.text).toContain("Today's Consultations");
  });

  test('dashboard does not contain the My Courses section', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: 'A000356', password: 'pass' });
    const res = await agent.get('/lecturer/dashboard');
    expect(res.status).toBe(200);
    expect(res.text).not.toContain('id="my-courses"');
    expect(res.text).not.toContain('<h5 class="mb-0 fw-bold">My Courses</h5>');
  });

  test('sidebar contains a link to My Courses', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: 'A000356', password: 'pass' });
    const res = await agent.get('/lecturer/dashboard');
    expect(res.status).toBe(200);
    expect(res.text).toContain('href="/lecturer/courses"');
  });

  test('returns 403 when authenticated as a student', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '1234567', password: 'pass' });
    const res = await agent.get('/lecturer/dashboard');
    expect(res.status).toBe(403);
  });
});
