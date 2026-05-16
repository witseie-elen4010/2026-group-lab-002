require('dns').setDefaultResultOrder('ipv4first')
require('dotenv').config()

const express = require('express')
const session = require('express-session')
const path = require('path')

const { router: authRoutes } = require('./src/routes/auth-routes') 

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
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  next()
})

const noCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  next()
}

const PORT = process.env.PORT || 3000

app.engine('html', require('ejs').renderFile)
app.set('view engine', 'html')
app.set('views', path.join(__dirname, 'src', 'views'))

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(session({
  secret: process.env.SESSION_SECRET || 'knockknock-secret-change-before-deploy',
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

app.use('/student', noCache)
app.use('/lecturer', noCache)
app.use('/admin', noCache)
app.use('/courses', noCache)
app.use('/consultations', noCache)

app.get('/', showHomepage)

app.use((req, res, next) => {
  res.status(404).send(`
    <div style="text-align: center; margin-top: 50px; font-family: sans-serif;">
      <h1>404 - Page Not Found</h1>
      <p>Knock, knock! Who's there? Not this page unfortunately! We couldn't find the page you were looking for.</p>
      <a href="/">Go back home</a>
    </div>
  `);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
  })
}

module.exports = app