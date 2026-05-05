const showAdminDashboard = (req, res) => {
  const user = { id: req.session.userId, name: req.session.userName, role: req.session.userRole };
  res.render('admin-dashboard', { user });
};

module.exports = { showAdminDashboard };
