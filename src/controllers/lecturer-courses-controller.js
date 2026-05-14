const db = require('../../database/db')
const { logActivity } = require('../services/logging-service')
const ActionTypes = require('../services/action-types')

const showLecturerCourses = (req, res) => {
  const staffNumber = req.session && req.session.userId ? req.session.userId : 'A000356'

  try {
    const staff = db.prepare(`
            SELECT s.dept_code, d.dept_code as department_dept_code
            FROM staff s
            JOIN departments d ON s.dept_code = d.dept_code
            WHERE s.staff_number = ?
        `).get(staffNumber)

    if (!staff) {
      return res.render('lecturer-courses', {
        error: 'staff record not found.',
        departments: [],
        courses: [],
        enrolledCodes: [],
        lecturerDeptCode: null,
        currentdepartmentCode: null,
        onboarding: false,
        success: null
      })
    }

    const departments = db.prepare(
      'SELECT dept_code as department_code, dept_name as department_name, dept_code FROM departments ORDER BY dept_name'
    ).all()

    const courses = db.prepare(
      'SELECT course_code, course_name, year_level, dept_code FROM courses ORDER BY year_level, course_code'
    ).all()

    const enrolledCodes = db.prepare(
      'SELECT course_code FROM staff_courses WHERE staff_number = ?'
    ).all(staffNumber).map(e => e.course_code)

    return res.render('lecturer-courses', {
      error: req.query.error || null,
      success: req.query.success === 'true' ? 'Courses updated successfully.' : null,
      departments,
      courses,
      enrolledCodes,
      lecturerDeptCode: staff.dept_code,
      currentdepartmentCode: staff.dept_code,
      onboarding: req.query.onboarding === 'true'
    })
  } catch (err) {
    console.error('lecturer courses error:', err)
    return res.render('lecturer-courses', {
      error: 'Could not load course data. Please try again.',
      departments: [],
      courses: [],
      enrolledCodes: [],
      lecturerDeptCode: null,
      currentdepartmentCode: null,
      onboarding: false,
      success: null
    })
  }
}

const updateLecturerCourses = async (req, res) => {
  const staffNumber = req.session && req.session.userId ? req.session.userId : 'A000356'
  const { department_code, courses } = req.body

  const staff = db.prepare(
    'SELECT staff_number FROM staff WHERE staff_number = ?'
  ).get(staffNumber)

  if (!staff) {
    return res.redirect('/lecturer/courses?error=Staff+record+not+found.')
  }

  const department = db.prepare(
    'SELECT dept_code FROM departments WHERE dept_code = ?'
  ).get(department_code)

  if (!department) {
    return res.redirect('/lecturer/courses?error=Invalid+department+selected.')
  }

  const courseList = courses
    ? (Array.isArray(courses) ? courses : [courses])
    : []

  for (const code of courseList) {
    const course = db.prepare(
      'SELECT course_code FROM courses WHERE course_code = ?'
    ).get(code)
    if (!course) {
      return res.redirect('/lecturer/courses?error=Invalid+course+selected.')
    }
  }

  const updateAll = db.transaction(() => {
    db.prepare('UPDATE staff SET dept_code = ? WHERE staff_number = ?').run(department_code, staffNumber)
    db.prepare('DELETE FROM staff_courses WHERE staff_number = ?').run(staffNumber)
    const insertEnrollment = db.prepare(
      'INSERT INTO staff_courses (staff_number, course_code) VALUES (?, ?)'
    )
    for (const code of courseList) {
      insertEnrollment.run(staffNumber, code)
    }
  })

  updateAll()
  await logActivity(req.session.userId, ActionTypes.PROFILE_COURSES_UPDATED, [{ table: 'staff_courses', id: staffNumber }])
  return res.redirect('/lecturer/dashboard?success=true')
}

module.exports = { showLecturerCourses, updateLecturerCourses }
