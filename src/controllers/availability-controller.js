const db = require('../../database/db');
const { generateConstId, validateSlotFields } = require('../services/availability-helpers');

const showAvailability = (req, res) => {
  const user = {
    id: req.session.userId,
    name: req.session.userName,
    role: req.session.userRole,
  };

  const availability = db.prepare('SELECT * FROM consultations WHERE lecturer_id = ?').all(user.id);

  res.render('availability', { user, availability, error: null, success: null });
};

const saveAvailability = (req, res) => {
  const lecturerId = req.session.userId;
  const { consultation_date, consultation_time, venue, duration_min, max_number_of_students } = req.body;

  if (!validateSlotFields(req.body)) {
    return res.render('availability', {
      user: { id: lecturerId, name: req.session.userName, role: req.session.userRole },
      availability: db.prepare('SELECT * FROM consultations WHERE lecturer_id = ?').all(lecturerId),
      error: 'All fields are required.',
      success: null
    });
  }

  const existing = db.prepare(
    'SELECT const_id FROM consultations WHERE lecturer_id = ? AND consultation_date = ? AND consultation_time = ?'
  ).get(lecturerId, consultation_date, consultation_time);

  if (existing) {
    return res.render('availability', {
      user: { id: lecturerId, name: req.session.userName, role: req.session.userRole },
      availability: db.prepare('SELECT * FROM consultations WHERE lecturer_id = ?').all(lecturerId),
      error: 'A slot already exists for that date and time.',
      success: null
    });
  }

  const count = db.prepare(
    'SELECT COUNT(*) AS total FROM consultations WHERE lecturer_id = ? AND consultation_date = ?'
  ).get(lecturerId, consultation_date).total;

  const constId = generateConstId(consultation_date, count);

  db.prepare(`
  INSERT INTO consultations (const_id, consultation_date, consultation_time, lecturer_id, duration_min, max_number_of_students, venue, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, 'Available')
`).run(constId, consultation_date, consultation_time, lecturerId, Number(duration_min), Number(max_number_of_students), venue);

  return res.redirect('/lecturer/dashboard');
};

module.exports = { showAvailability, saveAvailability };
