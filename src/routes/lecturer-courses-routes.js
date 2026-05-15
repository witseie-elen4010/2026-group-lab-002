const express = require('express')
const { showLecturerCourses, showLecturerCoursesEdit, updateLecturerCourses } = require('../controllers/lecturer-courses-controller')
const { requireAuth, requireRole } = require('../middleware/auth-middleware')

const router = express.Router()

router.get('/lecturer/courses',      requireAuth, requireRole('lecturer'), showLecturerCourses)
router.get('/lecturer/courses/edit', requireAuth, requireRole('lecturer'), showLecturerCoursesEdit)
router.post('/lecturer/courses',     requireAuth, requireRole('lecturer'), updateLecturerCourses)

module.exports = router
