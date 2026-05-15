const db = require('../../database/db')
const { logActivity } = require('../services/logging-service')
const ActionTypes = require('../services/action-types')

const { validateSlotFields, isBusinessHours, isOverlapping } = require('../services/availability-helpers')

const getAvailability = (staffNumber) =>
  db.prepare(`
    SELECT * FROM lecturer_availability
    WHERE staff_number = ?
    ORDER BY
      CASE day_of_week WHEN 'Mon' THEN 1 WHEN 'Tue' THEN 2 WHEN 'Wed' THEN 3 WHEN 'Thu' THEN 4 WHEN 'Fri' THEN 5 END,
      start_time
  `).all(staffNumber)

const showAvailability = (req, res) => {
  const user = { id: req.session.userId, name: req.session.userName, role: req.session.userRole }
  res.render('availability', { user, availability: getAvailability(user.id), error: null, success: null })
}

const saveAvailability = async (req, res) => {
  const user = { id: req.session.userId, name: req.session.userName, role: req.session.userRole }
  const { day_of_week, start_time, end_time, venue, max_number_of_students, max_booking_min } = req.body

  if (!validateSlotFields({ day_of_week, start_time, end_time, venue, max_number_of_students, max_booking_min })) {
    return res.render('availability', {
      user,
      availability: getAvailability(user.id),
      error: 'All fields are required.',
      success: null
    })
  }

  if (Number(max_number_of_students) < 1 || Number(max_number_of_students) > 10) {
    return res.render('availability', {
      user,
      availability: getAvailability(user.id),
      error: 'Max students must be between 1 and 10.',
      success: null
    })
  }

  if (!isBusinessHours(start_time, end_time)) {
    return res.render('availability', {
      user,
      availability: getAvailability(user.id),
      error: 'Slots must be between 08:00 and 18:00, with end time after start time.',
      success: null
    })
  }

  const existing = db.prepare(
    'SELECT * FROM lecturer_availability WHERE staff_number = ? AND day_of_week = ?'
  ).all(user.id, day_of_week)

  if (isOverlapping(existing, start_time, end_time)) {
    return res.render('availability', {
      user,
      availability: getAvailability(user.id),
      error: 'This slot overlaps with an existing availability slot.',
      success: null
    })
  }

  const lastRecord = db.prepare(
    'INSERT INTO lecturer_availability (staff_number, day_of_week, start_time, end_time, venue, max_number_of_students, max_booking_min) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(user.id, day_of_week, start_time, end_time, venue, Number(max_number_of_students), Number(max_booking_min))

  await logActivity(req.session.userId, ActionTypes.AVAIL_CREATE, [{ table: 'lecturer_availability', id: lastRecord.lastInsertRowid }])
  return res.render('availability', {
    user,
    availability: getAvailability(user.id),
    error: null,
    success: 'Availability slot saved.'
  })
}

const deleteAvailability = async (req, res) => {
  const user = { id: req.session.userId, name: req.session.userName, role: req.session.userRole }
  db.prepare(
    'DELETE FROM lecturer_availability WHERE availability_id = ? AND staff_number = ?'
  ).run(req.params.id, user.id)

  await logActivity(req.session.userId, ActionTypes.AVAIL_CANCEL, [{ table: 'lecturer_availability', id: req.params.id }])
  return res.render('availability', {
    user,
    availability: getAvailability(user.id),
    error: null,
    success: 'Slot deleted.'
  })
}

module.exports = { showAvailability, saveAvailability, deleteAvailability }
