/* eslint-env jest */
const request = require('supertest');
const app = require('../../app');

const adminAgent = () => {
  const agent = request.agent(app);
  return agent
    .post('/login')
    .type('form')
    .send({ staffStudentNumber: 'ADMIN001', password: 'admin' })
    .then(() => agent);
};

describe('GET /admin/activity-log', () => {
  test('redirects to /login when not authenticated', async () => {
    const res = await request(app).get('/admin/activity-log');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/login');
  });

  test('returns 403 when authenticated as a student', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: '1234567', password: 'pass' });
    const res = await agent.get('/admin/activity-log');
    expect(res.status).toBe(403);
  });

  test('returns 403 when authenticated as a lecturer', async () => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ staffStudentNumber: 'A000356', password: 'pass' });
    const res = await agent.get('/admin/activity-log');
    expect(res.status).toBe(403);
  });

  test('renders the Activity Log page with correct heading for admin', async () => {
    const agent = await adminAgent();
    const res = await agent.get('/admin/activity-log');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Activity Log');
  });

  test('page includes column headers: User, Role, Event, Category, Status', async () => {
    const agent = await adminAgent();
    const res = await agent.get('/admin/activity-log');
    expect(res.status).toBe(200);
    expect(res.text).toContain('User');
    expect(res.text).toContain('Role');
    expect(res.text).toContain('Event');
    expect(res.text).toContain('Category');
    expect(res.text).toContain('Status');
  });

  test('page includes a View button when log entries exist', async () => {
    const agent = await adminAgent();
    const res = await agent.get('/admin/activity-log');
    expect(res.status).toBe(200);
    if (res.text.includes('No activity log entries')) return;
    expect(res.text).toContain('View');
  });

  test('page includes category filter buttons', async () => {
    const agent = await adminAgent();
    const res = await agent.get('/admin/activity-log');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Auth');
    expect(res.text).toContain('Booking');
    expect(res.text).toContain('Availability');
  });

  test('page shows empty state message when no entries match', async () => {
    const agent = await adminAgent();
    const res = await agent.get('/admin/activity-log?search=zzznomatch999');
    expect(res.status).toBe(200);
    expect(res.text).toContain('No activity log entries found');
  });

  test('search parameter is reflected in the search input', async () => {
    const agent = await adminAgent();
    const res = await agent.get('/admin/activity-log?search=login');
    expect(res.status).toBe(200);
    expect(res.text).toContain('login');
  });

  test('category filter parameter is applied without error', async () => {
    const agent = await adminAgent();
    const res = await agent.get('/admin/activity-log?category=Auth');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Activity Log');
  });

  test('activity_log table remains accessible as a read-only raw table', async () => {
    const agent = await adminAgent();
    const res = await agent.get('/admin/table/activity_log');
    expect(res.status).toBe(200);
  });

  test('POST to create a record in activity_log is blocked as read-only', async () => {
    const agent = await adminAgent();
    const res = await agent.post('/admin/table/activity_log/create').type('form').send({});
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('error=This+table+is+read-only');
  });

  test('POST to create a record in affected_records is blocked as read-only', async () => {
    const agent = await adminAgent();
    const res = await agent.post('/admin/table/affected_records/create').type('form').send({});
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('error=This+table+is+read-only');
  });

  test('POST to create a record in actions is blocked as read-only', async () => {
    const agent = await adminAgent();
    const res = await agent.post('/admin/table/actions/create').type('form').send({});
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('error=This+table+is+read-only');
  });
});
