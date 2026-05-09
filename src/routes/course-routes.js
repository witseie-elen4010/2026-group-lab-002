const express = require('express');
const { showCourseDetail } = require('../controllers/course-detail-controller');

const router = express.Router();

router.get('/courses/:courseCode', showCourseDetail);

module.exports = router;
