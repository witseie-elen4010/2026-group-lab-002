const express = require('express')
const { showlecturerCourses, updatelecturerCourses } = require('../controllers/lecturer-courses-controller')

const router = express.Router()

router.get('/lecturer/courses', showlecturerCourses)
router.post('/lecturer/courses', updatelecturerCourses)

module.exports = router
