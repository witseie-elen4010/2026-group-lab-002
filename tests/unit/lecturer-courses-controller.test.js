/* eslint-env jest */
const { showLecturerCourses, updateLecturerCourses } = require('../../src/controllers/lecturer-courses-controller')

jest.mock('../../database/db', () => ({
  prepare: jest.fn(),
  transaction: jest.fn()
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
  res.status = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

beforeEach(() => {
  jest.resetAllMocks()
  logActivity.mockClear()

  db.transaction.mockImplementation((fn) => (...args) => fn(...args))
})

describe('showLecturerCourses', () => {
  test('renders the view with correct data when lecturer exists', async () => {
    // Arrange
    const fakeStaff = { dept_code: 'EIE', department_dept_code: 'EIE' }
    const fakeDepartments = [{ department_code: 'EIE', department_name: 'School of Electrical and Information Engineering', dept_code: 'EIE' }]
    const fakeCourses = [{ course_code: 'ELEN4010', course_name: 'Software Development III', year_level: 4, dept_code: 'EIE' }]
    const fakeEnrollments = [{ course_code: 'ELEN4010' }]

    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(fakeStaff) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(fakeDepartments) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(fakeCourses) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(fakeEnrollments) })

    const req = mockReq({ session: { userId: 'A000356' }, query: {} })
    const res = mockRes()

    // Act
    await showLecturerCourses(req, res)

    // Assert
    expect(res.render).toHaveBeenCalledWith('lecturer-courses', {
      error: null,
      success: null,
      departments: fakeDepartments,
      courses: fakeCourses,
      enrolledCodes: ['ELEN4010'],
      lecturerDeptCode: 'EIE',
      currentdepartmentCode: 'EIE',
      onboarding: false
    })
  })

  test('renders an error when lecturer record is not found', async () => {
    // Arrange
    db.prepare.mockReturnValue({ get: jest.fn().mockReturnValue(null) })
    const req = mockReq({ session: {} })
    const res = mockRes()

    // Act
    await showLecturerCourses(req, res)

    // Assert
    expect(res.render).toHaveBeenCalledWith('lecturer-courses', expect.objectContaining({
      error: 'staff record not found.'
    }))
  })

  test('passes success message when ?success=true is in query', async () => {
    // Arrange
    const fakeLecturer = { degree_code: 'BSCENGINFO', dept_code: 'EIE' }
    db.prepare.mockReturnValue({
      get: jest.fn().mockReturnValue(fakeLecturer),
      all: jest.fn().mockReturnValue([])
    })
    const req = mockReq({ session: {}, query: { success: 'true' } })
    const res = mockRes()

    // Act
    await showLecturerCourses(req, res)

    // Assert
    expect(res.render).toHaveBeenCalledWith('lecturer-courses', expect.objectContaining({
      success: 'Courses updated successfully.'
    }))
  })

  test('passes onboarding: true to the view when ?onboarding=true is in query', async () => {
    // Arrange
    const fakeLecturer = { degree_code: 'BSCENGINFO', dept_code: 'EIE' }
    db.prepare.mockReturnValue({
      get: jest.fn().mockReturnValue(fakeLecturer),
      all: jest.fn().mockReturnValue([])
    })
    const req = mockReq({ session: {}, query: { onboarding: 'true' } })
    const res = mockRes()

    // Act
    await showLecturerCourses(req, res)

    // Assert
    expect(res.render).toHaveBeenCalledWith('lecturer-courses', expect.objectContaining({
      onboarding: true
    }))
  })
})

describe('updateLecturerCourses', () => {
  test('redirects to dashboard on valid submission', async () => {
    // Arrange
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ staff_number: 'A000356' }) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ dept_code: 'EIE' }) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ course_code: 'ELEN4010' }) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ course_code: 'ELEN3009' }) })
      .mockReturnValue({ run: jest.fn() })
    const req = mockReq({
      session: { userId: 'A000356' },
      body: { department_code: 'EIE', courses: ['ELEN4010', 'ELEN3009'] }
    })
    const res = mockRes()

    // Act
    await updateLecturerCourses(req, res)

    // Assert
    expect(res.redirect).toHaveBeenCalledWith('/lecturer/dashboard?success=true')
  })

  test('redirects with error when department_code is invalid', async () => {
    // Arrange
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ staff_number: 'A000356' }) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })
    const req = mockReq({
      session: { userId: 'A000356' },
      body: { department_code: 'INVALID' }
    })
    const res = mockRes()

    // Act
    await updateLecturerCourses(req, res)

    // Assert
    expect(res.redirect).toHaveBeenCalledWith('/lecturer/courses?error=Invalid+department+selected.')
  })

  test('handles zero courses selected (no courses key in body)', async () => {
    // Arrange
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ staff_number: 'A000356' }) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ dept_code: 'EIE' }) })
      .mockReturnValue({ run: jest.fn() })
    const req = mockReq({
      session: { userId: 'A000356' },
      body: { department_code: 'EIE' }
    })
    const res = mockRes()

    // Act
    await updateLecturerCourses(req, res)

    // Assert
    expect(res.redirect).toHaveBeenCalledWith('/lecturer/dashboard?success=true')
  })

  test('handles a single course submitted as a string', async () => {
    // Arrange
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ staff_number: 'A000356' }) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ dept_code: 'EIE' }) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ course_code: 'ELEN4010' }) })
      .mockReturnValue({ run: jest.fn() })
    const req = mockReq({
      session: { userId: 'A000356' },
      body: { department_code: 'EIE', courses: 'ELEN4010' }
    })
    const res = mockRes()

    // Act
    await updateLecturerCourses(req, res)

    // Assert
    expect(res.redirect).toHaveBeenCalledWith('/lecturer/dashboard?success=true')
  })

  test('handles multiple courses submitted as an array', async () => {
    // Arrange
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ staff_number: 'A000356' }) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ dept_code: 'EIE' }) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ course_code: 'ELEN4010' }) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ course_code: 'ELEN3009' }) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ course_code: 'ELEN4020' }) })
      .mockReturnValue({ run: jest.fn() })
    const req = mockReq({
      session: { userId: 'A000356' },
      body: { department_code: 'EIE', courses: ['ELEN4010', 'ELEN3009', 'ELEN4020'] }
    })
    const res = mockRes()

    // Act
    await updateLecturerCourses(req, res)

    // Assert
    expect(res.redirect).toHaveBeenCalledWith('/lecturer/dashboard?success=true')
  })
})
