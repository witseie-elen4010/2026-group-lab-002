const db = require('../models/db');

const showLogin = (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/lecturer/dashboard');
  }
  return res.render('login', { error: null });
};

const login = (req, res) => {
  const { staffNumber, password } = req.body;

  const staff = db.prepare('SELECT * FROM staff WHERE staff_number = ?').get(staffNumber);

  if (!staff || staff.password !== password) {
    return res.render('login', { error: 'Invalid credentials. Please try again.' });
  }

  req.session.userId   = staff.staff_number;
  req.session.userName = staff.name;
  req.session.userRole = 'lecturer';

  return res.redirect('/lecturer/dashboard');
};

const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};

module.exports = { showLogin, login, logout };
