const express = require('express');
const { showBookingPage, createBooking } = require('../controllers/consultation-booking-controller');
const {
  showConsultationDetail,
  joinConsultation,
  cancelConsultationTodo,
  leaveConsultationTodo,
} = require('../controllers/consultation-detail-controller');

const router = express.Router();

router.get('/consultations/new', showBookingPage);
router.post('/consultations/new', createBooking);
router.get('/consultations/:constId', showConsultationDetail);
router.post('/consultations/:constId/join', joinConsultation);
router.post('/consultations/:constId/cancel', cancelConsultationTodo);
router.post('/consultations/:constId/leave', leaveConsultationTodo);

module.exports = router;
