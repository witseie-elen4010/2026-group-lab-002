const db = require('../../database/db');

const showLecturerConsultations = (req, res) => {
  const user = {
    id:   req.session.userId,
    name: req.session.userName,
    role: req.session.userRole,
  };

  const today = new Date().toISOString().split('T')[0];

  try {
    const rows = db.prepare(`
      SELECT
        c.const_id,
        c.consultation_title,
        c.consultation_description,
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
      GROUP BY c.const_id
      ORDER BY c.consultation_date DESC, c.consultation_time DESC
    `).all(user.id);

    const upcoming  = rows.filter(r => r.consultation_date >= today && r.status !== 'Cancelled');
    const past      = rows.filter(r => r.consultation_date < today);
    const cancelled = rows.filter(r => r.status === 'Cancelled');

    return res.render('lecturer-consultations', {
      user, rows, upcoming, past, cancelled, today,
      error:   req.query.error   || null,
      success: req.query.success || null,
    });
  } catch (err) {
    console.error('Lecturer consultations error:', err);
    return res.render('lecturer-consultations', {
      user, rows: [], upcoming: [], past: [], cancelled: [], today,
      error: 'Could not load consultations. Please try again.',
    });
  }
};

const cancelLecturerConsultation = (req, res) => {
  const lecturerId = req.session.userId;
  const { constId } = req.params;

  const consultation = db.prepare(`
    SELECT c.const_id, c.status
    FROM consultations c
    LEFT JOIN lecturer_availability la ON c.availability_id = la.availability_id
    WHERE c.const_id = ?
      AND (la.staff_number = ? OR (c.availability_id IS NULL AND c.lecturer_id = ?))
  `).get(constId, lecturerId, lecturerId);

  if (!consultation) {
    return res.redirect('/lecturer/consultations?error=Consultation+not+found');
  }

  if (consultation.status === 'Cancelled') {
    return res.redirect('/lecturer/consultations?error=Consultation+is+already+cancelled');
  }

  db.prepare(`UPDATE consultations SET status = 'Cancelled' WHERE const_id = ?`).run(constId);

  return res.redirect('/lecturer/consultations?success=Consultation+cancelled+successfully');
};

module.exports = { showLecturerConsultations, cancelLecturerConsultation };
