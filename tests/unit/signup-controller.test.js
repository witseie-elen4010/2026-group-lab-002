/* eslint-env jest */
const { registerUser } = require('../../src/controllers/signup-controller')

jest.mock('../../database/db', () => ({
  prepare: jest.fn()
}))

jest.mock('../../src/services/logging-service', () => ({
  logActivity: jest.fn().mockResolvedValue(true)
}))

jest.mock('../../src/services/email-service', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined)
}))

const db = require('../../database/db')
const { logActivity } = require('../../src/services/logging-service')

const mockReq = (body = {}) => ({ body })

const mockRes = () => {
  const res = {}
  res.render = jest.fn()
  res.redirect = jest.fn()
  res.status = jest.fn().mockReturnValue({ send: jest.fn() })
  return res
}

beforeEach(() => {
  db.prepare.mockReset()
  logActivity.mockClear()
})

describe('email domain validation', () => {
  test('accepts student email ending in @students.wits.ac.za', async () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(undefined) }) // student_number check
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(undefined) }) // email check
      .mockReturnValueOnce({ run: jest.fn() })                            // INSERT
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })      // staff check in _issueVerificationCode
      .mockReturnValueOnce({ run: jest.fn() })                            // UPDATE students token

    const req = mockReq({
      fullName: 'Test Student',
      number: '1234567',
      email: 'student@students.wits.ac.za',
      password: 'pass',
      confirmPassword: 'pass'
    })
    req.session = {}

    const res = mockRes()
    await registerUser(req, res)

    expect(req.session.userId).toBeUndefined()
    expect(res.redirect).toHaveBeenCalledWith(
      '/verify-email?email=student%40students.wits.ac.za'
    )
  })

  test('accepts lecturer email ending in @wits.ac.za', async () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(undefined) }) // staff_number check
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(undefined) }) // email check
      .mockReturnValueOnce({ run: jest.fn() })                            // INSERT
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ staff_number: 'A000999' }) }) // staff check in _issueVerificationCode
      .mockReturnValueOnce({ run: jest.fn() })                            // UPDATE staff token

    const req = mockReq({
      fullName: 'Test Lecturer',
      number: 'A000999',
      email: 'lecturer@wits.ac.za',
      password: 'pass',
      confirmPassword: 'pass'
    })
    req.session = {}

    const res = mockRes()
    await registerUser(req, res)

    expect(req.session.userId).toBeUndefined()
    expect(res.redirect).toHaveBeenCalledWith(
      '/verify-email?email=lecturer%40wits.ac.za'
    )
  })

  test('rejects student email not ending in @students.wits.ac.za', async () => {
    const req = mockReq({
      fullName: 'Test Student',
      number: '1234567',
      email: 'student@gmail.com',
      password: 'pass',
      confirmPassword: 'pass'
    })

    req.session = {}

    const res = mockRes()

    await registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      {
        message: null,
        error: 'Registration error: Use Wits email address ending in @students.wits.ac.za.',
        redirectTo: null,
        fullName: 'Test Student',
        number: '1234567',
        email: 'student@gmail.com'
      }
    )

    expect(db.prepare).not.toHaveBeenCalled()
  })

  test('rejects lecturer email not ending in @wits.ac.za', async () => {
    const req = mockReq({
      fullName: 'Test Lecturer',
      number: 'A000999',
      email: 'lecturer@gmail.com',
      password: 'pass',
      confirmPassword: 'pass'
    })

    req.session = {}

    const res = mockRes()

    await registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      {
        message: null,
        error: 'Registration error: Use Wits email address ending in @wits.ac.za.',
        redirectTo: null,
        fullName: 'Test Lecturer',
        number: 'A000999',
        email: 'lecturer@gmail.com'
      }
    )

    expect(db.prepare).not.toHaveBeenCalled()
  })

  test('rejects student email using @wits.ac.za instead of @students.wits.ac.za', async () => {
    const req = mockReq({
      fullName: 'Test Student',
      number: '1234567',
      email: 'student@wits.ac.za',
      password: 'pass',
      confirmPassword: 'pass'
    })

    req.session = {}

    const res = mockRes()

    await registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      {
        message: null,
        error: 'Registration error: Wrong email type: students must use @students.wits.ac.za, not a staff email.',
        redirectTo: null,
        fullName: 'Test Student',
        number: '1234567',
        email: 'student@wits.ac.za'
      }
    )

    expect(db.prepare).not.toHaveBeenCalled()
  })

  test('rejects lecturer email using @students.wits.ac.za instead of @wits.ac.za', async () => {
    const req = mockReq({
      fullName: 'Test Lecturer',
      number: 'A000999',
      email: 'lecturer@students.wits.ac.za',
      password: 'pass',
      confirmPassword: 'pass'
    })

    req.session = {}

    const res = mockRes()

    await registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      {
        message: null,
        error: 'Registration error: Wrong email type: lecturers must use @wits.ac.za, not a student email.',
        redirectTo: null,
        fullName: 'Test Lecturer',
        number: 'A000999',
        email: 'lecturer@students.wits.ac.za'
      }
    )

    expect(db.prepare).not.toHaveBeenCalled()
  })
})
