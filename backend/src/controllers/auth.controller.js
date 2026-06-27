const authService = require('../services/auth.service');

async function register(req, res) {
  const user = await authService.register(req.body);
  res.status(201).json({ user });
}

async function login(req, res) {
  const result = await authService.login(req.body);
  res.json(result);
}

async function changeInitialPassword(req, res) {
  const result = await authService.changeInitialPassword(
      req.user.userId,
      req.body
  );

  res.json(result);
}

module.exports = {
  register,
  login,
  changeInitialPassword,
};
