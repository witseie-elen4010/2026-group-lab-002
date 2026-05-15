const db = require('../../database/db');

const showLecturerSettings = (req, res) => {
  const user = {
    id:   req.session.userId,
    name: req.session.userName,
    role: req.session.userRole,
  };

  try {
    const profile = db.prepare(`
      SELECT staff_number, name, email, department, dept_code
      FROM staff
      WHERE staff_number = ?
    `).get(user.id);

    return res.render('lecturer-settings', {
      user,
      profile: profile || {},
      error: null,
    });
  } catch (err) {
    console.error('Lecturer settings error:', err);
    return res.render('lecturer-settings', {
      user,
      profile: {},
      error: 'Could not load profile. Please try again.',
    });
  }
};

module.exports = { showLecturerSettings };
