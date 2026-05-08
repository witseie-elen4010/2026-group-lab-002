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

        const showWelcome       = req.session.showWelcome || false;
        req.session.showWelcome = false;
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        const degreeRow = db.prepare(`
            SELECT d.degree_name
            FROM students s
            JOIN degrees d ON s.degree_code = d.degree_code
            WHERE s.student_number = ?
        `).get(user.id);
        const degreeName = degreeRow ? degreeRow.degree_name : null;

        // student is in attendees JSON array AND date is today/future
        // json_each expands the attendees array so we can filter by it.
        // The CAST is because attendees are stored as numbers in JSON but
        // SQLite json_each returns them as text values by default.
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

        // const parseRow = (row) => {
        //     let list = [];
        //     try { list = JSON.parse(row.attendees || '[]'); } catch {  }
        //     return { ...row, attendeeCount: list.length };
        // };

        // const upcomingConsultations = upcomingRows.map(parseRow);
        // const pastConsultations = pastRows.map(parseRow);

        const upcomingConsultations = upcomingRows;
        const pastConsultations = pastRows;
        const welcomeMessage = `Welcome back, ${user.name}! Check your upcoming consultations below.`;

        return res.render('student-dashboard', {
            user,
            degreeName,
            enrolledCourses,
            upcomingConsultations,
            pastConsultations,
            success: showWelcome ? welcomeMessage : (req.query.success === 'true' ? 'Courses updated successfully.' : null),
      error: null,
    });

    } catch (err) {
        console.error('Student dashboard error:', err);
        return res.render('student-dashboard', {
            user,
            degreeName: null,
            enrolledCourses: [],
            upcomingConsultations: [],
            pastConsultations: [],
            error: 'Could not load dashboard data. Please try again.',
            success: null,
        });
    }
};

module.exports = { showStudentDashboard };