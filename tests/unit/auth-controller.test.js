/* eslint-env jest */
const { showLogin, login, logout } = require('../../src/controllers/auth-controller')

jest.mock('../../database/db', () => ({
  prepare: jest.fn()
}))

jest.mock('../../src/services/logging-service', () => ({
  logActivity: jest.fn().mockResolvedValue(true)
}))

const db = require('../../database/db')
const { logActivity } = require('../../src/services/logging-service')

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
})

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
  const fakeStaff = { staff_number: 'A000356', name: 'Clark Kent', password: 'pass' }
  const fakeStudent = { student_number: 1234567, name: 'Aditya', password: 'pass' }

  test('sets lecturer session and redirects to lecturer dashboard on valid staff credentials', async () => {
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue(fakeStaff) })

    const req = mockReq({ body: { staffStudentNumber: 'A000356', password: 'pass' } })
    const res = mockRes()

    await login(req, res)

    expect(req.session.userId).toBe('A000356')
    expect(req.session.userName).toBe('Clark Kent')
    expect(req.session.userRole).toBe('lecturer')
    expect(res.redirect).toHaveBeenCalledWith('/lecturer/dashboard?welcome=1')
  })

  test('sets student session and redirects to student dashboard on valid student credentials', async () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(fakeStudent) })

    const req = mockReq({ body: { staffStudentNumber: '1234567', password: 'pass' } })
    const res = mockRes()

    await login(req, res)

    expect(req.session.userId).toBe(1234567)
    expect(req.session.userName).toBe('Aditya')
    expect(req.session.userRole).toBe('student')
    expect(res.redirect).toHaveBeenCalledWith('/student/dashboard?welcome=1')
  })

  test('sets admin session and redirects to admin dashboard on valid admin credentials', async () => {
    const fakeAdmin = { admin_id: 'ADMIN001', name: 'System Admin', password: 'admin' }
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(fakeAdmin) })

    const req = mockReq({ body: { staffStudentNumber: 'ADMIN001', password: 'admin' } })
    const res = mockRes()

    await login(req, res)

    expect(req.session.userId).toBe('ADMIN001')
    expect(req.session.userName).toBe('System Admin')
    expect(req.session.userRole).toBe('admin')
    expect(res.redirect).toHaveBeenCalledWith('/admin/dashboard')
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
      error: 'Invalid username or password.',
      success: null
    })
  })

  test('renders error when staff is found but password does not match', async () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(fakeStaff) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })

    const req = mockReq({ body: { staffStudentNumber: 'A000356', password: 'wrongpass' } })
    const res = mockRes()

    await login(req, res)

    expect(res.render).toHaveBeenCalledWith('login', {
      error: 'Invalid username or password.',
      success: null
    })
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
