const express = require('express')
const { showsignup } = require('../controllers/signup-controller')

const router = express.Router()

router.get(
  '/sign-up',
  showsignup
)

router.get('/signup', signupController.getSignupPage)
router.post('/signup', signupController.registerUser)

module.exports = router
