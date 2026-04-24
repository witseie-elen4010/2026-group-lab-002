const express = require('express');
const { showLecturerDashboard } = require('../controllers/dashboard-controller');
const { showStudentDashboard }  = require('../controllers/student-dashboard-controller');

const router = express.Router();

router.get('/lecturer/dashboard', showLecturerDashboard);
router.get('/student/dashboard',  showStudentDashboard);

module.exports = router;
