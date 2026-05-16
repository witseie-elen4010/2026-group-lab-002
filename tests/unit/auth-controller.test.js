/* eslint-env jest */
const { showLogin, login, logout, showLoginPin, resendLoginPin, verifyLoginPin } = require('../../src/controllers/auth-controller')
const bcryptjs = require('bcryptjs')
const crypto = require('crypto')

const VALID_PASSWORD = 'Password01'
const VALID_HASH = 'dummy_hash' 

jest.mock('../../database/db', () => ({
  prepare: jest.fn()
}))

jest.mock('../../src/services/logging-service', () => ({
  logActivity: jest.fn().mockResolvedValue(true)
}))

jest.mock('../../src/services/email-service', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendLoginWarningEmail: jest.fn().mockResolvedValue(undefined)
}))

const db = require('../../database/db')
const { logActivity } = require('../../src/services/logging-service')
const ActionTypes = require('../../src/services/action-types')

const mockReq = (overrides = {}) => ({
  session: {},
  body: {},
  query: {},
  ...overrides
})

const mockRes = () => {
  const res = {}
  res.render = jest.fn()
  res.redirect = jest.fn()
  return res
}

beforeEach(() => {
  db.prepare.mockReset()
  logActivity.mockClear()
  
  // THE MISSING PIECE: Safely intercept bcryptjs without hoisting bugs!
  jest.spyOn(bcryptjs, 'compare').mockImplementation(async (plainPassword) => {
    // Return true for our good test password, false for 'wrongpass'
    return plainPassword !== 'wrongpass'
  })
})

afterEach(() => {
  jest.restoreAllMocks()
})

const fakeStaff = {
  staff_number: 'A000356', name: 'Clark Kent', password: VALID_HASH,
  email: 'clark.kent@wits.ac.za', email_verified: 1,
  failed_attempts: 0, login_pin: null
}
const fakeStudent = {
  student_number: 1234567, name: 'Aditya', password: VALID_HASH,
  email: 'aditya@students.wits.ac.za', email_verified: 1,
  failed_attempts: 0, login_pin: null
}
const fakeAdmin = { 
  admin_id: 'ADMIN001', name: 'System Admin', password: VALID_HASH 
}

describe('showLogin', () => {
  test('renders login page with no error or success when not logged in', () => {
    const req = mockReq({ session: {}, query: {} })
    const res = mockRes()
    showLogin(req, res)
    expect(res.render).toHaveBeenCalledWith('login', { error: null, success: null })
  })

  test('passes success query param through to the login view', () => {
    const req = mockReq({ session: {}, query: { success: 'Account created! Please log in.' } })
    const res = mockRes()
    showLogin(req, res)
    expect(res.render).toHaveBeenCalledWith('login', {
      error: null,
      success: 'Account created! Please log in.'
    })
  })

  test('redirects logged-in lecturer to lecturer dashboard', () => {
    const req = mockReq({ session: { userId: 'A000356', userRole: 'lecturer' } })
    const res = mockRes()
    showLogin(req, res)
    expect(res.redirect).toHaveBeenCalledWith('/lecturer/dashboard')
  })

  test('redirects logged-in student to student dashboard', () => {
    const req = mockReq({ session: { userId: 1234567, userRole: 'student' } })
    const res = mockRes()
    showLogin(req, res)
    expect(res.redirect).toHaveBeenCalledWith('/student/dashboard')
  })

  test('redirects logged-in admin to admin dashboard', () => {
    const req = mockReq({ session: { userId: 'ADMIN001', userRole: 'admin' } })
    const res = mockRes()
    showLogin(req, res)
    expect(res.redirect).toHaveBeenCalledWith('/admin/dashboard')
  })
})

describe('login', () => {
  test('sets lecturer session and redirects to lecturer dashboard on valid staff credentials', async () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(fakeStaff) }) // SELECT staff
      .mockReturnValueOnce({ run: jest.fn() })                            // UPDATE failed_attempts = 0

    const req = mockReq({ body: { staffStudentNumber: 'A000356', password: VALID_PASSWORD } })
    const res = mockRes()

    await login(req, res)

    expect(req.session.userId).toBe('A000356')
    expect(req.session.userName).toBe('Clark Kent')
    expect(req.session.userRole).toBe('lecturer')
    expect(res.redirect).toHaveBeenCalledWith('/lecturer/dashboard?welcome=1')
  })

  test('sets student session and redirects to student dashboard on valid student credentials', async () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })        // SELECT staff (not found)
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(fakeStudent) }) // SELECT student
      .mockReturnValueOnce({ run: jest.fn() })                              // UPDATE failed_attempts = 0

    const req = mockReq({ body: { staffStudentNumber: '1234567', password: VALID_PASSWORD } })
    const res = mockRes()

    await login(req, res)

    expect(req.session.userId).toBe(1234567)
    expect(req.session.userName).toBe('Aditya')
    expect(req.session.userRole).toBe('student')
    expect(res.redirect).toHaveBeenCalledWith('/student/dashboard?welcome=1')
  })

  test('sets admin session and redirects to admin dashboard on valid admin credentials', async () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })       // SELECT staff
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })       // SELECT student
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(fakeAdmin) })  // SELECT admin

    const req = mockReq({ body: { staffStudentNumber: 'ADMIN001', password: VALID_PASSWORD } })
    const res = mockRes()

    await login(req, res)

    expect(req.session.userId).toBe('ADMIN001')
    expect(req.session.userRole).toBe('admin')
    expect(res.redirect).toHaveBeenCalledWith('/admin/dashboard')
  })

  test('logs ADMIN_LOGIN (not USER_LOGIN) when admin credentials are valid', async () => {
    const fakeAdmin = { admin_id: 'ADMIN001', name: 'System Admin', password: 'admin' }
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(fakeAdmin) })

    await login(mockReq({ body: { staffStudentNumber: 'ADMIN001', password: 'admin' } }), mockRes())

    expect(logActivity).toHaveBeenCalledWith('ADMIN001', ActionTypes.ADMIN_LOGIN, [])
    expect(logActivity).not.toHaveBeenCalledWith('ADMIN001', ActionTypes.USER_LOGIN, [])
  })

  test('renders error when no staff, student, or admin matches', async () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })

    const req = mockReq({ body: { staffStudentNumber: 'UNKNOWN', password: 'any' } })
    const res = mockRes()

    await login(req, res)

    expect(res.render).toHaveBeenCalledWith('login', {
      error: 'Invalid user number.',
      success: null
    })
  })

  test('redirects unverified staff to verify-email page', async () => {
    const unverifiedStaff = { ...fakeStaff, email_verified: 0 }
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue(unverifiedStaff) })

    const req = mockReq({ body: { staffStudentNumber: 'A000356', password: VALID_PASSWORD } })
    const res = mockRes()

    await login(req, res)

    expect(res.redirect).toHaveBeenCalledWith(
      `/verify-email?email=${encodeURIComponent(fakeStaff.email)}&fromLogin=1`
    )
  })

  test('redirects unverified student to verify-email page', async () => {
    const unverifiedStudent = { ...fakeStudent, email_verified: 0 }
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(unverifiedStudent) })

    const req = mockReq({ body: { staffStudentNumber: '1234567', password: VALID_PASSWORD } })
    const res = mockRes()

    await login(req, res)

    expect(res.redirect).toHaveBeenCalledWith(
      `/verify-email?email=${encodeURIComponent(fakeStudent.email)}&fromLogin=1`
    )
  })

  test('records failed attempt and shows remaining attempts when staff password wrong', async () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(fakeStaff) })                          // SELECT staff
      .mockReturnValueOnce({ run: jest.fn() })                                                     // UPDATE failed_attempts++
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ failed_attempts: 1 }) })             // SELECT new count
      .mockReturnValueOnce({ run: jest.fn() })                                                     // INSERT failed_login_log

    const req = mockReq({ body: { staffStudentNumber: 'A000356', password: 'wrongpass' } })
    const res = mockRes()

    await login(req, res)

    expect(res.render).toHaveBeenCalledWith('login', {
      error: 'Invalid password. 3 attempts remaining before account lockout.',
      success: null
    })
  })

  test('redirects to /login/pin when login_pin is set regardless of password', async () => {
    const lockedStaff = { ...fakeStaff, login_pin: 'somehash' }
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue(lockedStaff) })

    const req = mockReq({ body: { staffStudentNumber: 'A000356', password: 'wrongpass' } })
    const res = mockRes()

    await login(req, res)

    expect(req.session.pendingUserId).toBe('A000356')
    expect(req.session.pendingUserRole).toBe('lecturer')
    expect(res.redirect).toHaveBeenCalledWith('/login/pin')
  })

  test('sends warning email and shows lockout message on 4th failed attempt', async () => {
    const { sendLoginWarningEmail } = require('../../src/services/email-service')
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(fakeStaff) })                                              // SELECT staff
      .mockReturnValueOnce({ run: jest.fn() })                                                                         // UPDATE failed_attempts++
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ failed_attempts: 4 }) })                                 // SELECT new count (4)
      .mockReturnValueOnce({ run: jest.fn() })                                                                         // INSERT failed_login_log (pin_triggered=1)
      .mockReturnValueOnce({ run: jest.fn() })                                                                         // UPDATE login_pin

    const req = mockReq({ body: { staffStudentNumber: 'A000356', password: 'wrongpass' } })
    const res = mockRes()

    await login(req, res)

    expect(sendLoginWarningEmail).toHaveBeenCalledWith(fakeStaff.email, expect.any(String))
    expect(res.render).toHaveBeenCalledWith('login', {
      error: 'Too many failed attempts. A security PIN has been sent to your email — you will need it to log in.',
      success: null
    })
  })
})

describe('showLoginPin', () => {
  test('redirects to /login if no pending session', () => {
    const req = mockReq({ session: {} })
    const res = mockRes()
    showLoginPin(req, res)
    expect(res.redirect).toHaveBeenCalledWith('/login')
  })

  test('renders login-pin page when pending session exists', () => {
    const req = mockReq({ session: { pendingUserId: 'A000356', pendingUserRole: 'lecturer' } })
    const res = mockRes()
    showLoginPin(req, res)
    expect(res.render).toHaveBeenCalledWith('login-pin', { error: null, message: null })
  })
})

describe('resendLoginPin', () => {
  test('redirects to /login if no pending session', async () => {
    const req = mockReq({ session: {} })
    const res = mockRes()
    await resendLoginPin(req, res)
    expect(res.redirect).toHaveBeenCalledWith('/login')
  })

  test('generates new PIN, updates DB, sends email, and renders success message', async () => {
    const { sendLoginWarningEmail } = require('../../src/services/email-service')
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ email: 'clark.kent@wits.ac.za' }) }) // SELECT email
      .mockReturnValueOnce({ run: jest.fn() })                                                     // UPDATE login_pin

    const req = mockReq({
      session: { pendingUserId: 'A000356', pendingUserRole: 'lecturer' }
    })
    const res = mockRes()

    await resendLoginPin(req, res)

    expect(sendLoginWarningEmail).toHaveBeenCalledWith('clark.kent@wits.ac.za', expect.any(String))
    expect(res.render).toHaveBeenCalledWith('login-pin', {
      error: null,
      message: 'A new PIN has been sent to your email.'
    })
  })
})

describe('verifyLoginPin', () => {
  test('redirects to /login if no pending session', async () => {
    const req = mockReq({ session: {}, body: { pin: '123456' } })
    const res = mockRes()
    await verifyLoginPin(req, res)
    expect(res.redirect).toHaveBeenCalledWith('/login')
  })

  test('renders error on incorrect PIN', async () => {
    const correctHash = crypto.createHash('sha256').update('999999').digest('hex')
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue({ login_pin: correctHash }) })

    const req = mockReq({
      session: { pendingUserId: 'A000356', pendingUserRole: 'lecturer', pendingUserName: 'Clark Kent' },
      body: { pin: '123456' }
    })
    const res = mockRes()

    await verifyLoginPin(req, res)

    expect(res.render).toHaveBeenCalledWith('login-pin', expect.objectContaining({ error: expect.any(String) }))
  })

  test('clears lockout and sets session on correct PIN for lecturer', async () => {
    const pin = '482910'
    const pinHash = crypto.createHash('sha256').update(pin).digest('hex')
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ login_pin: pinHash }) }) // SELECT login_pin
      .mockReturnValueOnce({ run: jest.fn() })                                         // UPDATE clear pin

    const req = mockReq({
      session: { pendingUserId: 'A000356', pendingUserRole: 'lecturer', pendingUserName: 'Clark Kent' },
      body: { pin }
    })
    const res = mockRes()

    await verifyLoginPin(req, res)

    expect(req.session.userId).toBe('A000356')
    expect(req.session.userRole).toBe('lecturer')
    expect(res.redirect).toHaveBeenCalledWith('/lecturer/dashboard?welcome=1')
  })

  test('clears lockout and sets session on correct PIN for student', async () => {
    const pin = '111222'
    const pinHash = crypto.createHash('sha256').update(pin).digest('hex')
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ login_pin: pinHash }) }) // SELECT login_pin
      .mockReturnValueOnce({ run: jest.fn() })                                         // UPDATE clear pin

    const req = mockReq({
      session: { pendingUserId: 1234567, pendingUserRole: 'student', pendingUserName: 'Aditya' },
      body: { pin }
    })
    const res = mockRes()

    await verifyLoginPin(req, res)

    expect(req.session.userId).toBe(1234567)
    expect(req.session.userRole).toBe('student')
    expect(res.redirect).toHaveBeenCalledWith('/student/dashboard?welcome=1')
  })
})

describe('logout', () => {
  test('destroys session and redirects to homepage', async () => {
    const req = mockReq({
      session: { userId: '1234567', destroy: jest.fn((cb) => cb()) }
    })
    const res = mockRes()

    await logout(req, res)

    expect(req.session.destroy).toHaveBeenCalled()
    expect(res.redirect).toHaveBeenCalledWith('/')
  })
})