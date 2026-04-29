const express = require('express');
const { showLecturerDashboard } = require('../controllers/lecturer-dashboard-controller');
const { showStudentDashboard }  = require('../controllers/student-dashboard-controller');
const { requireAuth, requireRole } = require('../middleware/auth-middleware');

const router = express.Router();

router.get('/lecturer/dashboard', requireAuth, requireRole('lecturer'), showLecturerDashboard);
router.get('/student/dashboard',  showStudentDashboard);

module.exports = router;
