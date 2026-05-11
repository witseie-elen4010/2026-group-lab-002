const db = require('../../database/db');
const { getSAPublicHolidays } = require('../services/public-holidays-service');

const showLecturerDashboard = async (req, res) => {
  const user = {
    id:   req.session.userId,
    name: req.session.userName,
    role: req.session.userRole,
  };

  try {
    // Show welcome message only on first login or after a successful login
    const showWelcome       = req.session.showWelcome || false;
    req.session.showWelcome = false;

    const now = new Date();
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
      LEFT JOIN students org ON org.student_number = c.organiser
      LEFT JOIN consultation_attendees ca ON ca.const_id = c.const_id
      LEFT JOIN students sa ON sa.student_number = ca.student_number
      WHERE c.lecturer_id = ?
        AND c.consultation_date >= ?
        AND c.status IN ('Available', 'Booked', 'Ongoing')
      GROUP BY c.const_id
      ORDER BY c.consultation_date ASC, c.consultation_time ASC
    `).all(user.id, today);

    const availableSlots = upcomingRows.filter(c => c.status === 'Available');
    const stats = {
      daysAvailable:  new Set(availableSlots.map(c => c.consultation_date)).size,
      hoursAvailable: Math.round(
        availableSlots.reduce((sum, c) => sum + (c.duration_min || 0), 0) / 60
      ),
      totalSlots: availableSlots.length,
    };

    const calendar = buildCalendar(user.id);

    const publicHolidays = await getSAPublicHolidays(calendar.year).catch(() => []);
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
      upcomingConsultations: upcomingRows,
      stats,
      calendar,
      assignedCourses,
      success: showWelcome ? welcomeMessage : (req.query.success === 'true' ? 'Courses updated successfully.' : null),
      error: null,
      publicHolidayDayMap,
      noHolidaysInWindow,
    });

  } catch (err) {
    console.error('Dashboard error:', err);
    return res.render('lecturer-dashboard', {
      user,
      upcomingConsultations: [],
      stats:    { daysAvailable: 0, hoursAvailable: 0, totalSlots: 0 },
      calendar: buildCalendar(null),
      assignedCourses: [],
      error:   'Could not load dashboard data. Please try again.',
      success:  null,
      publicHolidayDayMap: {},
      noHolidaysInWindow: false,
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
    const rows = db.prepare(
      `SELECT consultation_date
       FROM consultations
       WHERE lecturer_id = ?
         AND consultation_date LIKE ?`
    ).all(lecturerId, `${monthStr}-%`);

    consultationDays = [
      ...new Set(rows.map(r => parseInt(r.consultation_date.split('-')[2], 10)))
    ];
  }

  return { year, monthName, daysInMonth, firstDayOfWeek, today, consultationDays };
};

module.exports = { showLecturerDashboard };
