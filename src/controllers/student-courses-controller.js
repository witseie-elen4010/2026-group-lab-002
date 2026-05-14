// Controller for handling student course selection and updates
// This controller manages the display of available courses and the student's current enrollments,
// as well as processing updates to their course selections and degree program.

const db = require('../../database/db')
const { logActivity } = require('../services/logging-service')
const ActionTypes = require('../services/action-types')

const showStudentCourses = (req, res) => {
  const studentNumber = req.session && req.session.userId ? req.session.userId : 1234567

  try {
    const student = db.prepare(`
            SELECT s.degree_code, d.dept_code
            FROM students s
            JOIN degrees d ON s.degree_code = d.degree_code
            WHERE s.student_number = ?
        `).get(studentNumber)

    if (!student) {
      return res.render('student-courses', {
        error: 'Student record not found.',
        degrees: [],
        courses: [],
        enrolledCodes: [],
        studentDeptCode: null,
        currentDegreeCode: null,
        onboarding: false,
        success: null
      })
    }

    const degrees = db.prepare(
      'SELECT degree_code, degree_name, dept_code FROM degrees ORDER BY degree_name'
    ).all()

    const courses = db.prepare(
      'SELECT course_code, course_name, year_level, dept_code FROM courses ORDER BY year_level, course_code'
    ).all()

    const enrolledCodes = db.prepare(
      'SELECT course_code FROM enrollments WHERE student_number = ?'
    ).all(studentNumber).map(e => e.course_code)

    return res.render('student-courses', {
      error: req.query.error || null,
      success: req.query.success === 'true' ? 'Courses updated successfully.' : null,
      degrees,
      courses,
      enrolledCodes,
      studentDeptCode: student.dept_code,
      currentDegreeCode: student.degree_code,
      onboarding: req.query.onboarding === 'true'
    })
  } catch (err) {
    console.error('Student courses error:', err)
    return res.render('student-courses', {
      error: 'Could not load course data. Please try again.',
      degrees: [],
      courses: [],
      enrolledCodes: [],
      studentDeptCode: null,
      currentDegreeCode: null,
      onboarding: false,
      success: null
    })
  }
}

const updateStudentCourses = async (req, res) => {
  const studentNumber = req.session && req.session.userId ? req.session.userId : 1234567
  const { degree_code, courses } = req.body

  const degree = db.prepare(
    'SELECT degree_code FROM degrees WHERE degree_code = ?'
  ).get(degree_code)

  if (!degree) {
    return res.redirect('/student/courses?error=Invalid+degree+selected.')
  }

  const courseList = courses
    ? (Array.isArray(courses) ? courses : [courses])
    : []

  for (const code of courseList) {
    const course = db.prepare(
      'SELECT course_code FROM courses WHERE course_code = ?'
    ).get(code)
    if (!course) {
      return res.redirect('/student/courses?error=Invalid+course+selected.')
    }
  }

  const updateAll = db.transaction(() => {
    db.prepare('UPDATE students SET degree_code = ? WHERE student_number = ?').run(degree_code, studentNumber)
    db.prepare('DELETE FROM enrollments WHERE student_number = ?').run(studentNumber)
    const insertEnrollment = db.prepare(
      'INSERT INTO enrollments (student_number, course_code) VALUES (?, ?)'
    )
    for (const code of courseList) {
      insertEnrollment.run(studentNumber, code)
    }
  })

  updateAll()

  await logActivity(req.session.userId, ActionTypes.PROFILE_COURSES_UPDATED, [{ table: 'students', id: studentNumber }])
  return res.redirect('/student/dashboard?success=true')
}

module.exports = { showStudentCourses, updateStudentCourses }
