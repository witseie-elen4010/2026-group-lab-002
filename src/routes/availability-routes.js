const express = require('express');
const { showAvailability, saveAvailability } = require('../controllers/availability-controller');
const { requireAuth, requireRole } = require('../middleware/auth-middleware');

const router = express.Router();

router.get('/lecturer/availability', requireAuth, requireRole('lecturer'), showAvailability);
router.post('/lecturer/availability', requireAuth, requireRole('lecturer'), saveAvailability);

module.exports = router;
