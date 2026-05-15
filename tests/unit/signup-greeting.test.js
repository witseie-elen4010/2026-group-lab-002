/* eslint-env jest */
const mockPrepare = jest.fn()

// 1. MOCK THE DATABASE
jest.mock('../../database/db', () => ({
  prepare: mockPrepare
}))

// 2. MOCK THE LOGGING SERVICE (The missing piece that stopped the crash!)
jest.mock('../../src/services/logging-service', () => ({
  logActivity: jest.fn().mockResolvedValue(true)
}))

const { registerUser } = require('../../src/controllers/signup-controller')

const mockReq = (body = {}) => ({ body })

const mockRes = () => {
  const res = {}
  res.render = jest.fn()
  res.redirect = jest.fn()
  res.status = jest.fn().mockReturnValue({ send: jest.fn() })
  return res
}

beforeEach(() => {
  mockPrepare.mockReset()
})

describe('Sign Up greeting validation', () => {
  // 3. Added async
  test('student signup shows success greeting', async () => {
    mockPrepare
      .mockReturnValueOnce({
        get: jest.fn().mockReturnValue(undefined)
      })
      .mockReturnValueOnce({
        get: jest.fn().mockReturnValue(undefined)
      })
      .mockReturnValueOnce({
        run: jest.fn() // No lastInsertRowid needed here!
      })

    const req = mockReq({
      fullName: 'Test Student',
      number: '2468101',
      email: 'student@students.wits.ac.za',
      password: 'pass',
      confirmPassword: 'pass'
    })

    req.session = {}
    const res = mockRes()

    // 4. Added await
    await registerUser(req, res)

    expect(req.session.userId).toBe(2468101)
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
        email: ''
      }
    )
  })

  // 3. Added async
  test('lecturer signup shows success greeting', async () => {
    mockPrepare
      .mockReturnValueOnce({
        get: jest.fn().mockReturnValue(undefined)
      })
      .mockReturnValueOnce({
        get: jest.fn().mockReturnValue(undefined)
      })
      .mockReturnValueOnce({
        run: jest.fn() // No lastInsertRowid needed here!
      })

    const req = mockReq({
      fullName: 'Test Lecturer',
      number: 'A000999',
      email: 'lecturer@wits.ac.za',
      password: 'pass',
      confirmPassword: 'pass'
    })

    req.session = {}
    const res = mockRes()

    // 4. Added await
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
})
