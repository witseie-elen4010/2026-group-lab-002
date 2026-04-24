const express = require('express')
const { showSignupPage } = require('../controllers/signup-controller')
const { registerUser } = require('../controllers/signup-controller')

const router = express.Router()

// router.get(
//   '/signup',
//   showsignup
// )

router.get('/sign/up', showSignupPage)
router.post('/sign/up', registerUser)

module.exports = router
// const express = require('express')
// // Destructure the object we just created
// const { showSignupPage, registerUser } = require('../controllers/signup-controller')

// const router = express.Router()

// console.log('Checking Imports:')
// console.log('showSignupPage is:', showSignupPage)
// console.log('registerUser is:', registerUser)

// router.get('/sign/up', showSignupPage)
// router.post('/sign/up', registerUser)

// module.exports = router
