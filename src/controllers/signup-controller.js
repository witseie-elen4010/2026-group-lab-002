const db = require('../../database/db')

const showSignupPage = (req, res) => {
  res.render('sign-up', { message: null, error: null })
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

    const user = req.session && req.session.userId
      ? {
          id: req.session.userId,
          name: req.session.userName,
          role: req.session.userRole
        }
      : {
          id: number,
          name: fullName,
          role: (number && number.toUpperCase().startsWith('A')) ? 'lecturer' : 'student'
        }

    // Database Insertion
    if (role === 'lecturer') {
      const stmt = db.prepare(`
        INSERT INTO staff (staff_number, name, email, department, dept_code, password)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      stmt.run(number, fullName, email, 'EIE', 'EIE', password) // EIE are just place holders
      return res.redirect('/lecturer/courses?success=Please+choose+your+department+and+courses.')
      // return res.redirect('/login?success=Account+created!+Please+log+in.')
    } else {
      const stmt = db.prepare(`
        INSERT INTO students (student_number, name, email, password, degree_code)
        VALUES (?, ?, ?, ?, ?)
      `)
      stmt.run(parseInt(number), fullName, email, password, 'BSCENGINFO') // degree code is just a placeholder
      return res.redirect('/student/courses?success=Please+choose+your+degree+and+courses.')
      // return res.redirect('/login?success=Account+created!+Please+log+in.')
    }
  } catch (error) {
    console.error('Signup error:', error)
    return res.render('sign-up', {
      message: null,
      error: 'An error occurred during registration. Please contact admin for help sunet110803@gmail.com.'
    })
  }
}

// Explicitly export these functions
module.exports = {
  showSignupPage,
  registerUser
}
