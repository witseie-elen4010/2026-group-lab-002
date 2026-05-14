const db = require('../../database/db')

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const formatDate = (dateStr) => {
  if (!dateStr) return null
  const [, m, d] = dateStr.split('-')
  return `${parseInt(d, 10)} ${MONTHS[parseInt(m, 10) - 1]}`
}

const todayStr = () => {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

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
      const row = db.prepare(`
        SELECT
          (SELECT COUNT(*) FROM enrollments WHERE student_number = ?) AS courseCount,
          (SELECT consultation_date FROM consultations c
           WHERE c.consultation_date >= ?
             AND c.status IN ('Available', 'Booked', 'Ongoing')
             AND EXISTS (
               SELECT 1 FROM consultation_attendees
               WHERE const_id = c.const_id AND student_number = ?
             )
           ORDER BY c.consultation_date ASC, c.consultation_time ASC
           LIMIT 1) AS nextDate
      `).get(user.id, today, user.id)

      stats = {
        courseCount: row ? row.courseCount : 0,
        nextDate: row ? row.nextDate : null,
        nextDateFormatted: formatDate(row ? row.nextDate : null),
      }

    } else if (user.role === 'lecturer') {
      const row = db.prepare(`
        SELECT
          (SELECT consultation_date FROM consultations c
           WHERE c.lecturer_id = ?
             AND c.consultation_date >= ?
             AND c.status IN ('Available', 'Booked', 'Ongoing')
           ORDER BY c.consultation_date ASC, c.consultation_time ASC
           LIMIT 1) AS nextDate,
          (SELECT COUNT(*) FROM lecturer_availability WHERE staff_number = ?) AS availabilityCount
      `).get(user.id, today, user.id)

      stats = {
        nextDate: row ? row.nextDate : null,
        nextDateFormatted: formatDate(row ? row.nextDate : null),
        hasAvailability: row ? row.availabilityCount > 0 : false,
      }
    }

    return res.render('homepage', { user, stats })

  } catch (err) {
    console.error('Homepage error:', err)
    return res.render('homepage', { user, stats: null })
  }
}

module.exports = { showHomepage, formatDate }
