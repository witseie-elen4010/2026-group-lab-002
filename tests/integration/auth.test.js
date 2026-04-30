/* eslint-env jest */
const request = require('supertest');
const app = require('../../app');

describe('POST /login', () => {
  test('redirects staff to lecturer dashboard with welcome flag on valid credentials', async () => {
    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ staffStudentNumber: 'A000356', password: 'pass' });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/lecturer/dashboard?welcome=1');
  });

  test('redirects student to student dashboard with welcome flag on valid credentials', async () => {
    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ staffStudentNumber: '1234567', password: 'pass' });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/student/dashboard?welcome=1');
  });

  test('renders login page with error on invalid credentials', async () => {
    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ staffStudentNumber: 'A000356', password: 'wrongpassword' });

    expect(res.status).toBe(200);
    expect(res.text).toContain('Invalid username or password.');
  });
});

describe('POST /logout', () => {
  test('clears session and redirects to homepage', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: 'A000356', password: 'pass' });

    const res = await agent.post('/logout');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');
  });
});

describe('GET /', () => {
  test('renders homepage for unauthenticated users', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.text).toContain('KnockKnock.prof');
  });
});
