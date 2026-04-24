const express = require('express');
const session = require('express-session');
const path    = require('path');

const dashboardRoutes    = require('./src/routes/dashboard-routes');

const app  = express();
const PORT = process.env.PORT || 3000;

// Treat .html files as EJS templates
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'src', 'views'));


app.use(express.urlencoded({ extended: false }));

// Session
app.use(session({
  secret: 'knockknock-secret-change-before-deploy',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,           
    maxAge: 1000 * 60 * 60 * 8
  }
}));

app.use('/', dashboardRoutes);

app.get('/', (req, res) => {
  return res.render('homepage');
});

// ── Start ─────────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;