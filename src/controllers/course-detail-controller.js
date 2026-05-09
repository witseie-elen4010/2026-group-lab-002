const db = require('../../database/db');
const { getNextNWeekdays } = require('../services/booking-helpers');

const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const showCourseDetail = (req, res) => {
  const studentNumber = req.session && req.session.userId ? req.session.userId : 1234567;
  const { courseCode } = req.params;

  const enrollment = db.prepare(
    'SELECT 1 FROM enrollments WHERE student_number = ? AND course_code = ?'
  ).get(studentNumber, courseCode);

  if (!enrollment) {
    return res.redirect(`/student/dashboard?error=Not+enrolled+in+that+course`);
  }

  const course = db.prepare('SELECT * FROM courses WHERE course_code = ?').get(courseCode);
  if (!course) {
    return res.redirect('/student/dashboard?error=Course+not+found');
  }

  const rows = db.prepare(`
    SELECT
      s.staff_number, s.name AS lecturer_name,
      la.availability_id, la.day_of_week, la.start_time, la.end_time,
      la.max_booking_min, la.max_number_of_students, la.venue
    FROM staff_courses sc
    JOIN staff s ON sc.staff_number = s.staff_number
    LEFT JOIN lecturer_availability la ON s.staff_number = la.staff_number
    WHERE sc.course_code = ?
    ORDER BY s.name,
      CASE la.day_of_week
        WHEN 'Mon' THEN 1 WHEN 'Tue' THEN 2 WHEN 'Wed' THEN 3
        WHEN 'Thu' THEN 4 WHEN 'Fri' THEN 5 END,
      la.start_time
  `).all(courseCode);

  const lecturerMap = {};
  for (const row of rows) {
    if (!lecturerMap[row.staff_number]) {
      lecturerMap[row.staff_number] = { staff_number: row.staff_number, lecturer_name: row.lecturer_name, slots: [] };
    }
    if (row.availability_id) {
      lecturerMap[row.staff_number].slots.push({
        availability_id: row.availability_id,
        day_of_week: row.day_of_week,
        start_time: row.start_time,
        end_time: row.end_time,
        max_booking_min: row.max_booking_min,
        max_number_of_students: row.max_number_of_students,
        venue: row.venue,
      });
    }
  }
  const lecturers = Object.values(lecturerMap);

  const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const byDay = {};
  for (const day of WEEKDAYS) {
    byDay[day] = [];
    for (const lec of lecturers) {
      for (const slot of lec.slots) {
        if (slot.day_of_week === day) {
          byDay[day].push({ ...slot, staff_number: lec.staff_number, lecturer_name: lec.lecturer_name });
        }
      }
    }
  }

  const user = req.session && req.session.userId
    ? { id: req.session.userId, name: req.session.userName, role: req.session.userRole }
    : { id: 1234567, name: 'Test Student', role: 'student' };

  // Compute the next future occurrence of each weekday (starting from tomorrow
  // so we never point at a slot that may have already passed today).
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const tomorrow = new Date(`${today}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const upcomingDays = getNextNWeekdays(tomorrow, 10);
  const nextDateByDow = {};
  for (const d of upcomingDays) {
    const dow = DOW_NAMES[d.getUTCDay()];
    if (!nextDateByDow[dow]) {
      nextDateByDow[dow] = d.toISOString().split('T')[0];
    }
  }

  return res.render('course-detail', {
    user,
    course,
    lecturers,
    byDay,
    WEEKDAYS,
    nextDateByDow,
    courseCode,
    error: req.query.error || null,
  });
};

module.exports = { showCourseDetail };
