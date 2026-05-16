const crypto = require('crypto')
const db = require('../../database/db')
const { logActivity } = require('../services/logging-service')
const ActionTypes = require('../services/action-types')
const bcryptjs = require('bcryptjs')
const { sendLoginWarningEmail } = require('../services/email-service')

const showLogin = (req, res) => {
  if (req.session && req.session.userId) {
    const role = req.session.userRole
    if (role === 'student') return res.redirect('/student/dashboard')
    if (role === 'admin') return res.redirect('/admin/dashboard')
    return res.redirect('/lecturer/dashboard')
  }
  return res.render('login', { error: null, success: req.query.success || null })
}

const _recordFailedAttempt = async (userId, table, email) => {
  const idCol = table === 'staff' ? 'staff_number' : 'student_number'

  db.prepare(`UPDATE ${table} SET failed_attempts = failed_attempts + 1 WHERE ${idCol} = ?`).run(userId)
  const row = db.prepare(`SELECT failed_attempts FROM ${table} WHERE ${idCol} = ?`).get(userId)
  const attempts = row ? row.failed_attempts : 1

  const pinTriggered = attempts === 4 ? 1 : 0
  db.prepare('INSERT INTO failed_login_log (identifier, pin_triggered) VALUES (?, ?)').run(String(userId), pinTriggered)

  let pinSent = false
  if (attempts === 4) {
    const pin = String(Math.floor(100000 + Math.random() * 900000))
    const pinHash = crypto.createHash('sha256').update(pin).digest('hex')
    db.prepare(`UPDATE ${table} SET login_pin = ? WHERE ${idCol} = ?`).run(pinHash, userId)
    try {
      await sendLoginWarningEmail(email, pin)
      pinSent = true
    } catch (err) {
      console.error('Login warning email failed to send:', err)
    }
  }

  await logActivity(String(userId), ActionTypes.AUTH_FAILED_LOGIN, [])
  return { attempts, pinSent }
}

const login = async (req, res) => {
  try {
    const { staffStudentNumber, password } = req.body

    if (!staffStudentNumber || !password) {
      return res.render('login', { error: 'Please enter both your user number and password.', success: null })
    }

    // 1. Staff Check
    const staff = db.prepare('SELECT * FROM staff WHERE staff_number = ?').get(staffStudentNumber)
    if (staff) {
      if (staff.login_pin) {
        req.session.pendingUserId = staff.staff_number
        req.session.pendingUserRole = 'lecturer'
        req.session.pendingUserName = staff.name
        return res.redirect('/login/pin')
      }

      const isMatch = await bcryptjs.compare(password, staff.password)

      if (isMatch) {
        if (!staff.email_verified) {
          return res.redirect(`/verify-email?email=${encodeURIComponent(staff.email)}&fromLogin=1`)
        }

        db.prepare('UPDATE staff SET failed_attempts = 0 WHERE staff_number = ?').run(staff.staff_number)
        req.session.regenerate((err) => {
        if (err) {
          return res.status(500).render('login', {
            error: 'Session error'
          })
        }})

        req.session.userId = staff.staff_number
        req.session.userName = staff.name
        req.session.userRole = 'lecturer'
        req.session.showWelcome = true
        await logActivity(staff.staff_number, ActionTypes.USER_LOGIN, [])
        return res.redirect('/lecturer/dashboard?welcome=1')
      }

      const { attempts, pinSent } = await _recordFailedAttempt(staff.staff_number, 'staff', staff.email)
      if (attempts >= 4) {
        const msg = pinSent
          ? 'Too many failed attempts. A security PIN has been sent to your email — you will need it to log in.'
          : 'Too many failed attempts. A security PIN was already sent to your email. Check your inbox.'
        return res.render('login', { error: msg, success: null })
      }
      
      const remaining = 4 - attempts
      return res.render('login', {
        error: `Invalid password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before account lockout.`,
        success: null
      })
    }

    // 2. Student Check
    const student = db.prepare('SELECT * FROM students WHERE student_number = ?').get(staffStudentNumber)
    if (student) {
      if (student.login_pin) {
        req.session.pendingUserId = student.student_number
        req.session.pendingUserRole = 'student'
        req.session.pendingUserName = student.name
        return res.redirect('/login/pin')
      }

      const isMatch = await bcryptjs.compare(password, student.password)
      
      if (isMatch) {
        if (!student.email_verified) {
          return res.redirect(`/verify-email?email=${encodeURIComponent(student.email)}&fromLogin=1`)
        }
        
        db.prepare('UPDATE students SET failed_attempts = 0 WHERE student_number = ?').run(student.student_number)
        req.session.regenerate((err) => {
        if (err) {
          return res.status(500).render('login', {
            error: 'Session error'
          })
        }})
        

        req.session.userId = student.student_number
        req.session.userName = student.name
        req.session.userRole = 'student'
        req.session.showWelcome = true
        await logActivity(student.student_number, ActionTypes.USER_LOGIN, [])
        return res.redirect('/student/dashboard?welcome=1')
      } 
      
      const { attempts, pinSent } = await _recordFailedAttempt(student.student_number, 'students', student.email)
      if (attempts >= 4) {
        const msg = pinSent
          ? 'Too many failed attempts. A security PIN has been sent to your email — you will need it to log in.'
          : 'Too many failed attempts. A security PIN was already sent to your email. Check your inbox.'
        return res.render('login', { error: msg, success: null })
      }
      
      const remaining = 4 - attempts
      return res.render('login', {
        error: `Invalid password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before account lockout.`,
        success: null
      })
    }

    // 3. Admin Check
    let admin = null
    try { 
      admin = db.prepare('SELECT * FROM admins WHERE admin_id = ?').get(staffStudentNumber) 
    } catch (_) {} 
    
    if (admin) {
      const isMatch = await bcryptjs.compare(password, admin.password)
      if (isMatch) {
        req.session.userId = admin.admin_id
        req.session.userName = admin.name
        req.session.userRole = 'admin'
        await logActivity(admin.admin_id, ActionTypes.ADMIN_LOGIN, [])
        return res.redirect('/admin/dashboard')
      } else { 
        await logActivity(admin.admin_id, ActionTypes.AUTH_FAILED_LOGIN, [])
        return res.render('login', { error: 'Invalid password.', success: null })
      }
    } 

    // 4. Fallback: No user matched
    await logActivity(staffStudentNumber || 'UNKNOWN', ActionTypes.AUTH_FAILED_LOGIN, [])
    return res.render('login', { error: 'Invalid user number.', success: null })

  } catch (error) {
    console.error('Login error:', error)
    return res.render('login', { error: 'An unexpected error occurred. Please try again.', success: null })
  }
}

const showLoginPin = (req, res) => {
  if (!req.session.pendingUserId) return res.redirect('/login')
  return res.render('login-pin', { error: null, message: null })
}

const resendLoginPin = async (req, res) => {
  if (!req.session.pendingUserId) return res.redirect('/login')

  const userId = req.session.pendingUserId
  const role = req.session.pendingUserRole
  const table = role === 'lecturer' ? 'staff' : 'students'
  const idCol = role === 'lecturer' ? 'staff_number' : 'student_number'

  const user = db.prepare(`SELECT email FROM ${table} WHERE ${idCol} = ?`).get(userId)
  if (!user) return res.redirect('/login')

  const pin = String(Math.floor(100000 + Math.random() * 900000))
  const pinHash = crypto.createHash('sha256').update(pin).digest('hex')
  db.prepare(`UPDATE ${table} SET login_pin = ? WHERE ${idCol} = ?`).run(pinHash, userId)

  try {
    await sendLoginWarningEmail(user.email, pin)
    return res.render('login-pin', { error: null, message: 'A new PIN has been sent to your email.' })
  } catch (err) {
    console.error('Resend PIN email failed:', err)
    return res.render('login-pin', { error: 'Failed to resend PIN. Please try again.', message: null })
  }
}

const verifyLoginPin = async (req, res) => {
  if (!req.session.pendingUserId) return res.redirect('/login')

  const { pin } = req.body
  const userId = req.session.pendingUserId
  const role = req.session.pendingUserRole
  const name = req.session.pendingUserName

  const table = role === 'lecturer' ? 'staff' : 'students'
  const idCol = role === 'lecturer' ? 'staff_number' : 'student_number'

  const user = db.prepare(`SELECT login_pin FROM ${table} WHERE ${idCol} = ?`).get(userId)

  if (!user || !user.login_pin) {
    delete req.session.pendingUserId
    return res.redirect('/login')
  }

  const pinHash = crypto.createHash('sha256').update(pin).digest('hex')
  if (pinHash !== user.login_pin) {
    return res.render('login-pin', { error: 'Incorrect PIN. Check your security alert email and try again.', message: null })
  }

  db.prepare(`UPDATE ${table} SET login_pin = NULL, failed_attempts = 0 WHERE ${idCol} = ?`).run(userId)

  delete req.session.pendingUserId
  delete req.session.pendingUserRole
  delete req.session.pendingUserName
  req.session.userId = userId
  req.session.userName = name
  req.session.userRole = role
  req.session.showWelcome = true

  await logActivity(String(userId), ActionTypes.USER_LOGIN, [])

  const dashUrl = role === 'lecturer' ? '/lecturer/dashboard?welcome=1' : '/student/dashboard?welcome=1'
  return res.redirect(dashUrl)
}

const logout = async (req, res) => {
  if (req.session && req.session.userId) {
    await logActivity(req.session.userId, ActionTypes.USER_LOGOUT, [])
  }

  req.session.destroy((err) => {
  if (err) {
    console.error('Session destruction error:', err);
  }

  res.clearCookie('connect.sid');
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.redirect('/');
});
}

module.exports = { showLogin, login, logout, showLoginPin, resendLoginPin, verifyLoginPin }