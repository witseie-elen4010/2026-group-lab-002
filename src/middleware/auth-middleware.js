// Middleware to require authentication
const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  } else {
    return res.redirect('/login');
  }
};

// Middleware to require specific role
const requireRole = (role) => {
  return (req, res, next) => {
    if (req.session && req.session.userRole === role) {
      return next();
    } else {
      return res.status(403).send('Forbidden');
    }
  };
};

module.exports = { requireAuth, requireRole };