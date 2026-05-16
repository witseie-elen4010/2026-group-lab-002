/* eslint-env jest */
const { showStudentCourses, updateStudentCourses } = require('../../src/controllers/student-courses-controller')

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

describe('showStudentCourses', () => {
  test('renders the view with correct data when student exists', async () => {
    // Arrange
    const fakeStudent = { degree_code: 'BSCENGINFO', dept_code: 'EIE' }
    const fakeDegrees = [{ degree_code: 'BSCENGINFO', degree_name: 'BSc Eng (Information)' }]
    const fakeCourses = [{ course_code: 'ELEN4010', course_name: 'Software Development III', year_level: 4, dept_code: 'EIE' }]
    const fakeEnrollments = [{ course_code: 'ELEN4010' }]

    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(fakeStudent) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(fakeDegrees) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(fakeCourses) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(fakeEnrollments) })

    const req = mockReq({ session: { userId: 1234567 }, query: {} })
    const res = mockRes()

    // Act
    await showStudentCourses(req, res)

    // Assert
    expect(res.render).toHaveBeenCalledWith('student-courses', {
      error: null,
      success: null,
      degrees: fakeDegrees,
      courses: fakeCourses,
      enrolledCodes: ['ELEN4010'],
      studentDeptCode: 'EIE',
      currentDegreeCode: 'BSCENGINFO',
      onboarding: false
    })
  })

  test('renders an error when student record is not found', async () => {
    // Arrange
    db.prepare.mockReturnValue({ get: jest.fn().mockReturnValue(null) })
    const req = mockReq({ session: {} })
    const res = mockRes()

    // Act
    await showStudentCourses(req, res)

    // Assert
    expect(res.render).toHaveBeenCalledWith('student-courses', expect.objectContaining({
      error: 'Student record not found.'
    }))
  })

  test('passes success message when ?success=true is in query', async () => {
    // Arrange
    const fakeStudent = { degree_code: 'BSCENGINFO', dept_code: 'EIE' }
    db.prepare.mockReturnValue({
      get: jest.fn().mockReturnValue(fakeStudent),
      all: jest.fn().mockReturnValue([])
    })
    const req = mockReq({ session: {}, query: { success: 'true' } })
    const res = mockRes()

    // Act
    await showStudentCourses(req, res)

    // Assert
    expect(res.render).toHaveBeenCalledWith('student-courses', expect.objectContaining({
      success: 'Courses updated successfully.'
    }))
  })

  test('passes onboarding: true to the view when ?onboarding=true is in query', async () => {
    // Arrange
    const fakeStudent = { degree_code: 'BSCENGINFO', dept_code: 'EIE' }
    db.prepare.mockReturnValue({
      get: jest.fn().mockReturnValue(fakeStudent),
      all: jest.fn().mockReturnValue([])
    })
    const req = mockReq({ session: {}, query: { onboarding: 'true' } })
    const res = mockRes()

    // Act
    await showStudentCourses(req, res)

    // Assert
    expect(res.render).toHaveBeenCalledWith('student-courses', expect.objectContaining({
      onboarding: true
    }))
  })
})

describe('updateStudentCourses', () => {
  test('redirects to dashboard on valid submission', async () => {
    // Arrange
    db.prepare.mockReturnValue({
      get: jest.fn().mockReturnValue({ degree_code: 'BSCENGINFO' }),
      run: jest.fn()
    })
    const req = mockReq({
      session: { userId: 1234567 },
      body: { degree_code: 'BSCENGINFO', courses: ['ELEN4010', 'ELEN3009'] }
    })
    const res = mockRes()

    // Act
    await updateStudentCourses(req, res)

    // Assert
    expect(res.redirect).toHaveBeenCalledWith('/student/dashboard?success=true')
  })

  test('redirects with error when degree_code is invalid', async () => {
    // Arrange
    db.prepare.mockReturnValue({ get: jest.fn().mockReturnValue(null) })
    const req = mockReq({
      session: { userId: 1234567 },
      body: { degree_code: 'INVALID' }
    })
    const res = mockRes()

    // Act
    await updateStudentCourses(req, res)

    // Assert
    expect(res.redirect).toHaveBeenCalledWith('/student/courses?error=Invalid+degree+selected.')
  })

  test('rejects save with zero courses and redirects with error', async () => {
    db.prepare.mockReturnValue({
      get: jest.fn().mockReturnValue({ degree_code: 'BSCENGINFO' }),
      run: jest.fn()
    })
    const req = mockReq({
      session: { userId: 1234567 },
      body: { degree_code: 'BSCENGINFO' }
    })
    const res = mockRes()

    await updateStudentCourses(req, res)

    expect(res.redirect).toHaveBeenCalledWith('/student/courses?error=Please+select+at+least+one+course+before+saving.')
  })

  test('handles a single course submitted as a string', async () => {
    // Arrange
    db.prepare.mockReturnValue({
      get: jest.fn().mockReturnValue({ degree_code: 'BSCENGINFO', course_code: 'ELEN4010' }),
      run: jest.fn()
    })
    const req = mockReq({
      session: { userId: 1234567 },
      body: { degree_code: 'BSCENGINFO', courses: 'ELEN4010' }
    })
    const res = mockRes()

    // Act
    await updateStudentCourses(req, res)

    // Assert
    expect(res.redirect).toHaveBeenCalledWith('/student/dashboard?success=true')
  })

  test('handles multiple courses submitted as an array', async () => {
    // Arrange
    db.prepare.mockReturnValue({
      get: jest.fn().mockReturnValue({ degree_code: 'BSCENGINFO', course_code: 'ELEN4010' }),
      run: jest.fn()
    })
    const req = mockReq({
      session: { userId: 1234567 },
      body: { degree_code: 'BSCENGINFO', courses: ['ELEN4010', 'ELEN3009', 'ELEN4020'] }
    })
    const res = mockRes()

    // Act
    await updateStudentCourses(req, res)

    // Assert
    expect(res.redirect).toHaveBeenCalledWith('/student/dashboard?success=true')
  })
})
