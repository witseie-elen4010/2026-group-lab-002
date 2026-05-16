require('dns').setDefaultResultOrder('ipv4first')
require('dotenv').config()
const express = require('express')
const session = require('express-session')
const path = require('path')

const authRoutes = require('./src/routes/auth-routes')
const dashboardRoutes = require('./src/routes/dashboard-routes')
const signupRoutes = require('./src/routes/signup-routes')
const availabilityRoutes = require('./src/routes/availability-routes')
const studentCoursesRoutes = require('./src/routes/student-courses-routes')
const lecturerCoursesRoutes = require('./src/routes/lecturer-courses-routes')
const adminRoutes = require('./src/routes/admin-routes')
const courseRoutes = require('./src/routes/course-routes')
const consultationRoutes = require('./src/routes/consultation-routes')
const { showHomepage } = require('./src/controllers/homepage-controller')

const app = express()
const PORT = process.env.PORT || 3000

app.engine('html', require('ejs').renderFile)
app.set('view engine', 'html')
app.set('views', path.join(__dirname, 'src', 'views'))

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(session({
  secret: 'knockknock-secret-change-before-deploy',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 8
  }
}))

app.use('/', authRoutes)
app.use('/', dashboardRoutes)
app.use('/', signupRoutes)
app.use('/', availabilityRoutes)
app.use('/', studentCoursesRoutes)
app.use('/', lecturerCoursesRoutes)
app.use('/', adminRoutes)
app.use('/', courseRoutes)
app.use('/', consultationRoutes)

app.get('/', showHomepage)

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
  })
}

module.exports = app