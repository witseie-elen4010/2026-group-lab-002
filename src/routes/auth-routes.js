const express = require('express');
const { showLogin, login, logout } = require('../controllers/auth-controller');
const { showVerifyPage, verifyEmail, resendCode } = require('../controllers/verify-controller');

const router = express.Router();

router.get('/login', showLogin);
router.post('/login', login);
router.post('/logout', logout);

router.get('/verify-email', showVerifyPage);
router.post('/verify-email', verifyEmail);
router.post('/verify-email/resend', resendCode);

module.exports = router;
