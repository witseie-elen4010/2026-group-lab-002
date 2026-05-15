/* eslint-env jest */
const request = require('supertest');
const app = require('../../app');

describe('GET /courses/:courseCode', () => {
  test('redirects to dashboard with error when student is not logged in and default user not enrolled', async () => {
    const res = await request(app).get('/courses/MECN2026');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/student/dashboard');
    expect(res.headers.location).toContain('error');
  });

  test('renders course detail page for enrolled student', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '1234567', password: 'pass' });
    const res = await agent.get('/courses/ELEN4010');
    expect(res.status).toBe(200);
    expect(res.text).toContain('ELEN4010');
    expect(res.text).toContain('Software Development III');
  });

  test('shows lecturer names for enrolled course', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '1234567', password: 'pass' });
    const res = await agent.get('/courses/ELEN4010');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Clark Kent');
  });

  test('redirects non-enrolled student to dashboard with error', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '1234567', password: 'pass' });
    const res = await agent.get('/courses/MECN2026');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/student/dashboard');
    expect(res.headers.location).toContain('error');
  });

  test('renders course detail page for enrolled course with no base-seed lecturers', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '1234567', password: 'pass' });
    const res = await agent.get('/courses/ELEN4009');
    expect(res.status).toBe(200);
    expect(res.text).toContain('ELEN4009');
  });
});
