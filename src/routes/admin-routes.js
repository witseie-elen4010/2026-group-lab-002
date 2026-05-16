const express = require('express');
const { showAdminDashboard, showTable, createRecord, updateRecord, deleteRecord } = require('../controllers/admin-controller');
const { showActivityLog, showFailedLogins } = require('../controllers/admin-activity-log-controller');
const { requireAuth, requireRole } = require('../middleware/auth-middleware');

const router = express.Router();
const guard = [requireAuth, requireRole('admin')];

router.get('/admin/dashboard', ...guard, showAdminDashboard);
router.get('/admin/activity-log', ...guard, showActivityLog);
router.get('/admin/failed-logins', ...guard, showFailedLogins);
router.get('/admin/table/:tableName', ...guard, showTable);
router.post('/admin/table/:tableName/create', ...guard, createRecord);
router.post('/admin/table/:tableName/:rowId/update', ...guard, updateRecord);
router.post('/admin/table/:tableName/:rowId/delete', ...guard, deleteRecord);

module.exports = router;
