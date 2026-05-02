const express = require('express')
const { showLecturerCourses, updateLecturerCourses } = require('../controllers/lecturer-courses-controller')

const router = express.Router()

router.get('/lecturer/courses', showLecturerCourses)
router.post('/lecturer/courses', updateLecturerCourses)

module.exports = router
