/* eslint-env jest */
const request  = require('supertest')
const app      = require('../../app')
const Database = require('better-sqlite3')
const path     = require('path')

const db = new Database(path.join(__dirname, '../../database/database.db'))

beforeAll(() => {
  db.prepare(`
    INSERT OR IGNORE INTO staff
      (staff_number, name, email, department, dept_code, password)
    VALUES ('HP999001', 'HP Lecturer', 'hplecturer@wits.ac.za', 'EIE', 'EIE', 'testpass')
  `).run()

  db.prepare(`
    INSERT OR IGNORE INTO students
      (student_number, name, email, password, degree_code)
    VALUES (8888001, 'HP Student', 'hpstudent@students.wits.ac.za', 'testpass', 'BSCENGINFO')
  `).run()
})

afterAll(() => {
  db.prepare(`DELETE FROM lecturer_availability WHERE staff_number = 'HP999001'`).run()
  db.prepare(`DELETE FROM staff    WHERE staff_number   = 'HP999001'`).run()
  db.prepare(`DELETE FROM students WHERE student_number = 8888001`).run()
  db.close()
})

describe('Homepage — unauthenticated visitor (AC3)', () => {
  test('shows Login and Sign Up buttons', async () => {
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.text).toContain('Log In')
    expect(res.text).toContain('Sign Up')
  })

  test('does not show dashboard link', async () => {
    const res = await request(app).get('/')
    expect(res.text).not.toContain('Go to Dashboard')
  })
})

describe('Homepage — logged-in student (AC1)', () => {
  let agent

  beforeEach(async () => {
    agent = request.agent(app)
    await agent.post('/login').type('form').send({ staffStudentNumber: '8888001', password: 'testpass' })
  })

  test('shows enrolled courses count', async () => {
    const res = await agent.get('/')
    expect(res.status).toBe(200)
    expect(res.text).toContain('Enrolled Courses')
  })

  test('shows Next Consultation stat (None booked when no consultations)', async () => {
    const res = await agent.get('/')
    expect(res.text).toContain('Next Consultation')
    expect(res.text).toContain('None booked')
  })

  test('shows Find a Consultation button', async () => {
    const res = await agent.get('/')
    expect(res.text).toContain('Find a Consultation')
  })

  test('shows Go to Dashboard button', async () => {
    const res = await agent.get('/')
    expect(res.text).toContain('Go to Dashboard')
  })

  test('does not show Login or Sign Up', async () => {
    const res = await agent.get('/')
    expect(res.text).not.toContain('Log In')
    expect(res.text).not.toContain('Sign Up')
  })
})

describe('Homepage — logged-in lecturer without availability (AC2)', () => {
  let agent

  beforeEach(async () => {
    agent = request.agent(app)
    await agent.post('/login').type('form').send({ staffStudentNumber: 'HP999001', password: 'testpass' })
  })

  test('shows Next Consultation stat', async () => {
    const res = await agent.get('/')
    expect(res.status).toBe(200)
    expect(res.text).toContain('Next Consultation')
  })

  test('shows None booked when no consultations', async () => {
    const res = await agent.get('/')
    expect(res.text).toContain('None booked')
  })

  test('shows Set Availability nudge when no availability is set', async () => {
    const res = await agent.get('/')
    expect(res.text).toContain('Set Availability')
  })
})

describe('Homepage — logged-in lecturer with availability (AC2)', () => {
  let agent

  beforeAll(() => {
    db.prepare(`
      INSERT OR IGNORE INTO lecturer_availability
        (staff_number, day_of_week, start_time, end_time, max_booking_min, max_number_of_students, venue)
      VALUES ('HP999001', 'Mon', '09:00', '10:00', 60, 1, 'EIE 101')
    `).run()
  })

  afterAll(() => {
    db.prepare(`DELETE FROM lecturer_availability WHERE staff_number = 'HP999001'`).run()
  })

  beforeEach(async () => {
    agent = request.agent(app)
    await agent.post('/login').type('form').send({ staffStudentNumber: 'HP999001', password: 'testpass' })
  })

  test('shows Go to Dashboard when availability is set', async () => {
    const res = await agent.get('/')
    expect(res.status).toBe(200)
    expect(res.text).toContain('Go to Dashboard')
  })

  test('does not show Set Availability nudge when availability already exists', async () => {
    const res = await agent.get('/')
    expect(res.text).not.toContain('Set your availability so students')
  })
})
