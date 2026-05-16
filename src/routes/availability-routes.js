const express = require('express');
const { showAvailability, saveAvailability, deleteAvailability, updateAvailability } = require('../controllers/availability-controller');
const { requireAuth, requireRole } = require('../middleware/auth-middleware');

const router = express.Router();

router.get('/lecturer/availability', requireAuth, requireRole('lecturer'), showAvailability);
router.post('/lecturer/availability', requireAuth, requireRole('lecturer'), saveAvailability);
router.post('/lecturer/availability/:id/delete', requireAuth, requireRole('lecturer'), deleteAvailability);
router.post('/lecturer/availability/:id/edit', requireAuth, requireRole('lecturer'), updateAvailability);

module.exports = router;
