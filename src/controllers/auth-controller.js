const db = require('../../database/db')
const { logActivity } = require('../services/logging-service')
const ActionTypes = require('../services/action-types')
const bcryptjs = require('bcryptjs')

const showLogin = (req, res) => {
  if (req.session && req.session.userId) {
    const role = req.session.userRole
    if (role === 'student') return res.redirect('/student/dashboard')
    if (role === 'admin') return res.redirect('/admin/dashboard')
    return res.redirect('/lecturer/dashboard')
  }
  return res.render('login', { error: null, success: req.query.success || null })
}

const login = async (req, res) => {
  try {
    const { staffStudentNumber, password } = req.body

    if (!staffStudentNumber || !password) {
      return res.render('login', { error: 'Please enter both your user number and password.', success: null })
    }

    let user = null
    let role = null
    let idField = null

    const staff = db.prepare('SELECT * FROM staff WHERE staff_number = ?').get(staffStudentNumber)
    if (staff) {
      user = staff
      role = 'lecturer'
      idField = 'staff_number'
    } else {
      const student = db.prepare('SELECT * FROM students WHERE student_number = ?').get(staffStudentNumber)
      if (student) {
        user = student
        role = 'student'
        idField = 'student_number'
      } else {
        try {
          const admin = db.prepare('SELECT * FROM admins WHERE admin_id = ?').get(staffStudentNumber)
          if (admin) {
            user = admin
            role = 'admin'
            idField = 'admin_id'
          }
        } catch (_) {
        }
      }
    }

    if (!user) {
      await logActivity(staffStudentNumber || 'UNKNOWN', ActionTypes.AUTH_FAILED_LOGIN, [])
      return res.render('login', { error: 'Invalid user number.', success: null })
    }

    const isMatch = await bcryptjs.compare(password, user.password)

    if (!isMatch) {
      await logActivity(staffStudentNumber, ActionTypes.AUTH_FAILED_LOGIN, [])
      return res.render('login', { error: 'Invalid password.', success: null })
    }

    req.session.userId = user[idField]
    req.session.userName = user.name
    req.session.userRole = role

    if (role !== 'admin') {
      req.session.showWelcome = true
    }

    await logActivity(user[idField], ActionTypes.USER_LOGIN, [])

    const redirectUrl = role === 'admin' ? '/admin/dashboard' : `/${role}/dashboard?welcome=1`
    return res.redirect(redirectUrl)

  } catch (error) {
    return res.render('login', { error: 'An unexpected error occurred during login.', success: null })
  }
}

const logout = async (req, res) => {
  if (req.session && req.session.userId) {
    await logActivity(req.session.userId, ActionTypes.USER_LOGOUT, [])
  }

  req.session.destroy(() => {
    res.redirect('/')
  })
}

module.exports = { showLogin, login, logout }