const db = require('../../database/db')

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const formatDate = (dateStr) => {
  if (!dateStr) return null
  const parts = dateStr.split('T')[0].split('-')
  if (parts.length < 3) return null
  const month = parseInt(parts[1], 10)
  const day   = parseInt(parts[2], 10)
  if (isNaN(month) || isNaN(day) || month < 1 || month > 12) return null
  return `${day} ${MONTHS[month - 1]}`
}

// SAST = UTC+2; adding 2 hours before splitting ensures the date rolls over at midnight SAST, not midnight UTC
const todayStr = () =>
  new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().split('T')[0]

const showHomepage = (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.render('homepage', { user: null, stats: null })
  }

  const user = {
    id: req.session.userId,
    name: req.session.userName,
    role: req.session.userRole,
  }

  const today = todayStr()

  try {
    let stats = null

    if (user.role === 'student') {
      const courseRow = db.prepare(
        `SELECT COUNT(*) AS courseCount FROM enrollments WHERE student_number = ?`
      ).get(user.id)

      const nextRow = db.prepare(`
        SELECT c.consultation_date AS nextDate
        FROM consultations c
        JOIN consultation_attendees ca ON ca.const_id = c.const_id
        WHERE ca.student_number = ?
          AND c.consultation_date >= ?
          AND c.status IN ('Available', 'Booked', 'Ongoing')
        ORDER BY c.consultation_date ASC, c.consultation_time ASC
        LIMIT 1
      `).get(user.id, today)

      stats = {
        courseCount:       courseRow ? courseRow.courseCount : 0,
        nextDate:          nextRow   ? nextRow.nextDate      : null,
        nextDateFormatted: formatDate(nextRow ? nextRow.nextDate : null),
      }

    } else if (user.role === 'lecturer') {
      const nextRow = db.prepare(`
        SELECT consultation_date AS nextDate
        FROM consultations
        WHERE lecturer_id = ?
          AND consultation_date >= ?
          AND status IN ('Available', 'Booked', 'Ongoing')
        ORDER BY consultation_date ASC, consultation_time ASC
        LIMIT 1
      `).get(user.id, today)

      const availRow = db.prepare(
        `SELECT COUNT(*) AS availabilityCount FROM lecturer_availability WHERE staff_number = ?`
      ).get(user.id)

      stats = {
        nextDate:          nextRow  ? nextRow.nextDate                    : null,
        nextDateFormatted: formatDate(nextRow ? nextRow.nextDate : null),
        hasAvailability:   availRow ? availRow.availabilityCount > 0      : false,
      }
    }

    return res.render('homepage', { user, stats })

  } catch (err) {
    console.error('Homepage error:', err)
    return res.render('homepage', { user, stats: null })
  }
}

module.exports = { showHomepage, formatDate }
