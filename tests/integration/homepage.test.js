/* eslint-env jest */
const request = require('supertest')
const app = require('../../app')
const db = require('../../database/db')

const CORRECT_PASSWORD = 'Password01'
const BCRYPT_HASH = '$2b$11$7WRkOLZ9kVYwEmpHg63tNOAF9hvAgTR5LkCDzYTAy1LxEH/Dyv9Ya'

beforeAll(() => {
  db.prepare(`
    INSERT OR IGNORE INTO staff
      (staff_number, name, email, department, dept_code, password, email_verified)
    VALUES ('HP999001', 'HP Lecturer', 'hplecturer@wits.ac.za', 'EIE', 'EIE', ?, 1)
  `).run(BCRYPT_HASH)

  db.prepare(`
    INSERT OR IGNORE INTO students
      (student_number, name, email, password, degree_code, email_verified)
    VALUES (8888001, 'HP Student', 'hpstudent@students.wits.ac.za', ?, 'BSCENGINFO', 1)
  `).run(BCRYPT_HASH)
})

afterAll(() => {
  db.prepare(`DELETE FROM lecturer_availability WHERE staff_number = 'HP999001'`).run()
  db.prepare(`DELETE FROM staff    WHERE staff_number   = 'HP999001'`).run()
  db.prepare(`DELETE FROM students WHERE student_number = 8888001`).run()
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
    await agent.post('/login').type('form').send({ staffStudentNumber: '8888001', password: CORRECT_PASSWORD })
  })

  test('shows how-it-works section', async () => {
    const res = await agent.get('/')
    expect(res.status).toBe(200)
    expect(res.text).toContain('How it works')
  })

  test('links Go to Dashboard to the student dashboard', async () => {
    const res = await agent.get('/')
    expect(res.text).toContain('href="/student/dashboard"')
  })

  test('shows hero tagline', async () => {
    const res = await agent.get('/')
    expect(res.text).toContain('Your next consultation.')
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
    await agent.post('/login').type('form').send({ staffStudentNumber: 'HP999001', password: CORRECT_PASSWORD })
  })

  test('shows Go to Dashboard button', async () => {
    const res = await agent.get('/')
    expect(res.status).toBe(200)
    expect(res.text).toContain('Go to Dashboard')
  })

  test('links Go to Dashboard to the lecturer dashboard', async () => {
    const res = await agent.get('/')
    expect(res.text).toContain('href="/lecturer/dashboard"')
  })

  test('does not show Log In or Sign Up', async () => {
    const res = await agent.get('/')
    expect(res.text).not.toContain('Log In')
    expect(res.text).not.toContain('Sign Up')
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
    await agent.post('/login').type('form').send({ staffStudentNumber: 'HP999001', password: CORRECT_PASSWORD })
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