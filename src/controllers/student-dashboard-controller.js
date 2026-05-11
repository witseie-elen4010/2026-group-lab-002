const db = require('../../database/db');
const { getNextNWeekdays, PALETTE } = require('../services/booking-helpers');
const { getSAPublicHolidays } = require('../services/public-holidays-service');

const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const showStudentDashboard = async (req, res) => {
  const user = req.session && req.session.userId ? {
    id: req.session.userId,
    name: req.session.userName,
    role: req.session.userRole,
  } : {
    id: 1234567,
    name: 'Test Student',
    role: 'student',
  };

  try {
    const showWelcome = req.session.showWelcome || false;
    req.session.showWelcome = false;

    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const currentTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const degreeRow = db.prepare(`
      SELECT d.degree_name
      FROM students s
      JOIN degrees d ON s.degree_code = d.degree_code
      WHERE s.student_number = ?
    `).get(user.id);
    const degreeName = degreeRow ? degreeRow.degree_name : null;

    const enrolledCourses = db.prepare(`
      SELECT c.course_code, c.course_name, c.year_level, c.dept_code
      FROM enrollments e
      JOIN courses c ON e.course_code = c.course_code
      WHERE e.student_number = ?
      ORDER BY c.year_level, c.course_code
    `).all(user.id);

    const upcomingRows = db.prepare(`
      SELECT
        c.const_id,
        c.consultation_title,
        c.consultation_date,
        c.consultation_time,
        c.duration_min,
        c.max_number_of_students,
        c.venue,
        c.status,
        c.allow_join,
        s.name AS lecturer_name,
        COUNT(ca.student_number) AS attendeeCount
      FROM consultations c
      LEFT JOIN staff s ON s.staff_number = c.lecturer_id
      LEFT JOIN consultation_attendees ca ON ca.const_id = c.const_id
      WHERE c.consultation_date >= ?
        AND c.status IN ('Available', 'Booked', 'Ongoing')
        AND EXISTS (
          SELECT 1 FROM consultation_attendees
          WHERE const_id = c.const_id AND student_number = ?
        )
      GROUP BY c.const_id
      ORDER BY c.consultation_date ASC, c.consultation_time ASC
    `).all(today, user.id);

    const pastRows = db.prepare(`
      SELECT
        c.const_id,
        c.consultation_title,
        c.consultation_date,
        c.consultation_time,
        c.max_number_of_students,
        c.status,
        s.name AS lecturer_name,
        COUNT(ca.student_number) AS attendeeCount
      FROM consultations c
      LEFT JOIN staff s ON s.staff_number = c.lecturer_id
      LEFT JOIN consultation_attendees ca ON ca.const_id = c.const_id
      WHERE c.consultation_date < ?
        AND EXISTS (
          SELECT 1 FROM consultation_attendees
          WHERE const_id = c.const_id AND student_number = ?
        )
      GROUP BY c.const_id
      ORDER BY c.consultation_date DESC, c.consultation_time DESC
    `).all(today, user.id);

    const calendarDayObjs = getNextNWeekdays(new Date(`${today}T12:00:00Z`));
    const calendarDays = calendarDayObjs.map(d => d.toISOString().split('T')[0]);
    const lastDay = calendarDays[calendarDays.length - 1];

    const publicHolidays = await getSAPublicHolidays(now.getFullYear()).catch(() => []);
    const holidayDateSet = new Set(publicHolidays.map(h => h.date));
    const noHolidaysInWindow = calendarDays.every(d => !holidayDateSet.has(d));

    const availabilityRows = db.prepare(`
      SELECT DISTINCT
        s.staff_number, s.name AS lecturer_name,
        sc.course_code,
        la.availability_id, la.day_of_week, la.start_time, la.end_time,
        la.max_booking_min, la.max_number_of_students, la.venue
      FROM enrollments e
      JOIN staff_courses sc ON e.course_code = sc.course_code
      JOIN staff s ON sc.staff_number = s.staff_number
      JOIN lecturer_availability la ON s.staff_number = la.staff_number
      WHERE e.student_number = ?
    `).all(user.id);

    const colourMap = {};
    let colourIdx = 0;
    for (const c of enrolledCourses) {
      if (!(c.course_code in colourMap)) {
        colourMap[c.course_code] = PALETTE[colourIdx++ % PALETTE.length];
      }
    }

    const availabilityByDay = {};
    for (const dateStr of calendarDays) {
      const d = new Date(`${dateStr}T12:00:00Z`);
      const dow = DOW_NAMES[d.getUTCDay()];
      availabilityByDay[dateStr] = availabilityRows
        .filter(a => a.day_of_week === dow)
        .map(a => ({ ...a, course_colour: colourMap[a.course_code] || '#6c757d' }));
    }

    const joinableRows = db.prepare(`
      SELECT
        c.const_id, c.consultation_title, c.consultation_date, c.consultation_time,
        c.duration_min, c.max_number_of_students, c.venue, c.status, c.allow_join,
        c.lecturer_id, s.name AS lecturer_name,
        COUNT(ca.student_number) AS attendeeCount
      FROM consultations c
      JOIN staff s ON s.staff_number = c.lecturer_id
      LEFT JOIN consultation_attendees ca ON ca.const_id = c.const_id
      WHERE c.consultation_date >= ? AND c.consultation_date <= ?
        AND c.status = 'Booked'
        AND c.allow_join = 1
        AND c.lecturer_id IN (
          SELECT DISTINCT sc.staff_number FROM staff_courses sc
          JOIN enrollments e ON e.course_code = sc.course_code
          WHERE e.student_number = ?
        )
        AND NOT EXISTS (
          SELECT 1 FROM consultation_attendees
          WHERE const_id = c.const_id AND student_number = ?
        )
      GROUP BY c.const_id
      HAVING COUNT(ca.student_number) < c.max_number_of_students
    `).all(today, lastDay, user.id, user.id);

    const bookedConsultationsByDay = {};
    for (const dateStr of calendarDays) {
      bookedConsultationsByDay[dateStr] = joinableRows.filter(r => r.consultation_date === dateStr);
    }

    let success = null;
    if (showWelcome) {
      success = `Welcome back, ${user.name}! Check your upcoming consultations below.`;
    } else if (req.query.success === 'true') {
      success = 'Courses updated successfully.';
    } else if (req.query.success) {
      success = req.query.success;
    }

    return res.render('student-dashboard', {
      user,
      degreeName,
      enrolledCourses,
      upcomingConsultations: upcomingRows,
      pastConsultations: pastRows,
      calendarDays,
      availabilityByDay,
      bookedConsultationsByDay,
      colourMap,
      today,
      currentTimeStr,
      success,
      error: req.query.error || null,
      publicHolidays,
      noHolidaysInWindow,
    });

  } catch (err) {
    console.error('Student dashboard error:', err);
    return res.render('student-dashboard', {
      user,
      degreeName: null,
      enrolledCourses: [],
      upcomingConsultations: [],
      pastConsultations: [],
      calendarDays: [],
      availabilityByDay: {},
      bookedConsultationsByDay: {},
      colourMap: {},
      today: new Date().toISOString().split('T')[0],
      currentTimeStr: '00:00',
      error: 'Could not load dashboard data. Please try again.',
      success: null,
      publicHolidays: [],
      noHolidaysInWindow: false,
    });
  }
};

module.exports = { showStudentDashboard };
