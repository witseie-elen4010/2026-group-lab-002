/* eslint-env jest */
const { registerUser } = require('../../src/controllers/signup-controller')

jest.mock('../../database/db', () => ({
  prepare: jest.fn()
}))

jest.mock('../../src/services/logging-service', () => ({
  logActivity: jest.fn().mockResolvedValue(true)
}))

// NEW: Mock bcrypt so the tests don't try to actually hash passwords
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword123')
}))

const db = require('../../database/db')

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
})

describe('email domain validation', () => {
  test('accepts student email ending in @students.wits.ac.za', async () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(undefined) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(undefined) })
      .mockReturnValueOnce({ run: jest.fn() })

    const req = mockReq({
      fullName: 'Test Student',
      number: '1234567',
      email: 'student@students.wits.ac.za',
      password: 'Password01',
      confirmPassword: 'Password01'
    })

    req.session = {}
    const res = mockRes()

    await registerUser(req, res)

    expect(req.session.userId).toBe(1234567)
    expect(req.session.userName).toBe('Test Student')
    expect(req.session.userRole).toBe('student')
    expect(req.session.showWelcome).toBe(true)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      {
        message: 'Account created! Redirecting you to select your courses...',
        error: null,
        redirectTo: '/student/courses',
        fullName: '',
        number: '',
        email: '' // Removed password & confirmPassword expectations here
      }
    )
  })

  test('accepts lecturer email ending in @wits.ac.za', async () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(undefined) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(undefined) })
      .mockReturnValueOnce({ run: jest.fn() })

    const req = mockReq({
      fullName: 'Test Lecturer',
      number: 'A000999',
      email: 'lecturer@wits.ac.za',
      password: 'Password01',
      confirmPassword: 'Password01'
    })

    req.session = {}
    const res = mockRes()

    await registerUser(req, res)

    expect(req.session.userId).toBe('A000999')
    expect(req.session.userName).toBe('Test Lecturer')
    expect(req.session.userRole).toBe('lecturer')
    expect(req.session.showWelcome).toBe(true)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      {
        message: 'Account created! Redirecting you to select your courses...',
        error: null,
        redirectTo: '/lecturer/courses',
        fullName: '',
        number: '',
        email: ''
      }
    )
  })

  test('rejects student email not ending in @students.wits.ac.za', async () => {
    const req = mockReq({
      fullName: 'Test Student',
      number: '1234567',
      email: 'student@gmail.com',
      password: 'Password01',
      confirmPassword: 'Password01'
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
      password: 'Password01',
      confirmPassword: 'Password01'
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
      password: 'Password01',
      confirmPassword: 'Password01'
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
      password: 'Password01',
      confirmPassword: 'Password01'
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
