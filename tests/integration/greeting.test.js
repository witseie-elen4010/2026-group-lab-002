/* eslint-env jest */
const request = require('supertest');
const app = require('../../app');

describe('Login greeting message (Issue #64)', () => {

  test('lecturer sees role-specific greeting on first dashboard load', async () => {
    const agent = request.agent(app);
    await agent
      .post('/login')
      .type('form')
      .send({ staffStudentNumber: 'A000356', password: 'pass' });

    const res = await agent.get('/lecturer/dashboard');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Welcome back, Prof.');
  });

  test('student sees role-specific greeting on first dashboard load', async () => {
    const agent = request.agent(app);
    await agent
      .post('/login')
      .type('form')
      .send({ staffStudentNumber: '1234567', password: 'pass' });

    const res = await agent.get('/student/dashboard');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Welcome back,');
    expect(res.text).toContain('upcoming consultations');
  });

  test('greeting does not appear on page refresh', async () => {
    const agent = request.agent(app);
    await agent
      .post('/login')
      .type('form')
      .send({ staffStudentNumber: 'A000356', password: 'pass' });

    await agent.get('/lecturer/dashboard');
    const secondLoad = await agent.get('/lecturer/dashboard');

    expect(secondLoad.text).not.toContain('Welcome back, Prof.');
  });

  test('greeting includes the user name', async () => {
    const agent = request.agent(app);
    await agent
      .post('/login')
      .type('form')
      .send({ staffStudentNumber: 'A000356', password: 'pass' });

    const res = await agent.get('/lecturer/dashboard');
    expect(res.text).toContain('Clark Kent');
  });

});