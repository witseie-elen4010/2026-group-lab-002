const db = require('../../database/db')

const showSignupPage = (req, res) => {
  res.render('sign-up', { message: null, error: null, redirectTo: null })
}

const registerUser = (req, res) => {
  try {
    const {
      fullName,
      number,
      email,
      password,
      confirmPassword
    } = req.body

    if (password !== confirmPassword) {
      return res.status(400).send('Passwords do not match')
    }

    const role = (number && number.toUpperCase().startsWith('A')) ? 'lecturer' : 'student'

    const emailLower = (email || '').toLowerCase()
    const validEmail = role === 'lecturer'
      ? /^[^@]+@wits\.ac\.za$/.test(emailLower)
      : /^[^@]+@students\.wits\.ac\.za$/.test(emailLower)

    if (!validEmail) {
      return res.render('sign-up', { message: null, error: 'Please use your Wits email address.' })
    }

    // const user = req.session && req.session.userId
    //   ? {
    //       id: req.session.userId,
    //       name: req.session.userName,
    //       role: req.session.userRole
    //     }
    //   : {
    //       id: number,
    //       name: fullName,
    //       role: (number && number.toUpperCase().startsWith('A')) ? 'lecturer' : 'student'
    //     }

    req.session.userId = number
    req.session.userName = fullName
    req.session.userRole = role

    req.session.showWelcome = true
    // Database Insertion
    if (role === 'lecturer') {
      const stmt = db.prepare(`
        INSERT INTO staff (staff_number, name, email, department, dept_code, password)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      stmt.run(number, fullName, email, 'EIE', 'EIE', password) // EIE are just place holders

      return res.render('sign-up', {
        message: 'Account created! Redirecting you to select your courses...',
        error: null,
        redirectTo: '/lecturer/courses'
      })
    } else {
      const stmt = db.prepare(`
        INSERT INTO students (student_number, name, email, password, degree_code)
        VALUES (?, ?, ?, ?, ?)
      `)
      stmt.run(parseInt(number), fullName, email, password, 'BSCENGINFO') // degree code is just a placeholder

      return res.render('sign-up', {
        message: 'Account created! Redirecting you to select your courses...',
        error: null,
        redirectTo: '/student/courses'
      })
    }
  } catch (error) {
    console.error('Signup error:', error)
    return res.render('sign-up', {
      message: null,
      error: 'An error occurred during registration. Please contact admin for help sunet110803@gmail.com.',
      redirectTo: null
    })
  }
}

// Explicitly export these functions
module.exports = {
  showSignupPage,
  registerUser
}
