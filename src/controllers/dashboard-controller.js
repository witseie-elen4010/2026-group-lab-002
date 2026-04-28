const db = require('../../database/db');


const showLecturerDashboard = (req, res) => {
  // Temporary: use default user if not logged in
  const user = req.session && req.session.userId ? {
    id:   req.session.userId,
    name: req.session.userName,
    role: req.session.userRole,
  } : {
    id: 'A000357', // Default lecturer ID from database
    name: 'Test Lecturer',
    role: 'lecturer',
  };

  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // upcoming consultations (available, booked, ongoing)
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

    // past consultations (completed, cancelled)
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

    
    // const parseRow = (row) => {
    //   let list = [];
    //   try { list = JSON.parse(row.attendees || '[]'); } catch { /* leave empty */ }
    //   return { ...row, attendeeCount: list.length };
    // };

    // const upcomingConsultations = upcomingRows.map(parseRow);
    // const pastConsultations     = pastRows.map(parseRow);


    const upcomingConsultations = upcomingRows;
    const pastConsultations = pastRows;
    
    // availability object for stats and calendar
    const availableSlots = upcomingConsultations.filter(c => c.status === 'Available');
    const stats = {
      daysAvailable:  new Set(availableSlots.map(c => c.consultation_date)).size,
      hoursAvailable: Math.round(
        availableSlots.reduce((sum, c) => sum + (c.duration_min || 0), 0) / 60
      ),
      totalSlots: availableSlots.length,
    };

    //calender data for the month
    const calendar = buildCalendar(user.id);

    return res.render('lecturer-dashboard', {
      user,
      upcomingConsultations,
      pastConsultations,
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
      pastConsultations:     [],
      stats:    { daysAvailable: 0, hoursAvailable: 0, totalSlots: 0 },
      calendar: buildCalendar(null),
      error:   'Could not load dashboard data. Please try again.',
      success:  null,
    });
  }
};

// Helper to build calendar data for the current month, marking days with consultations
const buildCalendar = (lecturerId) => {
  const now         = new Date();
  const year        = now.getFullYear();
  const month       = now.getMonth();           
  const monthName   = now.toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); 
  const today       = now.getDate();

  // Day numbers in this month that have a consultation for this lecturer
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`; // YYYY-MM
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
