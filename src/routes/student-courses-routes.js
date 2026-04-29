const express = require('express');
const { showStudentCourses, updateStudentCourses } = require('../controllers/student-courses-controller');

const router = express.Router();

router.get('/student/courses', showStudentCourses);
router.post('/student/courses', updateStudentCourses);

module.exports = router;
