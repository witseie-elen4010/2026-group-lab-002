const db = require('../../database/db');
const { getSAPublicHolidays } = require('../services/public-holidays-service');
const { getWitsWeather } = require('../services/weather-service');

const showLecturerDashboard = async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.redirect('/login');
  }
  const user = {
    id:   req.session.userId,
    name: req.session.userName,
    role: req.session.userRole,
  };

  try {
    const showWelcome       = req.session.showWelcome || false;
    req.session.showWelcome = false;

    const now   = new Date();
    const today = now.toISOString().split('T')[0];

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
        org.name AS organiser_name,
        COUNT(ca.student_number) AS attendeeCount,
        GROUP_CONCAT(sa.name, ', ') AS attendee_names
      FROM consultations c
      LEFT JOIN lecturer_availability la ON c.availability_id = la.availability_id
      LEFT JOIN students org ON org.student_number = c.organiser
      LEFT JOIN consultation_attendees ca ON ca.const_id = c.const_id
      LEFT JOIN students sa ON sa.student_number = ca.student_number
      WHERE (la.staff_number = ? OR (c.availability_id IS NULL AND c.lecturer_id = ?))
        AND c.consultation_date >= ?
        AND c.status NOT IN ('Cancelled')
      GROUP BY c.const_id
      ORDER BY c.consultation_date ASC, c.consultation_time ASC
    `).all(user.id, user.id, today);

    const availabilityRow = db.prepare(`
      SELECT
        COUNT(DISTINCT day_of_week) AS daysAvailable,
        ROUND(SUM(
          (CAST(SUBSTR(end_time, 1, 2) AS INTEGER) * 60 + CAST(SUBSTR(end_time, 4, 2) AS INTEGER)) -
          (CAST(SUBSTR(start_time, 1, 2) AS INTEGER) * 60 + CAST(SUBSTR(start_time, 4, 2) AS INTEGER))
        ) / 60.0, 1) AS hoursAvailable
      FROM lecturer_availability
      WHERE staff_number = ?
    `).get(user.id);

    const stats = {
      daysAvailable:  availabilityRow ? (availabilityRow.daysAvailable  || 0) : 0,
      hoursAvailable: availabilityRow ? (availabilityRow.hoursAvailable || 0) : 0,
    };

    const calendar = buildCalendar(user.id);

    const [publicHolidays, weatherByDay] = await Promise.all([
      getSAPublicHolidays(calendar.year).catch(() => []),
      getWitsWeather().catch(() => ({})),
    ]);
    const holidayDateSet = new Set(publicHolidays.map(h => h.date));
    const monthPad = String(now.getMonth() + 1).padStart(2, '0');
    const publicHolidayDayMap = {};
    for (let d = 1; d <= calendar.daysInMonth; d++) {
      const dateStr = `${calendar.year}-${monthPad}-${String(d).padStart(2, '0')}`;
      if (holidayDateSet.has(dateStr)) {
        const h = publicHolidays.find(ph => ph.date === dateStr);
        publicHolidayDayMap[d] = h ? h.localName : 'Public holiday';
      }
    }
    const noHolidaysInWindow = Object.keys(publicHolidayDayMap).length === 0;

    const assignedCourses = db.prepare(`
      SELECT c.course_code, c.course_name, c.year_level, c.dept_code
      FROM staff_courses sc
      JOIN courses c ON sc.course_code = c.course_code
      WHERE sc.staff_number = ?
      ORDER BY c.year_level, c.course_code
    `).all(user.id) || [];

    const welcomeMessage = `Welcome back, Prof. ${user.name}! Ready for your consultations?`;

    return res.render('lecturer-dashboard', {
      user,
      today,
      upcomingConsultations: upcomingRows,
      stats,
      calendar,
      assignedCourses,
      success: showWelcome ? welcomeMessage : (req.query.success === 'true' ? 'Courses updated successfully.' : null),
      error: req.query.error || null,
      publicHolidayDayMap,
      noHolidaysInWindow,
      weatherByDay,
    });

  } catch (err) {
    console.error('Dashboard error:', err);
    return res.render('lecturer-dashboard', {
      user,
      upcomingConsultations: [],
      stats:    { daysAvailable: 0, hoursAvailable: 0 },
      calendar: buildCalendar(null),
      assignedCourses: [],
      error:   'Could not load dashboard data. Please try again.',
      success:  null,
      publicHolidayDayMap: {},
      noHolidaysInWindow: false,
      weatherByDay: {},
    });
  }
};

const buildCalendar = (lecturerId) => {
  const now            = new Date();
  const year           = now.getFullYear();
  const month          = now.getMonth();
  const monthName      = now.toLocaleString('default', { month: 'long' });
  const daysInMonth    = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const today          = now.getDate();

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  let consultationDays = [];

  if (lecturerId) {
    const rows = db.prepare(`
      SELECT DISTINCT c.consultation_date
      FROM consultations c
      LEFT JOIN lecturer_availability la ON c.availability_id = la.availability_id
      WHERE (la.staff_number = ? OR (c.availability_id IS NULL AND c.lecturer_id = ?))
        AND c.consultation_date LIKE ?
        AND c.status NOT IN ('Cancelled')
    `).all(lecturerId, lecturerId, `${monthStr}-%`);

    consultationDays = rows.map(r => parseInt(r.consultation_date.split('-')[2], 10));
  }

  return { year, monthName, daysInMonth, firstDayOfWeek, today, consultationDays };
};

module.exports = { showLecturerDashboard };
