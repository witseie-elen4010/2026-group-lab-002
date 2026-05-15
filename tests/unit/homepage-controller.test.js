/* eslint-env jest */
const { showHomepage, formatDate } = require('../../src/controllers/homepage-controller')

jest.mock('../../database/db', () => ({ prepare: jest.fn() }))
const db = require('../../database/db')

const mockRes = () => ({ render: jest.fn() })

const studentSession  = { userId: 9999001, userName: 'Test Student',  userRole: 'student' }
const lecturerSession = { userId: 'A999001', userName: 'Test Lecturer', userRole: 'lecturer' }

describe('formatDate()', () => {
  test('formats YYYY-MM-DD to "D Mon"', () => {
    expect(formatDate('2026-05-15')).toBe('15 May')
  })

  test('strips leading zero from day', () => {
    expect(formatDate('2026-01-03')).toBe('3 Jan')
  })

  test('returns null for null input', () => {
    expect(formatDate(null)).toBeNull()
  })

  test('handles datetime strings by stripping the time part', () => {
    expect(formatDate('2026-05-15T10:00:00')).toBe('15 May')
  })

  test('returns null for a malformed date string', () => {
    expect(formatDate('not-a-date')).toBeNull()
  })
})

describe('showHomepage() — unauthenticated', () => {
  test('renders homepage with user=null and stats=null when not logged in', () => {
    const req = { session: {} }
    const res = mockRes()
    showHomepage(req, res)
    expect(res.render).toHaveBeenCalledWith('homepage', { user: null, stats: null })
  })
})

describe('showHomepage() — student', () => {
  beforeEach(() => db.prepare.mockReset())

  const req = (overrides = {}) => ({ session: { ...studentSession }, query: {}, ...overrides })

  test('passes courseCount and nextDateFormatted when student has courses and a consultation', () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ courseCount: 3 }) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ nextDate: '2026-05-20' }) })
    const res = mockRes()
    showHomepage(req(), res)
    expect(res.render).toHaveBeenCalledWith('homepage', expect.objectContaining({
      stats: { courseCount: 3, nextDate: '2026-05-20', nextDateFormatted: '20 May' }
    }))
  })

  test('sets nextDate to null and nextDateFormatted to null when no consultations booked', () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ courseCount: 2 }) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })
    const res = mockRes()
    showHomepage(req(), res)
    expect(res.render).toHaveBeenCalledWith('homepage', expect.objectContaining({
      stats: { courseCount: 2, nextDate: null, nextDateFormatted: null }
    }))
  })

  test('defaults courseCount to 0 when DB row is missing', () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })
    const res = mockRes()
    showHomepage(req(), res)
    expect(res.render).toHaveBeenCalledWith('homepage', expect.objectContaining({
      stats: expect.objectContaining({ courseCount: 0 })
    }))
  })

  test('stats object contains correct nextDateFormatted for a student with an upcoming consultation', () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ courseCount: 1 }) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ nextDate: '2026-06-02' }) })
    const res = mockRes()
    showHomepage(req(), res)
    expect(res.render).toHaveBeenCalledWith('homepage', expect.objectContaining({
      stats: { courseCount: 1, nextDate: '2026-06-02', nextDateFormatted: '2 Jun' }
    }))
  })

  test('renders homepage with stats=null on DB error', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    db.prepare.mockReturnValue({ get: jest.fn().mockImplementation(() => { throw new Error('DB fail') }) })
    const res = mockRes()
    showHomepage(req(), res)
    expect(res.render).toHaveBeenCalledWith('homepage', expect.objectContaining({ stats: null }))
  })

  test('passes user object with correct role', () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ courseCount: 0 }) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })
    const res = mockRes()
    showHomepage(req(), res)
    expect(res.render).toHaveBeenCalledWith('homepage', expect.objectContaining({
      user: expect.objectContaining({ role: 'student', name: 'Test Student' })
    }))
  })
})

describe('showHomepage() — lecturer', () => {
  beforeEach(() => db.prepare.mockReset())

  const req = (overrides = {}) => ({ session: { ...lecturerSession }, query: {}, ...overrides })

  test('passes nextDateFormatted and hasAvailability=true when availability is set', () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ nextDate: '2026-05-18' }) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ availabilityCount: 2 }) })
    const res = mockRes()
    showHomepage(req(), res)
    expect(res.render).toHaveBeenCalledWith('homepage', expect.objectContaining({
      stats: { nextDate: '2026-05-18', nextDateFormatted: '18 May', hasAvailability: true }
    }))
  })

  test('sets hasAvailability=false when no availability rows exist', () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ availabilityCount: 0 }) })
    const res = mockRes()
    showHomepage(req(), res)
    expect(res.render).toHaveBeenCalledWith('homepage', expect.objectContaining({
      stats: expect.objectContaining({ hasAvailability: false })
    }))
  })

  test('sets nextDate to null when lecturer has no upcoming consultations', () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ availabilityCount: 1 }) })
    const res = mockRes()
    showHomepage(req(), res)
    expect(res.render).toHaveBeenCalledWith('homepage', expect.objectContaining({
      stats: expect.objectContaining({ nextDate: null, nextDateFormatted: null })
    }))
  })

  test('renders homepage with stats=null on DB error', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    db.prepare.mockReturnValue({ get: jest.fn().mockImplementation(() => { throw new Error('DB fail') }) })
    const res = mockRes()
    showHomepage(req(), res)
    expect(res.render).toHaveBeenCalledWith('homepage', expect.objectContaining({ stats: null }))
  })
})
