/* eslint-env jest */
const { registerUser } = require('../../src/controllers/signup-controller')

jest.mock('../../database/db', () => ({ prepare: jest.fn() }))

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
  test('accepts student email ending in @students.wits.ac.za', () => {
    db.prepare.mockReturnValue({ run: jest.fn() })

    const req = mockReq({
      fullName: 'Test Student',
      number: '1234567',
      email: 'student@students.wits.ac.za',
      password: 'pass',
      confirmPassword: 'pass'
    })

    const res = mockRes()
    registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      expect.objectContaining({
        message: 'Account created! Redirecting you to select your courses...',
        error: null,
        redirectTo: '/student/courses'
      })
    )
  })

  test('accepts lecturer email ending in @wits.ac.za', () => {
    db.prepare.mockReturnValue({ run: jest.fn() })

    const req = mockReq({
      fullName: 'Test Lecturer',
      number: 'A000999',
      email: 'lecturer@wits.ac.za',
      password: 'pass',
      confirmPassword: 'pass'
    })

    const res = mockRes()
    registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      expect.objectContaining({
        message: 'Account created! Redirecting you to select your courses...',
        error: null,
        redirectTo: '/lecturer/courses'
      })
    )
  })

  test('rejects student email not ending in @students.wits.ac.za', () => {
    const req = mockReq({
      fullName: 'Test Student',
      number: '1234567',
      email: 'student@gmail.com',
      password: 'pass',
      confirmPassword: 'pass'
    })

    const res = mockRes()
    registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith('sign-up', {
      message: null,
      error: 'Please use your Wits email address.'
    })

    expect(db.prepare).not.toHaveBeenCalled()
  })

  test('rejects lecturer email not ending in @wits.ac.za', () => {
    const req = mockReq({
      fullName: 'Test Lecturer',
      number: 'A000999',
      email: 'lecturer@gmail.com',
      password: 'pass',
      confirmPassword: 'pass'
    })

    const res = mockRes()
    registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith('sign-up', {
      message: null,
      error: 'Please use your Wits email address.'
    })

    expect(db.prepare).not.toHaveBeenCalled()
  })

  test('rejects student email using @wits.ac.za instead of @students.wits.ac.za', () => {
    const req = mockReq({
      fullName: 'Test Student',
      number: '1234567',
      email: 'student@wits.ac.za',
      password: 'pass',
      confirmPassword: 'pass'
    })

    const res = mockRes()
    registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith('sign-up', {
      message: null,
      error: 'Please use your Wits email address.'
    })
  })
})
