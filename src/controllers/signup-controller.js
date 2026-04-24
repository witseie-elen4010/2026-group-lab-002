const db = require('../models/db')

exports.getSignupPage = (req, res) => {
  res.render('sign-up', { message: null, error: null })
}

exports.registerUser = (req, res) => {
  try {
    const {
      fullName,
      number,
      email,
      password,
      confirmPassword, // Make sure to handle password confirmation logic
      department,
      degree,
      courses // This will come from your hidden input field
    } = req.body

    // Validation Check: ensure passwords match
    if (password !== confirmPassword) {
      return res.status(400).send('Passwords do not match')
    }

    let role = ''
    let specificDetail = ''

    // Logic for role assignment
    if (number && number.toUpperCase().startsWith('A')) {
      role = 'lecturer'
      specificDetail = department
    } else {
      role = 'student'
      specificDetail = degree
    }

    // Database Insertion (Example using your prepared statements)
    if (role === 'lecturer') {
      const stmt = db.prepare(`
        INSERT INTO staff (staff_number, name, email, department, password, courses)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      stmt.run(number, fullName, email, specificDetail, password, courses || null)
    } else {
      const stmt = db.prepare(`
        INSERT INTO users (student_number, name, email, degree_code, password)
        VALUES (?, ?, ?, ?, ?)
      `)
      stmt.run(number, fullName, email, specificDetail, password)
    }

    return res.render('sign-up', {
      message: 'Account created successfully! You can now log in.',
      error: null
    })
    res.redirect('/homepage')
  } catch (error) {
    console.error('Signup error:', error)
    return res.status(500).send('Server error during signup')
  }
}
