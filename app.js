const express = require('express')
const session = require('express-session')
const path = require('path')

const authRoutes      = require('./src/routes/auth-routes');
const dashboardRoutes = require('./src/routes/dashboard-routes')
const signupRoutes    = require('./src/routes/signup-routes')

const app  = express()
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

app.get('/', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/lecturer/dashboard');
  }
  return res.render('homepage');
})

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
  })
}

module.exports = app
