/* eslint-env jest */
const { showLecturerCourses, showLecturerCoursesEdit, updateLecturerCourses } = require('../../src/controllers/lecturer-courses-controller')

jest.mock('../../database/db', () => ({ prepare: jest.fn(), transaction: jest.fn() }))
jest.mock('../../src/services/logging-service', () => ({ logActivity: jest.fn().mockResolvedValue(true) }))

const db = require('../../database/db')
const { logActivity } = require('../../src/services/logging-service')

const mockReq = (overrides = {}) => ({
  session: { userId: 'A000356', userName: 'Clark Kent', userRole: 'lecturer' },
  body: {},
query: {},
...overrides
})

const mockRes = () => {
  const res = {}
  res.render = jest.fn()
  res.redirect = jest.fn()
  res.status = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

beforeEach(() => {
  jest.resetAllMocks()
  logActivity.mockClear()
  db.transaction.mockImplementation((fn) => (...args) => fn(...args))

  // Universal mock so it never crashes
  db.prepare.mockImplementation(() => ({
    get: jest.fn().mockReturnValue({ dept_code: 'EIE', staff_number: 'A000356' }),
    all: jest.fn().mockReturnValue([]),
    run: jest.fn()
  }))
})

describe('showLecturerCourses', () => {
  test('renders the view with correct data', async () => {
    const req = mockReq()
    const res = mockRes()
    await showLecturerCourses(req, res)
    expect(res.render).toHaveBeenCalledWith('lecturer-courses', expect.objectContaining({
      assignedCourses: expect.any(Array),
      user: expect.objectContaining({ id: 'A000356', name: 'Clark Kent', role: 'lecturer' })
    }))
  })

  test('passes success message when ?success=true is in query', async () => {
    const req = mockReq({ query: { success: 'true' } })
    const res = mockRes()
    await showLecturerCourses(req, res)
    expect(res.render).toHaveBeenCalledWith('lecturer-courses', expect.objectContaining({
      success: 'Courses updated successfully.'
    }))
  })
})

describe('updateLecturerCourses', () => {
  test('redirects to dashboard on valid submission', async () => {
    const req = mockReq({ body: { department_code: 'EIE', courses: ['ELEN4010', 'ELEN3009'] } })
    const res = mockRes()
    await updateLecturerCourses(req, res)
    expect(res.redirect).toHaveBeenCalledWith('/lecturer/dashboard?success=true')
  })

  test('handles zero courses selected', async () => {
    const req = mockReq({ body: { department_code: 'EIE' } })
    const res = mockRes()
    await updateLecturerCourses(req, res)
    expect(res.redirect).toHaveBeenCalledWith('/lecturer/dashboard?success=true')
  })

  test('handles a single course submitted as a string', async () => {
    const req = mockReq({ body: { department_code: 'EIE', courses: 'ELEN4010' } })
    const res = mockRes()
    await updateLecturerCourses(req, res)
    expect(res.redirect).toHaveBeenCalledWith('/lecturer/dashboard?success=true')
  })
})
