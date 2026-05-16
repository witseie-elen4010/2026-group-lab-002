/* eslint-env jest */
const request = require('supertest');
const app = require('../../app');
const db = require('../../database/db');

const PLAINTEXT_PASSWORD = 'Password01';
const BCRYPT_HASH = '$2b$11$7WRkOLZ9kVYwEmpHg63tNOAF9hvAgTR5LkCDzYTAy1LxEH/Dyv9Ya';

beforeAll(() => {
  db.prepare(`
    INSERT OR IGNORE INTO staff
      (staff_number, name, email, department, dept_code, password, email_verified)
    VALUES
      ('A999001', 'Test Lecturer', 'testlecturer@wits.ac.za', 'EIE', 'EIE', ?, 1)
  `).run(BCRYPT_HASH);

  db.prepare(`INSERT OR IGNORE INTO staff_courses (staff_number, course_code) VALUES ('A999001', 'ELEN4010')`).run();

  db.prepare(`
    INSERT OR IGNORE INTO students
      (student_number, name, email, password, degree_code, email_verified)
    VALUES
      (9999001, 'Test Student', 'teststudent@students.wits.ac.za', ?, 'BSCENGINFO', 1)
  `).run(BCRYPT_HASH);

  db.prepare(`INSERT OR IGNORE INTO enrollments (student_number, course_code) VALUES (9999001, 'ELEN4010')`).run();
});

afterAll(() => {
  db.prepare(`DELETE FROM staff_courses WHERE staff_number   = 'A999001'`).run();
  db.prepare(`DELETE FROM enrollments   WHERE student_number = 9999001`).run();
  db.prepare(`DELETE FROM staff         WHERE staff_number   = 'A999001'`).run();
  db.prepare(`DELETE FROM students      WHERE student_number = 9999001`).run();
});

describe('Login greeting message (Issue #64)', () => {

  test('after login lecturer is redirected to their dashboard', async () => {
    const agent = request.agent(app);
    const res = await agent
      .post('/login')
      .type('form')
      .send({ staffStudentNumber: 'A999001', password: PLAINTEXT_PASSWORD });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/lecturer/dashboard?welcome=1');
  });

  test('after login student is redirected to their dashboard', async () => {
    const agent = request.agent(app);
    const res = await agent
      .post('/login')
      .type('form')
      .send({ staffStudentNumber: '9999001', password: PLAINTEXT_PASSWORD });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/student/dashboard?welcome=1');
  });

  test('lecturer sees role-specific greeting on first dashboard load', async () => {
    const agent = request.agent(app);
    await agent
      .post('/login')
      .type('form')
      .send({ staffStudentNumber: 'A999001', password: PLAINTEXT_PASSWORD });

    const res = await agent.get('/lecturer/dashboard');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Welcome back, Prof. Test Lecturer');
  });

  test('student sees role-specific greeting on first dashboard load', async () => {
    const agent = request.agent(app);
    await agent
      .post('/login')
      .type('form')
      .send({ staffStudentNumber: '9999001', password: PLAINTEXT_PASSWORD });

    const res = await agent.get('/student/dashboard');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Welcome back, Test Student');
    expect(res.text).toContain('upcoming consultations');
  });

  test('greeting does not appear on page refresh', async () => {
    const agent = request.agent(app);
    await agent
      .post('/login')
      .type('form')
      .send({ staffStudentNumber: 'A999001', password: PLAINTEXT_PASSWORD });

    await agent.get('/lecturer/dashboard');
    const secondLoad = await agent.get('/lecturer/dashboard');

    expect(secondLoad.text).not.toContain('Welcome back, Prof.');
  });

  test('greeting includes the user name', async () => {
    const agent = request.agent(app);
    await agent
      .post('/login')
      .type('form')
      .send({ staffStudentNumber: 'A999001', password: PLAINTEXT_PASSWORD });

    const res = await agent.get('/lecturer/dashboard');
    expect(res.text).toContain('Test Lecturer');
  });

  test('greeting does not block core dashboard content', async () => {
    const agent = request.agent(app);
    await agent
      .post('/login')
      .type('form')
      .send({ staffStudentNumber: 'A999001', password: PLAINTEXT_PASSWORD });

    const res = await agent.get('/lecturer/dashboard');
    expect(res.text).toContain("Today's Consultations");
    expect(res.text).toContain('Calendar');
  });

});