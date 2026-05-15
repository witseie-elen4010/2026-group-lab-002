const express = require('express');
const { showLecturerDashboard }      = require('../controllers/lecturer-dashboard-controller');
const { showLecturerConsultations, cancelLecturerConsultation } = require('../controllers/lecturer-consultations-controller');
const { showLecturerSettings }       = require('../controllers/lecturer-settings-controller');
const { showStudentDashboard }       = require('../controllers/student-dashboard-controller');
const { requireAuth, requireRole }   = require('../middleware/auth-middleware');

const router = express.Router();

router.get('/lecturer/dashboard',      requireAuth, requireRole('lecturer'), showLecturerDashboard);
router.get('/lecturer/consultations',                    requireAuth, requireRole('lecturer'), showLecturerConsultations);
router.post('/lecturer/consultations/:constId/cancel',   requireAuth, requireRole('lecturer'), cancelLecturerConsultation);
router.get('/lecturer/settings',       requireAuth, requireRole('lecturer'), showLecturerSettings);
router.get('/student/dashboard',  showStudentDashboard);

module.exports = router;
