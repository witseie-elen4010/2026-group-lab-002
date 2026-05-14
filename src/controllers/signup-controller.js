const db = require('../../database/db')
const { logActivity } = require('../services/logging-service')
const ActionTypes = require('../services/action-types')

const showSignupPage = (req, res) => {
  res.render('sign-up', {
    message: null,
    error: null,
    redirectTo: null,
    fullName: '',
    number: '',
    email: ''
  })
}

const registerUser = async (req, res) => {
  try {
    const {
      fullName,
      number,
      email,
      password,
      confirmPassword
    } = req.body

    if (password === '') {
      throw new Error('Bro, lock the door to this account with some kind of password. Bro, seriously')
    }

    if (password && password !== confirmPassword) {
      throw new Error('Passwords do not match')
    }

    const rawNumber = (number || '').trim()
    const role = rawNumber.toUpperCase().startsWith('A') ? 'lecturer' : 'student'

    const isLecturerNumber = /^A\d{6}$/i.test(rawNumber)
    const isStudentNumber = /^[1-9]\d{6}$/.test(rawNumber)
    if (role === 'lecturer') {
      if (!isLecturerNumber) {
        throw new Error('Staff numbers must start with A followed by 6 digits')
      }
    } else {
      if (!isStudentNumber) {
        throw new Error('Student numbers must be 7 digits long and cannot start with 0. Numbers starting with 0 is outdated')
      }
    }

    const emailLower = (email || '').toLowerCase()
    const isLecturerEmail = /^[^@]+@wits\.ac\.za$/.test(emailLower)
    const isStudentEmail = /^[^@]+@students\.wits\.ac\.za$/.test(emailLower)

    if (role === 'lecturer') {
      if (isStudentEmail) {
        throw new Error('Wrong email type: lecturers must use @wits.ac.za, not a student email')
      }
      if (!isLecturerEmail) {
        throw new Error('Use Wits email address ending in @wits.ac.za')
      }
    } else {
      if (isLecturerEmail) {
        throw new Error('Wrong email type: students must use @students.wits.ac.za, not a staff email')
      }
      if (!isStudentEmail) {
        throw new Error('Use Wits email address ending in @students.wits.ac.za')
      }
    }

    // Database Insertion
    if (role === 'lecturer') {
      const db_number = db.prepare(`
        SELECT staff_number FROM staff WHERE staff_number = ?
      `).get(number)
      if (db_number) {
        throw new Error('A user with this staff number already exists')
      }

      const db_email = db.prepare(`
        SELECT email FROM staff WHERE email = ?
      `).get(email)
      if (db_email) {
        throw new Error('This email is already in use')
      }

      const stmt = db.prepare(`
        INSERT INTO staff (staff_number, name, email, department, dept_code, password)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      stmt.run(number, fullName, email, 'EIE', 'EIE', password)

      req.session.userId = number
      req.session.userName = fullName
      req.session.userRole = 'lecturer'
      req.session.showWelcome = true

      await logActivity(req.session.userId, ActionTypes.USER_SIGNUP, [{ table: 'staff', id: req.session.userId }])
      return res.render('sign-up', {
        message: 'Account created! Redirecting you to select your courses...',
        error: null,
        redirectTo: '/lecturer/courses',
        fullName: '',
        number: '',
        email: ''
      })
    } else {
      const db_number = db.prepare(`
        SELECT student_number FROM students WHERE student_number = ?
      `).get(number)
      if (db_number) {
        throw new Error('A user with this student number already exists')
      }

      const db_email = db.prepare(`
        SELECT email FROM students WHERE email = ?
      `).get(email)
      if (db_email) {
        throw new Error('This email is already in use')
      }

      const stmt = db.prepare(`
        INSERT INTO students (student_number, name, email, password, degree_code)
        VALUES (?, ?, ?, ?, ?)
      `)
      stmt.run(parseInt(number), fullName, email, password, 'BSCENGINFO')

      req.session.userId = parseInt(number)
      req.session.userName = fullName
      req.session.userRole = 'student'
      req.session.showWelcome = true

      await logActivity(req.session.userId, ActionTypes.USER_SIGNUP, [{ table: 'student', id: req.session.userId }])
      return res.render('sign-up', {
        message: 'Account created! Redirecting you to select your courses...',
        error: null,
        redirectTo: '/student/courses',
        fullName: '',
        number: '',
        email: ''
      })
    }
  } catch (error) {
    console.error('Signup error:', error)
    return res.render('sign-up', {
      message: null,
      error: `Registration error: ${error.message || 'Unknown error'}.`,
      redirectTo: null,
      fullName: req.body.fullName || '',
      number: req.body.number || '',
      email: req.body.email || ''
    })
  }
}

// Export these functions
module.exports = {
  showSignupPage,
  registerUser
}
