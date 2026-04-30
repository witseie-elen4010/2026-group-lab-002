const db = require('../../database/db');

const getAvailability = (lecturerId) =>
  db.prepare('SELECT * FROM consultations WHERE lecturer_id = ? ORDER BY consultation_date ASC, consultation_time ASC').all(lecturerId);

const showAvailability = (req, res) => {
  const user = { id: req.session.userId, name: req.session.userName, role: req.session.userRole };
  res.render('availability', { user, availability: getAvailability(user.id), error: null, success: null });
};

const saveAvailability = (req, res) => {
  const user = { id: req.session.userId, name: req.session.userName, role: req.session.userRole };
  return res.render('availability', {
    user,
    availability: getAvailability(user.id),
    error: null,
    success: 'Availability saving is coming soon. This feature requires the lecturer_availability table.'
  });
};

const deleteAvailability = (req, res) => {
  const user = { id: req.session.userId, name: req.session.userName, role: req.session.userRole };
  return res.render('availability', {
    user,
    availability: getAvailability(user.id),
    error: null,
    success: 'Slot deletion is coming soon. This feature requires the lecturer_availability table.'
  });
};

module.exports = { showAvailability, saveAvailability, deleteAvailability };
