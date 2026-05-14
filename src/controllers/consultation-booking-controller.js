const db = require('../../database/db')
const { logActivity } = require('../services/logging-service')
const ActionTypes = require('../services/action-types')

const { computeBookableChunks, validateBookingRequest, getNextNWeekdays } = require('../services/booking-helpers')
const { generateConstId } = require('../services/availability-helpers')
const { getWitsWeather } = require('../services/weather-service')

const getStudentUser = (req) => req.session && req.session.userId
  ? { id: req.session.userId, name: req.session.userName, role: req.session.userRole }
  : { id: 1234567, name: 'Test Student', role: 'student' }

const getToday = () => {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

const getCurrentTime = () => {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`
}

const showBookingPage = async (req, res) => {
  const user = getStudentUser(req)
  const { staffNumber, availabilityId, date } = req.query

  if (!staffNumber || !availabilityId || !date) {
    return res.redirect('/student/dashboard?error=Missing+booking+parameters')
  }

  const enrolled = db.prepare(`
    SELECT 1 FROM enrollments e
    JOIN staff_courses sc ON e.course_code = sc.course_code
    WHERE e.student_number = ? AND sc.staff_number = ?
  `).get(user.id, staffNumber)

  if (!enrolled) {
    return res.redirect('/student/dashboard?error=You+are+not+enrolled+in+a+course+taught+by+this+lecturer')
  }

  const window = db.prepare(
    'SELECT * FROM lecturer_availability WHERE availability_id = ? AND staff_number = ?'
  ).get(availabilityId, staffNumber)

  if (!window) {
    return res.redirect('/student/dashboard?error=Availability+window+not+found')
  }

  const today = getToday()
  const todayWeekdays = getNextNWeekdays(new Date(`${today}T12:00:00Z`))
  const validDates = todayWeekdays.map(d => d.toISOString().split('T')[0])
  if (!validDates.includes(date)) {
    return res.redirect('/student/dashboard?error=Date+is+not+within+the+next+10+weekdays')
  }

  const bookings = db.prepare(`
    SELECT c.const_id, c.consultation_time, c.duration_min, c.allow_join,
           COUNT(ca.student_number) AS attendee_count
    FROM consultations c
    LEFT JOIN consultation_attendees ca ON ca.const_id = c.const_id
    WHERE c.consultation_date = ? AND c.lecturer_id = ? AND c.availability_id = ?
      AND c.status IN ('Booked', 'Available', 'Ongoing')
    GROUP BY c.const_id
  `).all(date, staffNumber, availabilityId)

  const bookableChunks = computeBookableChunks(window, bookings)

  const joinableConsultations = db.prepare(`
    SELECT c.const_id, c.consultation_title, c.consultation_time, c.duration_min,
           c.max_number_of_students, c.allow_join, c.venue,
           COUNT(ca.student_number) AS attendee_count
    FROM consultations c
    LEFT JOIN consultation_attendees ca ON ca.const_id = c.const_id
    WHERE c.consultation_date = ? AND c.lecturer_id = ? AND c.availability_id = ?
      AND c.status = 'Booked' AND c.allow_join = 1
      AND NOT EXISTS (
        SELECT 1 FROM consultation_attendees WHERE const_id = c.const_id AND student_number = ?
      )
    GROUP BY c.const_id
    HAVING COUNT(ca.student_number) < c.max_number_of_students
  `).all(date, staffNumber, availabilityId, user.id)

  const lecturer = db.prepare('SELECT name FROM staff WHERE staff_number = ?').get(staffNumber)

  const course = db.prepare(`
    SELECT c.course_code, c.course_name FROM courses c
    JOIN staff_courses sc ON sc.course_code = c.course_code
    JOIN enrollments e ON e.course_code = sc.course_code
    WHERE sc.staff_number = ? AND e.student_number = ?
    LIMIT 1
  `).get(staffNumber, user.id)

  const weatherByDay = await getWitsWeather().catch(() => ({}))
  const weatherForDate = weatherByDay[date] || null

  return res.render('consultation-new', {
    user,
    window,
    bookableChunks,
    joinableConsultations,
    lecturer: lecturer || { name: 'Unknown' },
    course: course || { course_code: '', course_name: '' },
    date,
    staffNumber,
    availabilityId,
    weatherForDate,
    error: req.query.error || null,
    success: null
  })
}

const createBooking = async (req, res) => {
  const user = getStudentUser(req)
  const { staff_number, availability_id, date, start_time, duration_min, title, description, allow_join } = req.body

  if (!staff_number || !availability_id || !date || !start_time || !duration_min || !title) {
    return res.redirect(
      `/consultations/new?staffNumber=${staff_number}&availabilityId=${availability_id}&date=${date}&error=All+required+fields+must+be+filled`
    )
  }

  const window = db.prepare(
    'SELECT * FROM lecturer_availability WHERE availability_id = ? AND staff_number = ?'
  ).get(availability_id, staff_number)

  if (!window) {
    return res.redirect('/student/dashboard?error=Availability+window+not+found')
  }

  const today = getToday()
  const currentTimeStr = getCurrentTime()

  const bookings = db.prepare(`
    SELECT c.const_id, c.consultation_time, c.duration_min, c.allow_join,
           COUNT(ca.student_number) AS attendee_count
    FROM consultations c
    LEFT JOIN consultation_attendees ca ON ca.const_id = c.const_id
    WHERE c.consultation_date = ? AND c.lecturer_id = ? AND c.availability_id = ?
      AND c.status IN ('Booked', 'Available', 'Ongoing')
    GROUP BY c.const_id
  `).all(date, staff_number, availability_id)

  const validation = validateBookingRequest({
    date,
    start_time,
    duration_min: Number(duration_min),
    window,
    bookingsOnDay: bookings,
    todayStr: today,
    currentTimeStr
  })

  if (!validation.valid) {
    return res.redirect(
      `/consultations/new?staffNumber=${staff_number}&availabilityId=${availability_id}&date=${date}&error=${encodeURIComponent(validation.reason)}`
    )
  }

  const countRow = db.prepare('SELECT COUNT(*) AS cnt FROM consultations WHERE consultation_date = ?').get(date)
  const constId = generateConstId(date, countRow.cnt)
  const allowJoinVal = allow_join === '1' || allow_join === 1 ? 1 : 0

  db.prepare(`
    INSERT INTO consultations
      (const_id, consultation_title, consultation_description, consultation_date, consultation_time,
       lecturer_id, organiser, availability_id, duration_min, max_number_of_students, venue, status, allow_join)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Booked', ?)
  `).run(
    constId, title, description || null, date, start_time,
    staff_number, user.id, availability_id,
    Number(duration_min), window.max_number_of_students, window.venue,
    allowJoinVal
  )

  db.prepare(
    'INSERT INTO consultation_attendees (const_id, student_number) VALUES (?, ?)'
  ).run(constId, user.id)

  await logActivity(req.session.userId, ActionTypes.CONSULT_CREATE, [{ table: 'consultations', id: constId }])
  return res.redirect('/student/dashboard?success=Consultation+booked')
}

module.exports = { showBookingPage, createBooking }
