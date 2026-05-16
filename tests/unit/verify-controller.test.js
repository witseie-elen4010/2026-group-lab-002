/* eslint-env jest */
const crypto = require('crypto')

jest.mock('../../database/db', () => ({ prepare: jest.fn() }))
jest.mock('../../src/services/email-service', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined)
}))

const { verifyEmail, resendCode } = require('../../src/controllers/verify-controller')
const db = require('../../database/db')
const { sendVerificationEmail } = require('../../src/services/email-service')

const hash = (code) => crypto.createHash('sha256').update(code).digest('hex')

const mockRes = () => {
  const res = {}
  res.render = jest.fn()
  res.redirect = jest.fn()
  return res
}

const mockReq = (body = {}) => ({ body })

const futureExpiry = () => new Date(Date.now() + 10 * 60 * 1000).toISOString()
const pastExpiry = () => new Date(Date.now() - 1000).toISOString()

beforeEach(() => {
  db.prepare.mockReset()
  sendVerificationEmail.mockClear()
})

describe('POST /verify-email', () => {
  test('correct code marks account verified and redirects to login', () => {
    const code = '482910'
    const fakeUser = {
      student_number: 9876543,
      email: 'test@students.wits.ac.za',
      email_verified: 0,
      verification_token: hash(code),
      token_expiry: futureExpiry(),
    }

    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(fakeUser) }) // students lookup
      .mockReturnValueOnce({ run: jest.fn() })                           // UPDATE verified

    const req = mockReq({ email: 'test@students.wits.ac.za', code })
    const res = mockRes()

    verifyEmail(req, res)

    expect(res.redirect).toHaveBeenCalledWith(
      '/login?success=Email+verified+successfully.+You+may+now+log+in.'
    )
  })

  test('incorrect code renders error', () => {
    const fakeUser = {
      student_number: 9876543,
      email: 'test@students.wits.ac.za',
      email_verified: 0,
      verification_token: hash('111111'),
      token_expiry: futureExpiry(),
    }

    db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue(fakeUser) })

    const req = mockReq({ email: 'test@students.wits.ac.za', code: '999999' })
    const res = mockRes()

    verifyEmail(req, res)

    expect(res.render).toHaveBeenCalledWith('verify-email', expect.objectContaining({
      error: 'Incorrect verification code. Please try again.',
    }))
  })

  test('expired token renders expiry error', () => {
    const code = '123456'
    const fakeUser = {
      student_number: 9876543,
      email: 'test@students.wits.ac.za',
      email_verified: 0,
      verification_token: hash(code),
      token_expiry: pastExpiry(),
    }

    db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue(fakeUser) })

    const req = mockReq({ email: 'test@students.wits.ac.za', code })
    const res = mockRes()

    verifyEmail(req, res)

    expect(res.render).toHaveBeenCalledWith('verify-email', expect.objectContaining({
      error: 'Your verification code has expired. Please request a new one.',
    }))
  })

  test('unknown email renders error', () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) }) // students
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) }) // staff

    const req = mockReq({ email: 'nobody@students.wits.ac.za', code: '000000' })
    const res = mockRes()

    verifyEmail(req, res)

    expect(res.render).toHaveBeenCalledWith('verify-email', expect.objectContaining({
      error: 'No account found for this email address.',
    }))
  })

  test('already verified redirects to login', () => {
    const fakeUser = {
      student_number: 9876543,
      email_verified: 1,
      verification_token: null,
      token_expiry: null,
    }

    db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue(fakeUser) })

    const req = mockReq({ email: 'test@students.wits.ac.za', code: '123456' })
    const res = mockRes()

    verifyEmail(req, res)

    expect(res.redirect).toHaveBeenCalledWith('/login?success=Email+already+verified.+Please+log+in.')
  })
})

describe('POST /verify-email/resend', () => {
  test('increments resend_count and returns success message when count < 3', async () => {
    const fakeUser = {
      student_number: 9876543,
      email: 'test@students.wits.ac.za',
      email_verified: 0,
      resend_count: 1,
    }

    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(fakeUser) }) // students lookup
      .mockReturnValueOnce({ run: jest.fn() })                           // UPDATE token

    const req = mockReq({ email: 'test@students.wits.ac.za' })
    const res = mockRes()

    await resendCode(req, res)

    expect(sendVerificationEmail).toHaveBeenCalledWith('test@students.wits.ac.za', expect.any(String))
    expect(res.render).toHaveBeenCalledWith('verify-email', expect.objectContaining({
      message: 'A new code has been sent to your email.',
      error: null,
    }))
  })

  test('returns max attempts error when resend_count >= 3', async () => {
    const fakeUser = {
      student_number: 9876543,
      email_verified: 0,
      resend_count: 3,
    }

    db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue(fakeUser) })

    const req = mockReq({ email: 'test@students.wits.ac.za' })
    const res = mockRes()

    await resendCode(req, res)

    expect(sendVerificationEmail).not.toHaveBeenCalled()
    expect(res.render).toHaveBeenCalledWith('verify-email', expect.objectContaining({
      error: 'Maximum resend attempts reached. Please contact support.',
    }))
  })
})
