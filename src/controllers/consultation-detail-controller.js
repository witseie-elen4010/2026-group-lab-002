const db = require('../../database/db')
const { logActivity } = require('../services/logging-service')
const ActionTypes = require('../services/action-types')

const { validateJoin } = require('../services/consultation-join-service')

const getStudentUser = (req) => ({
  id: req.session.userId,
  name: req.session.userName,
  role: req.session.userRole,
})

const showConsultationDetail = (req, res) => {
  const user = getStudentUser(req)
  const { constId } = req.params

  const consultation = db.prepare(`
    SELECT c.*, s.name AS lecturer_name
    FROM consultations c
    LEFT JOIN staff s ON s.staff_number = c.lecturer_id
    WHERE c.const_id = ?
  `).get(constId)

  if (!consultation) {
    return res.redirect('/student/dashboard?error=Consultation+not+found')
  }

  const isEnrolled = db.prepare(`
    SELECT 1 FROM enrollments e
    JOIN staff_courses sc ON e.course_code = sc.course_code
    WHERE e.student_number = ? AND sc.staff_number = ?
  `).get(user.id, consultation.lecturer_id)

  const attendees = db.prepare(`
    SELECT ca.student_number, s.name
    FROM consultation_attendees ca
    JOIN students s ON s.student_number = ca.student_number
    WHERE ca.const_id = ?
  `).all(constId)

  const isAttendee = attendees.some(a => a.student_number === user.id)

  if (!isAttendee && !isEnrolled) {
    return res.status(403).render('error', { message: 'You do not have access to this consultation.' })
  }

  const isOrganiser = consultation.organiser === user.id
  const spotsRemaining = consultation.max_number_of_students - attendees.length
  const canJoin = !isAttendee && !isOrganiser && consultation.allow_join && spotsRemaining > 0

  const organiserRow = attendees.find(a => a.student_number === consultation.organiser)

  return res.render('consultation-detail', {
    user,
    consultation,
    attendees,
    isOrganiser,
    isAttendee,
    canJoin,
    spotsRemaining,
    organiserName: organiserRow ? organiserRow.name : 'Unknown',
    error: req.query.error || null,
    success: req.query.success || null
  })
}

const joinConsultation = async (req, res) => {
  const user = getStudentUser(req)
  const { constId } = req.params

  const consultation = db.prepare('SELECT * FROM consultations WHERE const_id = ?').get(constId)
  const attendees = db.prepare(
    'SELECT student_number FROM consultation_attendees WHERE const_id = ?'
  ).all(constId)

  const validation = validateJoin(consultation, user.id, attendees)
  if (!validation.valid) {
    return res.redirect(`/student/dashboard?error=${encodeURIComponent(validation.reason)}`)
  }

  const isEnrolled = consultation.lecturer_id
    ? db.prepare(`
        SELECT 1 FROM enrollments e
        JOIN staff_courses sc ON e.course_code = sc.course_code
        WHERE e.student_number = ? AND sc.staff_number = ?
      `).get(user.id, consultation.lecturer_id)
    : null

  if (!isEnrolled) {
    return res.redirect('/student/dashboard?error=You+are+not+enrolled+in+a+course+taught+by+this+lecturer')
  }

  const joinResult = db.transaction(() => {
    const currentAttendees = db.prepare(
      'SELECT student_number FROM consultation_attendees WHERE const_id = ?'
    ).all(constId)
    if (currentAttendees.length >= consultation.max_number_of_students) {
      return { full: true }
    }
    db.prepare('INSERT INTO consultation_attendees (const_id, student_number) VALUES (?, ?)').run(constId, user.id)
    return { full: false }
  })()

  if (joinResult.full) {
    return res.redirect(`/student/dashboard?error=${encodeURIComponent('This consultation is at full capacity.')}`)
  }

  await logActivity(req.session.userId, ActionTypes.CONSULT_JOIN, [{ table: 'consultations', id: constId }])
  return res.redirect('/student/dashboard?success=Successfully+joined+consultation')
}

const cancelConsultation = async (req, res) => {
  const user = getStudentUser(req)
  const { constId } = req.params

  const consultation = db.prepare('SELECT * FROM consultations WHERE const_id = ?').get(constId)

  if (!consultation) {
    return res.redirect('/student/dashboard?error=Consultation+not+found')
  }

  if (consultation.organiser !== user.id) {
    return res.redirect(`/consultations/${constId}?error=Only+the+organiser+can+cancel+this+consultation`)
  }

  if (consultation.status === 'Cancelled') {
    return res.redirect(`/consultations/${constId}?error=Consultation+is+already+cancelled`)
  }

  const consultationStart = new Date(`${consultation.consultation_date}T${consultation.consultation_time}:00`)
  const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000)
  if (consultationStart <= twoHoursFromNow) {
    return res.redirect(`/consultations/${constId}?error=Consultations+cannot+be+cancelled+within+2+hours+of+the+start+time`)
  }

  // Mark as cancelled but keep attendees attached so they can be notified
  // via the in-app cancellation banner on their dashboard (dismissable).
  db.prepare(`UPDATE consultations SET status = 'Cancelled' WHERE const_id = ?`).run(constId)
  await logActivity(req.session.userId, ActionTypes.CONSULT_CANCEL_ORG, [{ table: 'consultations', id: req.params.constId }]);
  return res.redirect('/student/dashboard?success=Consultation+cancelled+successfully');
};

const leaveConsultation = async (req, res) => {
  const user = getStudentUser(req);
  const { constId } = req.params;

  const consultation = db.prepare('SELECT * FROM consultations WHERE const_id = ?').get(constId);
  if (!consultation) {
    return res.redirect('/student/dashboard?error=Consultation+not+found');
  }

  if (consultation.organiser === user.id) {
    return res.redirect(`/consultations/${constId}?error=Organisers+must+cancel+not+leave`);
  }

  const attendee = db.prepare(
    'SELECT 1 FROM consultation_attendees WHERE const_id = ? AND student_number = ?'
  ).get(constId, user.id);

  if (!attendee) {
    return res.redirect(`/consultations/${constId}?error=You+are+not+attending+this+consultation`);
  }

  db.prepare('DELETE FROM consultation_attendees WHERE const_id = ? AND student_number = ?').run(constId, user.id);
  await logActivity(req.session.userId, ActionTypes.CONSULT_LEAVE, [{ table: 'consultations', id: req.params.constId }]);
  return res.redirect('/student/dashboard?success=You+have+left+the+consultation');
};

// Marks a cancellation notice as dismissed for the current student.
// Idempotent: safe to call repeatedly. Used by the dashboard banner's "X" button.
const dismissCancellation = (req, res) => {
  const user = getStudentUser(req)
  const { constId } = req.params
  db.prepare(`
    INSERT OR IGNORE INTO dismissed_cancellations (student_number, const_id)
    VALUES (?, ?)
  `).run(user.id, constId)
  return res.redirect('/student/dashboard')
}

module.exports = {
  showConsultationDetail,
  joinConsultation,
  cancelConsultation,
  leaveConsultation,
  dismissCancellation,
};
