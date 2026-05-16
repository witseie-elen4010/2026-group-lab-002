/* eslint-env jest */
const request = require('supertest')
const crypto = require('crypto')
const app = require('../../app')
const db = require('../../database/db')

jest.mock('../../src/services/email-service', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendLoginWarningEmail: jest.fn().mockResolvedValue(undefined)
}))

const hash = (code) => crypto.createHash('sha256').update(code).digest('hex')

const TEST_EMAIL = 'verify.test@students.wits.ac.za'
const TEST_NUMBER = 9000001

const cleanup = () => {
  db.prepare('DELETE FROM students WHERE student_number = ?').run(TEST_NUMBER)
}

beforeAll(cleanup)
afterAll(cleanup)

const insertUnverified = (token = null, expiry = null, resendCount = 0) => {
  db.prepare(`
    INSERT OR REPLACE INTO students
      (student_number, name, email, password, degree_code, email_verified, verification_token, token_expiry, resend_count)
    VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)
  `).run(TEST_NUMBER, 'Verify Test', TEST_EMAIL, 'pass', 'BSCENGINFO', token, expiry, resendCount)
}

const futureExpiry = () => new Date(Date.now() + 10 * 60 * 1000).toISOString()

describe('POST /verify-email', () => {
  test('correct code sets email_verified = 1 and redirects to login', async () => {
    const code = '482910'
    insertUnverified(hash(code), futureExpiry())

    const res = await request(app)
      .post('/verify-email')
      .type('form')
      .send({ email: TEST_EMAIL, code })

    expect(res.status).toBe(302)
    expect(res.headers.location).toContain('/login')
    expect(res.headers.location).toContain('verified')

    const row = db.prepare('SELECT email_verified FROM students WHERE student_number = ?').get(TEST_NUMBER)
    expect(row.email_verified).toBe(1)
  })

  test('incorrect code renders verify page with error', async () => {
    insertUnverified(hash('111111'), futureExpiry())

    const res = await request(app)
      .post('/verify-email')
      .type('form')
      .send({ email: TEST_EMAIL, code: '999999' })

    expect(res.status).toBe(200)
    expect(res.text).toContain('Incorrect verification code')
  })

  test('expired token renders verify page with expiry error', async () => {
    const expired = new Date(Date.now() - 1000).toISOString()
    insertUnverified(hash('123456'), expired)

    const res = await request(app)
      .post('/verify-email')
      .type('form')
      .send({ email: TEST_EMAIL, code: '123456' })

    expect(res.status).toBe(200)
    expect(res.text).toContain('expired')
  })
})

describe('POST /verify-email/resend', () => {
  test('increments resend_count when count < 3 and returns success message', async () => {
    insertUnverified(null, null, 0)

    const res = await request(app)
      .post('/verify-email/resend')
      .type('form')
      .send({ email: TEST_EMAIL })

    expect(res.status).toBe(200)
    expect(res.text).toContain('new code has been sent')

    const row = db.prepare('SELECT resend_count FROM students WHERE student_number = ?').get(TEST_NUMBER)
    expect(row.resend_count).toBe(1)
  })

  test('returns max attempts error when resend_count >= 3', async () => {
    insertUnverified(null, null, 3)

    const res = await request(app)
      .post('/verify-email/resend')
      .type('form')
      .send({ email: TEST_EMAIL })

    expect(res.status).toBe(200)
    expect(res.text).toContain('Maximum resend attempts')
  })
})

describe('POST /login — email_verified guard', () => {
  test('unverified account is denied login with correct password', async () => {
    insertUnverified()

    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ staffStudentNumber: String(TEST_NUMBER), password: 'pass' })

    expect(res.status).toBe(200)
    expect(res.text).toContain('has not been verified')
  })

  test('verified account with correct password redirects to dashboard', async () => {
    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ staffStudentNumber: '1234567', password: 'pass' })

    expect(res.status).toBe(302)
    expect(res.headers.location).toContain('/student/dashboard')
  })
})
