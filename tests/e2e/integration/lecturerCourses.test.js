/* eslint-env jest */
const request = require('supertest');
const app = require('../../app');

// ---------------------------------------------------------------------------
// GET /lecturer/courses  — read-only summary
// ---------------------------------------------------------------------------
describe('GET /lecturer/courses', () => {
  test('redirects unauthenticated user to /login', async () => {
    const res = await request(app).get('/lecturer/courses');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/login');
  });

  test('returns 403 for a logged-in student', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '1234567', password: 'pass' });
    const res = await agent.get('/lecturer/courses');
    expect(res.status).toBe(403);
  });

  test('returns 200 for a logged-in lecturer', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: 'A000356', password: 'pass' });
    const res = await agent.get('/lecturer/courses');
    expect(res.status).toBe(200);
  });

  test('shows only the lecturer\'s enrolled course codes, not all courses', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: 'A000356', password: 'pass' });
    const res = await agent.get('/lecturer/courses');
    expect(res.status).toBe(200);
    expect(res.text).toContain('ELEN4010');
  });

  test('does not show the department dropdown', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: 'A000356', password: 'pass' });
    const res = await agent.get('/lecturer/courses');
    expect(res.status).toBe(200);
    expect(res.text).not.toContain('name="department_code"');
  });

  test('does not show the course search bar', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: 'A000356', password: 'pass' });
    const res = await agent.get('/lecturer/courses');
    expect(res.status).toBe(200);
    expect(res.text).not.toContain('id="course-search"');
  });

  test('does not show checkboxes for course selection', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: 'A000356', password: 'pass' });
    const res = await agent.get('/lecturer/courses');
    expect(res.status).toBe(200);
    expect(res.text).not.toContain('class="form-check-input');
  });

  test('Edit button links to /lecturer/courses/edit', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: 'A000356', password: 'pass' });
    const res = await agent.get('/lecturer/courses');
    expect(res.status).toBe(200);
    expect(res.text).toContain('href="/lecturer/courses/edit"');
  });
});

// ---------------------------------------------------------------------------
// GET /lecturer/courses/edit  — full edit form
// ---------------------------------------------------------------------------
describe('GET /lecturer/courses/edit', () => {
  test('redirects unauthenticated user to /login', async () => {
    const res = await request(app).get('/lecturer/courses/edit');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/login');
  });

  test('returns 403 for a logged-in student', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '1234567', password: 'pass' });
    const res = await agent.get('/lecturer/courses/edit');
    expect(res.status).toBe(403);
  });

  test('returns 200 for a logged-in lecturer', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: 'A000356', password: 'pass' });
    const res = await agent.get('/lecturer/courses/edit');
    expect(res.status).toBe(200);
  });

  test('shows department dropdown on the edit page', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: 'A000356', password: 'pass' });
    const res = await agent.get('/lecturer/courses/edit');
    expect(res.status).toBe(200);
    expect(res.text).toContain('name="department_code"');
  });

  test('shows course search bar on the edit page', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: 'A000356', password: 'pass' });
    const res = await agent.get('/lecturer/courses/edit');
    expect(res.status).toBe(200);
    expect(res.text).toContain('id="course-search"');
  });

  test('shows Update Teaching Load submit button', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: 'A000356', password: 'pass' });
    const res = await agent.get('/lecturer/courses/edit');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Update Teaching Load');
  });
});

// ---------------------------------------------------------------------------
// POST /lecturer/courses  — save and redirect
// ---------------------------------------------------------------------------
describe('POST /lecturer/courses', () => {
  test('redirects unauthenticated user to /login', async () => {
    const res = await request(app).post('/lecturer/courses').type('form').send({ department_code: 'EIE' });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/login');
  });

  test('returns 403 for a logged-in student', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '1234567', password: 'pass' });
    const res = await agent.post('/lecturer/courses').type('form').send({ department_code: 'EIE' });
    expect(res.status).toBe(403);
  });

  test('redirects to /lecturer/courses after successful save', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: 'A000356', password: 'pass' });
    const res = await agent.post('/lecturer/courses').type('form').send({
      department_code: 'EIE',
      courses: ['ELEN4010']
    });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/lecturer/courses?success=true');
  });
});
