const db = require('../../database/db');

const showLogin = (req, res) => {
  if (req.session && req.session.userId) {
    const role = req.session.userRole;
    return res.redirect(role === 'student' ? '/student/dashboard' : '/lecturer/dashboard');
  }
  return res.render('login', { error: null, success: req.query.success || null });
};

const login = (req, res) => {
  const { staffStudentNumber, password } = req.body;

  const staff = db.prepare('SELECT * FROM staff WHERE staff_number = ?').get(staffStudentNumber);
  if (staff && staff.password === password) {
    req.session.userId   = staff.staff_number;
    req.session.userName = staff.name;
    req.session.userRole = 'lecturer';
    return res.redirect('/lecturer/dashboard?welcome=1');
  }

  const student = db.prepare('SELECT * FROM students WHERE student_number = ?').get(staffStudentNumber);
  if (student && student.password === password) {
    req.session.userId   = student.student_number;
    req.session.userName = student.name;
    req.session.userRole = 'student';
    return res.redirect('/student/dashboard?welcome=1');
  }

  return res.render('login', { error: 'Invalid username or password.', success: null });
};

const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};

module.exports = { showLogin, login, logout };
