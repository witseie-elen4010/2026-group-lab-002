const { showLecturerCourses, showLecturerCoursesEdit, updateLecturerCourses } = require('../../src/controllers/lecturer-courses-controller')

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
})

// ---------------------------------------------------------------------------
// showLecturerCourses — read-only summary
// ---------------------------------------------------------------------------
describe('showLecturerCourses', () => {
  test('renders the view with correct data when lecturer exists', async () => {
    // Arrange
    const fakeStaff = { dept_code: 'EIE', department_dept_code: 'EIE' }
    const fakeDepartments = [{ department_code: 'EIE', department_name: 'School of Electrical and Information Engineering', dept_code: 'EIE' }]
    const fakeCourses = [{ course_code: 'ELEN4010', course_name: 'Software Development III', year_level: 4, dept_code: 'EIE' }]
    const fakeEnrollments = [{ course_code: 'ELEN4010' }]
  // test('renders lecturer-courses with only the enrolled courses', () => {
  //   const fakeCourses = [
  //     { course_code: 'ELEN4010', course_name: 'Software Development III', year_level: 4, dept_code: 'EIE' }
  //   ]
  //   db.prepare.mockReturnValueOnce({ all: jest.fn().mockReturnValue(fakeCourses) })

    const req = mockReq({ query: {} })
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
      assignedCourses: fakeCourses,
      error: null,
      success: null
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

    expect(res.render).toHaveBeenCalledWith('lecturer-courses', expect.objectContaining({
      error: 'Something went wrong.'
    }))
  })

  test('renders error view when DB throws', () => {
    db.prepare.mockReturnValueOnce({ all: jest.fn().mockImplementation(() => { throw new Error('DB error') }) })
    const req = mockReq({ query: {} })
    const res = mockRes()

    showLecturerCourses(req, res)

    expect(res.render).toHaveBeenCalledWith('lecturer-courses', expect.objectContaining({
      error: 'Could not load course data. Please try again.',
      assignedCourses: []
    }))
  })

  test('does not include departments, courses list, or enrolledCodes in the render payload', () => {
    db.prepare.mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) })
    const req = mockReq({ query: {} })
    const res = mockRes()

    showLecturerCourses(req, res)

    const payload = res.render.mock.calls[0][1]
    expect(payload).not.toHaveProperty('departments')
    expect(payload).not.toHaveProperty('courses')
    expect(payload).not.toHaveProperty('enrolledCodes')
  })
})

// ---------------------------------------------------------------------------
// showLecturerCoursesEdit — full edit form
// ---------------------------------------------------------------------------
describe('showLecturerCoursesEdit', () => {
  test('renders lecturer-courses-edit with departments, courses, and enrolledCodes', () => {
    const fakeStaff       = { dept_code: 'EIE', department_dept_code: 'EIE' }
    const fakeDepts       = [{ department_code: 'EIE', department_name: 'School of EIE', dept_code: 'EIE' }]
    const fakeCourses     = [{ course_code: 'ELEN4010', course_name: 'Software Development III', year_level: 4, dept_code: 'EIE' }]
    const fakeEnrollments = [{ course_code: 'ELEN4010' }]

    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(fakeStaff) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(fakeDepts) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(fakeCourses) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(fakeEnrollments) })

    const req = mockReq({ query: {} })
    const res = mockRes()

    showLecturerCoursesEdit(req, res)

    expect(res.render).toHaveBeenCalledWith('lecturer-courses-edit', expect.objectContaining({
      departments: fakeDepts,
      courses: fakeCourses,
      enrolledCodes: ['ELEN4010'],
      lecturerDeptCode: 'EIE',
      currentdepartmentCode: 'EIE',
      error: null
    }))
  })

  test('renders error when staff record is not found', () => {
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })
    const req = mockReq({ query: {} })
    const res = mockRes()

    showLecturerCoursesEdit(req, res)

    expect(res.render).toHaveBeenCalledWith('lecturer-courses-edit', expect.objectContaining({
      error: 'Staff record not found.',
      departments: [],
      courses: [],
      enrolledCodes: []
    }))
  })

  test('renders error view when DB throws', () => {
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockImplementation(() => { throw new Error('DB error') }) })
    const req = mockReq({ query: {} })
    const res = mockRes()

    showLecturerCoursesEdit(req, res)

    expect(res.render).toHaveBeenCalledWith('lecturer-courses-edit', expect.objectContaining({
      error: 'Could not load course data. Please try again.'
    }))
  })
})

// ---------------------------------------------------------------------------
// updateLecturerCourses
// ---------------------------------------------------------------------------
describe('updateLecturerCourses', () => {
  test('redirects to dashboard on valid submission', async () => {
    // Arrange
  // test('redirects to /lecturer/courses?success=true on valid submission', () => {
  //   db.prepare
  //     .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ staff_number: 'A000356' }) })
  //     .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ dept_code: 'EIE' }) })
  //     .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ course_code: 'ELEN4010' }) })
  //     .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ course_code: 'ELEN3009' }) })
  //     .mockReturnValue({ run: jest.fn() })

    const req = mockReq({ body: { department_code: 'EIE', courses: ['ELEN4010', 'ELEN3009'] } })
    const res = mockRes()

    // Act
    await updateLecturerCourses(req, res)

    expect(res.redirect).toHaveBeenCalledWith('/lecturer/courses?success=true')
  })
})

  test('redirects with error when department_code is invalid', async () => {
    // Arrange
  // test('redirects to /lecturer/courses/edit with error when staff not found', () => {
  //   db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })

  //   const req = mockReq({ body: { department_code: 'EIE' } })
  //   const res = mockRes()

  //   updateLecturerCourses(req, res)

  //   expect(res.redirect).toHaveBeenCalledWith('/lecturer/courses/edit?error=Staff+record+not+found.')
  // })

  test('redirects to /lecturer/courses/edit with error when department is invalid', () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ staff_number: 'A000356' }) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })

    const req = mockReq({ body: { department_code: 'INVALID' } })
    const res = mockRes()

    // Act
    await updateLecturerCourses(req, res)

    expect(res.redirect).toHaveBeenCalledWith('/lecturer/courses/edit?error=Invalid+department+selected.')
  })

  test('handles zero courses selected (no courses key in body)', async () => {
    // Arrange
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ staff_number: 'A000356' }) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ dept_code: 'EIE' }) })
      .mockReturnValue({ run: jest.fn() })

    const req = mockReq({ body: { department_code: 'EIE' } })
    const res = mockRes()

    // Act
    await updateLecturerCourses(req, res)

    expect(res.redirect).toHaveBeenCalledWith('/lecturer/courses?success=true')
  })

  test('handles a single course submitted as a string', async () => {
    // Arrange
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ staff_number: 'A000356' }) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ dept_code: 'EIE' }) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ course_code: 'ELEN4010' }) })
      .mockReturnValue({ run: jest.fn() })

    const req = mockReq({ body: { department_code: 'EIE', courses: 'ELEN4010' } })
    const res = mockRes()

    // Act
    await updateLecturerCourses(req, res)

    expect(res.redirect).toHaveBeenCalledWith('/lecturer/courses?success=true')
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

    const req = mockReq({ body: { department_code: 'EIE', courses: ['ELEN4010', 'ELEN3009', 'ELEN4020'] } })
    const res = mockRes()

    // Act
    await updateLecturerCourses(req, res)

    expect(res.redirect).toHaveBeenCalledWith('/lecturer/courses?success=true')
  })

  test('only uses session userId — ignores any body userId', () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ staff_number: 'A000356' }) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ dept_code: 'EIE' }) })
      .mockReturnValue({ run: jest.fn() })

    const req = mockReq({ body: { department_code: 'EIE', userId: 'ATTACKER' } })
    const res = mockRes()

    updateLecturerCourses(req, res)

    const firstPrepareArg = db.prepare.mock.calls[0][0]
    expect(firstPrepareArg).toContain('staff_number = ?')
    expect(res.redirect).toHaveBeenCalledWith('/lecturer/courses?success=true')
  })
})
