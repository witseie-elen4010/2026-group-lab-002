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
      confirmPassword,
      specificDetail // Matches input name='specificDetail'
    } = req.body

    if (password !== confirmPassword) {
      return res.status(400).send('Passwords do not match')
    }

    let role = ''
    // Determine role based on number
    if (number && number.toUpperCase().startsWith('A')) {
      role = 'lecturer'
    } else {
      role = 'student'
    }

    // Database Insertion
    if (role === 'lecturer') {
      const stmt = db.prepare(`
        INSERT INTO staff (staff_number, name, email, department, password)
        VALUES (?, ?, ?, ?, ?)
      `)
      stmt.run(number, fullName, email, specificDetail, password)
    } else {
      const stmt = db.prepare(`
        
        INSERT INTO students (student_number, name, email, degree_code, password)
        VALUES (?, ?, ?, ?, ?)
      `)
      stmt.run(number, fullName, email, 'BSCENGINFO', password)
    }

    return res.redirect('/?success=true')
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
