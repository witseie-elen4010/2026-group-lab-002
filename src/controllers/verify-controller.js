const crypto = require('crypto')
const db = require('../../database/db')
const { sendVerificationEmail } = require('../services/email-service')

const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex')

const lookupByEmail = (email) => {
  const student = db.prepare('SELECT * FROM students WHERE email = ?').get(email)
  if (student) return { user: student, table: 'students', idCol: 'student_number' }
  const staff = db.prepare('SELECT * FROM staff WHERE email = ?').get(email)
  if (staff) return { user: staff, table: 'staff', idCol: 'staff_number' }
  return null
}

const showVerifyPage = (req, res) => {
  const email = req.query.email || ''
  let message = null
  if (req.query.emailFailed) {
    message = 'We had trouble sending your verification email. Use the Resend button below to try again.'
  } else if (req.query.fromLogin) {
    message = 'Your account is not yet verified. Enter the code from your email or request a new one below.'
  }
  return res.render('verify-email', { email, error: null, message })
}

const verifyEmail = (req, res) => {
  const { email, code } = req.body

  const found = lookupByEmail(email)
  if (!found) {
    return res.render('verify-email', {
      email,
      error: 'No account found for this email address.',
      message: null,
    })
  }

  const { user } = found

  if (user.email_verified) {
    return res.redirect('/login?success=Email+already+verified.+Please+log+in.')
  }

  if (!user.token_expiry || new Date() > new Date(user.token_expiry)) {
    return res.render('verify-email', {
      email,
      error: 'Your verification code has expired. Please request a new one.',
      message: null,
    })
  }

  if (hashCode(code) !== user.verification_token) {
    return res.render('verify-email', {
      email,
      error: 'Incorrect verification code. Please try again.',
      message: null,
    })
  }

  db.prepare(
    `UPDATE ${found.table} SET email_verified = 1, verification_token = NULL, token_expiry = NULL, resend_count = 0 WHERE ${found.idCol} = ?`
  ).run(user[found.idCol])

  return res.redirect('/login?success=Email+verified+successfully.+You+may+now+log+in.')
}

const resendCode = async (req, res) => {
  const { email } = req.body

  const found = lookupByEmail(email)
  if (!found) {
    return res.render('verify-email', {
      email,
      error: 'No account found for this email address.',
      message: null,
    })
  }

  const { user } = found

  if (user.email_verified) {
    return res.redirect('/login?success=Email+already+verified.+Please+log+in.')
  }

  if (user.resend_count >= 3) {
    return res.render('verify-email', {
      email,
      error: 'Maximum resend attempts reached. Please contact support.',
      message: null,
    })
  }

  const code = String(Math.floor(100000 + Math.random() * 900000))
  const token = hashCode(code)
  const expiry = new Date(Date.now() + 30 * 60 * 1000).toISOString()

  db.prepare(
    `UPDATE ${found.table} SET verification_token = ?, token_expiry = ?, resend_count = resend_count + 1 WHERE ${found.idCol} = ?`
  ).run(token, expiry, user[found.idCol])

  try {
    await sendVerificationEmail(email, code)
  } catch (err) {
    console.error('Resend email failed:', err)
    return res.render('verify-email', {
      email,
      error: 'We could not send the email. Please try again later or contact support if the problem persists.',
      message: null,
    })
  }

  return res.render('verify-email', {
    email,
    error: null,
    message: 'A new code has been sent to your email.',
  })
}

module.exports = { showVerifyPage, verifyEmail, resendCode }
