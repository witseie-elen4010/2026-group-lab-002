/* eslint-env jest */
const { registerUser } = require('../../src/controllers/signup-controller')

jest.mock('../../database/db', () => ({
  prepare: jest.fn()
}))

jest.mock('../../src/services/logging-service', () => ({
  logActivity: jest.fn().mockResolvedValue(true)
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword123')
}))
jest.mock('../../src/services/email-service', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendLoginWarningEmail: jest.fn().mockResolvedValue(undefined)
}))

const db = require('../../database/db')
const bcrypt = require('bcryptjs') 

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
  jest.clearAllMocks() 
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
      password: 'Password01',
      confirmPassword: 'Password01'
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
      password: 'Password01',
      confirmPassword: 'Password01'
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

describe('Password Validation & Hashing', () => {
  test('hashes the password with exactly 11 salt rounds before saving to database', async () => {
    const runMock = jest.fn()
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(undefined) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(undefined) })
      .mockReturnValueOnce({ run: runMock })

    const req = mockReq({
      fullName: 'Test Student',
      number: '1234567',
      email: 'student@students.wits.ac.za',
      password: 'ValidPassword01',
      confirmPassword: 'ValidPassword01'
    })
    const res = mockRes()
    req.session = {}

    await registerUser(req, res)

    expect(bcrypt.hash).toHaveBeenCalledTimes(1)
    expect(bcrypt.hash).toHaveBeenCalledWith('ValidPassword01', 11)
    
    expect(runMock).toHaveBeenCalledWith(
      1234567, 
      'Test Student', 
      'student@students.wits.ac.za', 
      'hashedPassword123', 
      'BSCENGINFO'
    )
  })

  test('rejects registration and renders error if password is empty', async () => {
    const req = mockReq({ 
      fullName: 'Test Student', number: '1234567', email: 'student@students.wits.ac.za',
      password: '', confirmPassword: '' 
    })
    const res = mockRes()
    req.session = {}

    await registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith('sign-up', expect.objectContaining({
      error: expect.stringContaining("Not your password, it seems")
    }))
    expect(bcrypt.hash).not.toHaveBeenCalled()
  })

  test('rejects registration if password does not meet criteria (missing number)', async () => {
    const req = mockReq({ 
      fullName: 'Test Student', number: '1234567', email: 'student@students.wits.ac.za',
      password: 'InvalidPassword', confirmPassword: 'InvalidPassword' 
    })
    const res = mockRes()
    req.session = {}

    await registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith('sign-up', expect.objectContaining({
      error: expect.stringContaining("Password must be at least 8 characters long")
    }))
    expect(bcrypt.hash).not.toHaveBeenCalled()
  })

  test('rejects registration if password does not meet criteria (missing uppercase)', async () => {
    const req = mockReq({ 
      fullName: 'Test Student', number: '1234567', email: 'student@students.wits.ac.za',
      password: 'invalidpassword01', confirmPassword: 'invalidpassword01' 
    })
    const res = mockRes()
    req.session = {}

    await registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith('sign-up', expect.objectContaining({
      error: expect.stringContaining("contain one uppercase letter")
    }))
    expect(bcrypt.hash).not.toHaveBeenCalled()
  })

  test('rejects registration if passwords do not match', async () => {
    const req = mockReq({ 
      fullName: 'Test Student', number: '1234567', email: 'student@students.wits.ac.za',
      password: 'ValidPassword01', confirmPassword: 'ValidPassword02' 
    })
    const res = mockRes()
    req.session = {}

    await registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith('sign-up', expect.objectContaining({
      error: expect.stringContaining("Passwords do not match")
    }))
    expect(bcrypt.hash).not.toHaveBeenCalled()
  })
})