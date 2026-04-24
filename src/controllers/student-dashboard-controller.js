const db = require('../../database/db');

const showStudentDashboard = (req, res) => {
    // Temporary: hardcode student until auth landscape is set up. Should be able to get from session once login is implemented.
    const user = req.session && req.session.userId ? {
        id: req.session.userId,
        name: req.session.userName,
        role: req.session.userRole,
    } : {
        id: 1234567, // Default student number for testing
        name: 'Test Student',
        role: 'student',
    };

    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // student is in attendees JSON array AND date is today/future
        // json_each expands the attendees array so we can filter by it.
        // The CAST is because attendees are stored as numbers in JSON but
        // SQLite json_each returns them as text values by default.
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
        c.attendees,
        s.name AS lecturer_name
      FROM consultations c
      LEFT JOIN staff s ON s.staff_number = c.lecturer_id
      WHERE c.consultation_date >= ?
        AND c.status IN ('Available', 'Booked', 'Ongoing')
        AND EXISTS (
          SELECT 1 FROM json_each(c.attendees)
          WHERE CAST(json_each.value AS INTEGER) = ?
        )
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
        c.attendees,
        s.name AS lecturer_name
      FROM consultations c
      LEFT JOIN staff s ON s.staff_number = c.lecturer_id
      WHERE c.consultation_date < ?
        AND EXISTS (
          SELECT 1 FROM json_each(c.attendees)
          WHERE CAST(json_each.value AS INTEGER) = ?
        )
      ORDER BY c.consultation_date DESC, c.consultation_time DESC
    `).all(today, user.id);

        const parseRow = (row) => {
            let list = [];
            try { list = JSON.parse(row.attendees || '[]'); } catch {  }
            return { ...row, attendeeCount: list.length };
        };

        const upcomingConsultations = upcomingRows.map(parseRow);
        const pastConsultations = pastRows.map(parseRow);

        return res.render('student-dashboard', {
            user,
            upcomingConsultations,
            pastConsultations,
            success: req.query.success || null,
            error: null,
        });

    } catch (err) {
        console.error('Student dashboard error:', err);
        return res.render('student-dashboard', {
            user,
            upcomingConsultations: [],
            pastConsultations: [],
            error: 'Could not load dashboard data. Please try again.',
            success: null,
        });
    }
};

module.exports = { showStudentDashboard };