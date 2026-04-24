const express = require('express');
const { showLecturerDashboard } = require('../controllers/dashboard-controller');
const { requireAuth, requireRole } = require('../middleware/auth-middleware');

const router = express.Router();

router.get('/lecturer/dashboard', requireAuth, requireRole('lecturer'), showLecturerDashboard);

module.exports = router;
