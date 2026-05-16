const express = require('express');
const { showLogin, login, logout, showLoginPin, resendLoginPin, verifyLoginPin } = require('../controllers/auth-controller');
const { showVerifyPage, verifyEmail, resendCode } = require('../controllers/verify-controller');

const router = express.Router();

router.get('/login', showLogin);
router.post('/login', login);
router.post('/logout', logout);

router.get('/login/pin', showLoginPin);
router.post('/login/pin', verifyLoginPin);
router.post('/login/pin/resend', resendLoginPin);

router.get('/verify-email', showVerifyPage);
router.post('/verify-email', verifyEmail);
router.post('/verify-email/resend', resendCode);

module.exports = router;
