/* eslint-env jest */
const crypto = require('crypto')
const bcryptjs = require('bcryptjs')

jest.mock('../../database/db', () => ({ prepare: jest.fn() }))
jest.mock('../../src/services/email-service', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined)
}))

const db = require('../../database/db')
const { sendPasswordResetEmail } = require('../../src/services/email-service')

const {
  showForgotPassword,
  requestPasswordReset,
  showResetPassword,
  resetPassword
} = require('../../src/controllers/password-reset-controller')

const mockReq = (overrides = {}) => ({ body: {}, query: {}, ...overrides })
const mockRes = () => { const r = {}; r.render = jest.fn(); r.redirect = jest.fn(); return r }

const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex')

const VALID_TOKEN = 'a'.repeat(64)
const VALID_HASH = hashToken(VALID_TOKEN)
const FUTURE_EXPIRY = new Date(Date.now() + 60 * 60 * 1000).toISOString()
const PAST_EXPIRY = new Date(Date.now() - 1000).toISOString()

const fakeStudent = {
  student_number: 2434427,
  email: 'aditya@students.wits.ac.za',
  reset_token: VALID_HASH,
  reset_token_expiry: FUTURE_EXPIRY
}

beforeEach(() => {
  db.prepare.mockReset()
  sendPasswordResetEmail.mockClear()
})

describe('showForgotPassword', () => {
  test('renders forgot-password with sent=false', () => {
    const res = mockRes()
    showForgotPassword(mockReq(), res)
    expect(res.render).toHaveBeenCalledWith('forgot-password', { sent: false, error: null })
  })
})

describe('requestPasswordReset', () => {
  test('sends email and shows sent=true when student number matches', async () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(fakeStudent) }) // SELECT students by identifier
      .mockReturnValueOnce({ run: jest.fn() })                              // UPDATE reset_token

    const req = mockReq({ body: { identifier: String(fakeStudent.student_number) } })
    const res = mockRes()
    await requestPasswordReset(req, res)

    expect(sendPasswordResetEmail).toHaveBeenCalledWith(fakeStudent.email, expect.stringContaining('/reset-password?token='))
    expect(res.render).toHaveBeenCalledWith('forgot-password', { sent: true, error: null })
  })

  test('still shows sent=true when identifier is not found (no enumeration)', async () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) }) // students
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) }) // staff

    const req = mockReq({ body: { identifier: '9999999' } })
    const res = mockRes()
    await requestPasswordReset(req, res)

    expect(sendPasswordResetEmail).not.toHaveBeenCalled()
    expect(res.render).toHaveBeenCalledWith('forgot-password', { sent: true, error: null })
  })
})

describe('showResetPassword', () => {
  test('redirects to /forgot-password when token or email missing', () => {
    const res = mockRes()
    showResetPassword(mockReq({ query: {} }), res)
    expect(res.redirect).toHaveBeenCalledWith('/forgot-password')
  })

  test('renders error when token does not match stored hash', () => {
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue({ ...fakeStudent, reset_token: 'differenthash' }) })

    const res = mockRes()
    showResetPassword(mockReq({ query: { token: VALID_TOKEN, email: fakeStudent.email } }), res)
    expect(res.render).toHaveBeenCalledWith('reset-password', expect.objectContaining({ error: expect.any(String) }))
  })

  test('renders error when token is expired', () => {
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue({ ...fakeStudent, reset_token_expiry: PAST_EXPIRY }) })

    const res = mockRes()
    showResetPassword(mockReq({ query: { token: VALID_TOKEN, email: fakeStudent.email } }), res)
    expect(res.render).toHaveBeenCalledWith('reset-password', expect.objectContaining({ error: expect.stringContaining('expired') }))
  })

  test('renders reset-password form when token is valid', () => {
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue(fakeStudent) })

    const res = mockRes()
    showResetPassword(mockReq({ query: { token: VALID_TOKEN, email: fakeStudent.email } }), res)
    expect(res.render).toHaveBeenCalledWith('reset-password', { token: VALID_TOKEN, email: fakeStudent.email, error: null })
  })
})

describe('resetPassword', () => {
  test('renders error when passwords do not match', async () => {
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue(fakeStudent) })

    const req = mockReq({ body: { token: VALID_TOKEN, email: fakeStudent.email, password: 'Password01', confirmPassword: 'Different01' } })
    const res = mockRes()
    await resetPassword(req, res)
    expect(res.render).toHaveBeenCalledWith('reset-password', expect.objectContaining({ error: expect.stringContaining('match') }))
  })

  test('renders error when password is too weak', async () => {
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue(fakeStudent) })

    const req = mockReq({ body: { token: VALID_TOKEN, email: fakeStudent.email, password: 'weak', confirmPassword: 'weak' } })
    const res = mockRes()
    await resetPassword(req, res)
    expect(res.render).toHaveBeenCalledWith('reset-password', expect.objectContaining({ error: expect.any(String) }))
  })

  test('hashes password and redirects to login on valid reset', async () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(fakeStudent) }) // SELECT students
      .mockReturnValueOnce({ run: jest.fn() })                              // UPDATE password

    jest.spyOn(bcryptjs, 'hash').mockResolvedValue('$2b$11$hashed')

    const req = mockReq({ body: { token: VALID_TOKEN, email: fakeStudent.email, password: 'Password01', confirmPassword: 'Password01' } })
    const res = mockRes()
    await resetPassword(req, res)

    expect(bcryptjs.hash).toHaveBeenCalledWith('Password01', 11)
    expect(res.redirect).toHaveBeenCalledWith('/login?success=Password+reset+successfully.+You+may+now+log+in.')

    jest.restoreAllMocks()
  })

  test('renders error when token is expired at submission', async () => {
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue({ ...fakeStudent, reset_token_expiry: PAST_EXPIRY }) })

    const req = mockReq({ body: { token: VALID_TOKEN, email: fakeStudent.email, password: 'Password01', confirmPassword: 'Password01' } })
    const res = mockRes()
    await resetPassword(req, res)
    expect(res.render).toHaveBeenCalledWith('reset-password', expect.objectContaining({ error: expect.stringContaining('expired') }))
  })
})
