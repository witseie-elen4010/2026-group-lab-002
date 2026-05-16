const crypto = require('crypto')
const bcryptjs = require('bcryptjs')
const db = require('../../database/db')
const { sendPasswordResetEmail } = require('../services/email-service')

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/
const TOKEN_EXPIRY_MS = 60 * 60 * 1000 // 1 hour

const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex')

const lookupByEmail = (email) => {
  const student = db.prepare('SELECT * FROM students WHERE email = ?').get(email)
  if (student) return { user: student, table: 'students', idCol: 'student_number' }
  const staff = db.prepare('SELECT * FROM staff WHERE email = ?').get(email)
  if (staff) return { user: staff, table: 'staff', idCol: 'staff_number' }
  return null
}

const showForgotPassword = (req, res) => {
  return res.render('forgot-password', { sent: false, error: null })
}

const requestPasswordReset = async (req, res) => {
  const { email } = req.body

  const found = lookupByEmail(email)

  if (found) {
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = hashToken(rawToken)
    const expiry = new Date(Date.now() + TOKEN_EXPIRY_MS).toISOString()

    db.prepare(
      `UPDATE ${found.table} SET reset_token = ?, reset_token_expiry = ? WHERE ${found.idCol} = ?`
    ).run(tokenHash, expiry, found.user[found.idCol])

    const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`

    try {
      await sendPasswordResetEmail(email, resetLink)
    } catch (err) {
      console.error('Password reset email failed:', err)
    }
  }

  // Always show the same response — never reveal whether the email exists
  return res.render('forgot-password', { sent: true, error: null })
}

const showResetPassword = (req, res) => {
  const { token, email } = req.query
  if (!token || !email) return res.redirect('/forgot-password')

  const found = lookupByEmail(email)
  if (!found || !found.user.reset_token) {
    return res.render('reset-password', { token, email, error: 'This reset link is invalid or has already been used.' })
  }

  if (new Date() > new Date(found.user.reset_token_expiry)) {
    return res.render('reset-password', { token, email, error: 'This reset link has expired. Please request a new one.' })
  }

  if (hashToken(token) !== found.user.reset_token) {
    return res.render('reset-password', { token, email, error: 'This reset link is invalid.' })
  }

  return res.render('reset-password', { token, email, error: null })
}

const resetPassword = async (req, res) => {
  const { token, email, password, confirmPassword } = req.body

  if (!token || !email) return res.redirect('/forgot-password')

  const found = lookupByEmail(email)
  if (!found || !found.user.reset_token) {
    return res.render('reset-password', { token, email, error: 'This reset link is invalid or has already been used.' })
  }

  if (new Date() > new Date(found.user.reset_token_expiry)) {
    return res.render('reset-password', { token, email, error: 'This reset link has expired. Please request a new one.' })
  }

  if (hashToken(token) !== found.user.reset_token) {
    return res.render('reset-password', { token, email, error: 'This reset link is invalid.' })
  }

  if (password !== confirmPassword) {
    return res.render('reset-password', { token, email, error: 'Passwords do not match.' })
  }

  if (!PASSWORD_REGEX.test(password)) {
    return res.render('reset-password', {
      token, email,
      error: 'Password must be at least 8 characters, include one uppercase letter, and one number.'
    })
  }

  const hashed = await bcryptjs.hash(password, 11)

  db.prepare(
    `UPDATE ${found.table} SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE ${found.idCol} = ?`
  ).run(hashed, found.user[found.idCol])

  return res.redirect('/login?success=Password+reset+successfully.+You+may+now+log+in.')
}

module.exports = { showForgotPassword, requestPasswordReset, showResetPassword, resetPassword }
