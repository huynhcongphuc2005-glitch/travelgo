const authService = require('../services/auth.service');

exports.register = (req, res) => {
  res.status(201).json(authService.register(req.body || {}));
};

exports.login = (req, res) => {
  res.json(authService.login(req.body || {}));
};

exports.me = (req, res) => {
  res.json({ user: authService.getProfile(req.user.id) });
};
