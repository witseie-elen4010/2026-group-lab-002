const express = require('express');
const { showStudentCourses, updateStudentCourses } = require('../controllers/student-courses-controller');
const { requireAuth, requireRole } = require('../middleware/auth-middleware');

const router = express.Router();

router.post('/student/courses',      requireAuth, requireRole('student'), updateStudentCourses);
router.get('/student/courses', requireAuth, requireRole('student'), showStudentCourses);

module.exports = router;
