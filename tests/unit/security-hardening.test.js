const request = require('supertest');
const app = require('../../app'); 

test('responds with 404 and custom knock-knock message for unknown routes', async () => {
  const res = await request(app).get('/this-route-definitely-does-not-exist-123');
  
  expect(res.status).toBe(404);
  expect(res.text).toContain("Knock, knock!");
  expect(res.text).toContain("We couldn't find the page");
});

test('prevents access after logout by clearing session and setting Cache-Control headers', async () => {
  const agent = request.agent(app);

  await agent.post('/login').type('form').send({ staffStudentNumber: '1234567', password: 'Password01' });

  const dashboardRes = await agent.get('/student/dashboard');
  expect(dashboardRes.status).toBe(200);
  expect(dashboardRes.headers['cache-control']).toContain('no-store');
  expect(dashboardRes.headers['cache-control']).toContain('no-cache');

  const logoutRes = await agent.post('/logout');
  expect(logoutRes.status).toBe(302); 
  
  const backButtonRes = await agent.get('/student/dashboard');
  
  expect(backButtonRes.status).toBe(302);
  expect(backButtonRes.headers.location).toBe('/login');
});