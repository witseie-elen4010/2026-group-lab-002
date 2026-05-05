const express = require('express');
const { showAdminDashboard } = require('../controllers/admin-controller');
const { requireAuth, requireRole } = require('../middleware/auth-middleware');

const router = express.Router();

router.get('/admin/dashboard', requireAuth, requireRole('admin'), showAdminDashboard);

module.exports = router;
