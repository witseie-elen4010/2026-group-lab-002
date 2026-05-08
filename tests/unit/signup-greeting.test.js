const mockPrepare = jest.fn()

jest.mock('../../database/db', () => ({
  prepare: mockPrepare
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
  test('student signup shows success greeting', () => {
    mockPrepare.mockReturnValue({ run: jest.fn() })

    const req = mockReq({
      fullName: 'Test Student',
      number: '2468101',
      email: 'student@students.wits.ac.za',
      password: 'pass',
      confirmPassword: 'pass'
    })
    req.session = {}

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

  test('lecturer signup shows success greeting', () => {
    mockPrepare.mockReturnValue({ run: jest.fn() })

    const req = mockReq({
      fullName: 'Test Lecturer',
      number: 'A000999',
      email: 'lecturer@wits.ac.za',
      password: 'pass',
      confirmPassword: 'pass'
    })
    req.session = {}

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
})
