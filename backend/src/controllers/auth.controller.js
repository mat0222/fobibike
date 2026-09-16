const authService = require('../services/auth.service');
const { setAuthCookies, clearAuthCookies } = require('../utils/cookies');

async function login(req, res) {
  const { usuario, password } = req.body;

  let user;
  try {
    user = await authService.validateCredentials(usuario, password);
  } catch {
    return res.status(503).json({ success: false, message: 'Servicio no disponible' });
  }
  if (!user) {
    return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
  }

  const { accessToken, refreshToken } = authService.generateTokens(user);
  setAuthCookies(res, accessToken, refreshToken);

  return res.json({
    success: true,
    user: { usuario: user.usuario },
  });
}

async function logout(_req, res) {
  clearAuthCookies(res);
  return res.json({ success: true, message: 'Sesión cerrada' });
}

async function me(req, res) {
  if (!req.user) {
    return res.json({ success: true, user: null });
  }

  return res.json({
    success: true,
    user: { usuario: req.user.usuario },
  });
}

module.exports = { login, logout, me };
