// Middleware to require authentication
const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
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