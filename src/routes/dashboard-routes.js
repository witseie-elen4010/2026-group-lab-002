const express = require('express');
const { showLecturerDashboard } = require('../controllers/dashboard-controller');

const router = express.Router();

router.get(
  '/lecturer/dashboard',
  showLecturerDashboard
);

module.exports = router;
