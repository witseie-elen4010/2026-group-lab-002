const express = require('express');
const { showBookingPage, createBooking } = require('../controllers/consultation-booking-controller');
const {
  showConsultationDetail,
  joinConsultation,
  cancelConsultation,
  leaveConsultation,
  dismissCancellation,
} = require('../controllers/consultation-detail-controller');
const { requireAuth, requireRole } = require('../middleware/auth-middleware');

const router = express.Router();

const studentGuard = [requireAuth, requireRole('student')];

router.get('/consultations/new', studentGuard, showBookingPage);
router.post('/consultations/new', studentGuard, createBooking);
router.get('/consultations/:constId', studentGuard, showConsultationDetail);
router.post('/consultations/:constId/join', studentGuard, joinConsultation);
router.post('/consultations/:constId/cancel', studentGuard, cancelConsultation);
router.post('/consultations/:constId/leave', studentGuard, leaveConsultation);
router.post('/consultations/:constId/dismiss-cancellation', studentGuard, dismissCancellation);

module.exports = router;
