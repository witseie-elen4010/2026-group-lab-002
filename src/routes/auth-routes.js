const express = require('express');

const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login')
  }

  next()
}


const { showLogin, login, logout, showLoginPin, resendLoginPin, verifyLoginPin } = require('../controllers/auth-controller');
const { showVerifyPage, verifyEmail, resendCode } = require('../controllers/verify-controller');
const { showForgotPassword, requestPasswordReset, showResetPassword, resetPassword } = require('../controllers/password-reset-controller');

const router = express.Router();

router.get('/login', showLogin);
router.post('/login', login);
router.post('/logout', logout);
router.get('/logout', logout);

router.get('/login/pin', showLoginPin);
router.post('/login/pin', verifyLoginPin);
router.post('/login/pin/resend', resendLoginPin);

router.get('/verify-email', showVerifyPage);
router.post('/verify-email', verifyEmail);
router.post('/verify-email/resend', resendCode);

router.get('/forgot-password', showForgotPassword);
router.post('/forgot-password', requestPasswordReset);
router.get('/reset-password', showResetPassword);
router.post('/reset-password', resetPassword);

module.exports = {router, requireAuth};
