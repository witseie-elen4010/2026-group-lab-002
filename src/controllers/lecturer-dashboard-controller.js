const db = require('../../database/db');

const showLecturerDashboard = (req, res) => {
  const user = {
    id:   req.session.userId,
    name: req.session.userName,
    role: req.session.userRole,
  };

  try {
    const today = new Date().toISOString().split('T')[0];

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

    return res.render('lecturer-dashboard', {
      user,
      upcomingConsultations: upcomingRows,
      stats,
      calendar,
      success: req.query.success || null,
      error:   null,
    });

  } catch (err) {
    console.error('Dashboard error:', err);
    return res.render('lecturer-dashboard', {
      user,
      upcomingConsultations: [],
      stats:    { daysAvailable: 0, hoursAvailable: 0, totalSlots: 0 },
      calendar: buildCalendar(null),
      error:   'Could not load dashboard data. Please try again.',
      success:  null,
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
