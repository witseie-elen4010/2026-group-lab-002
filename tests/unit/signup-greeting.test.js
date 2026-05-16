/* eslint-env jest */
const mockPrepare = jest.fn()

jest.mock('../../database/db', () => ({
  prepare: mockPrepare
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

describe('Sign Up — redirects to verify-email after account creation', () => {
  test('student signup redirects to verify-email page', async () => {
    mockPrepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(undefined) }) // check student_number
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(undefined) }) // check email
      .mockReturnValueOnce({ run: jest.fn() })                            // INSERT student
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })      // SELECT 1 FROM staff (not staff)
      .mockReturnValueOnce({ run: jest.fn() })                            // UPDATE students token

    const req = mockReq({
      fullName: 'Test Student',
      number: '2468101',
      email: 'student@students.wits.ac.za',
      password: 'Password01',
      confirmPassword: 'Password01'
    })

    req.session = {}
    const res = mockRes()

    await registerUser(req, res)

    expect(res.redirect).toHaveBeenCalledWith(
      '/verify-email?email=student%40students.wits.ac.za'
    )
    expect(res.render).not.toHaveBeenCalled()
  })

  test('lecturer signup redirects to verify-email page', async () => {
    mockPrepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(undefined) })               // check staff_number
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(undefined) })               // check email
      .mockReturnValueOnce({ run: jest.fn() })                                          // INSERT staff
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ staff_number: 'A000999' }) }) // SELECT 1 FROM staff (found)
      .mockReturnValueOnce({ run: jest.fn() })                                          // UPDATE staff token

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

    expect(res.redirect).toHaveBeenCalledWith(
      '/verify-email?email=lecturer%40wits.ac.za'
    )
    expect(res.render).not.toHaveBeenCalled()
  })
})
