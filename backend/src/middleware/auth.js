const jwt = require('jsonwebtoken');
const { setAuthCookies } = require('../utils/cookies');

function verifyToken(token, secret) {
  return jwt.verify(token, secret);
}

function authenticate(req, res, next) {
  const accessToken = req.cookies?.access_token;

  if (!accessToken) {
    return res.status(401).json({ success: false, message: 'No autenticado' });
  }

  try {
    const payload = verifyToken(accessToken, process.env.JWT_ACCESS_SECRET);
    req.user = { id: payload.sub, usuario: payload.usuario };
    return next();
  } catch (error) {
    if (error.name !== 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Sesión inválida' });
    }
  }

  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Sesión expirada' });
  }

  try {
    const payload = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);

    const newAccessToken = jwt.sign(
      { sub: payload.sub, usuario: payload.usuario },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    setAuthCookies(res, newAccessToken, refreshToken);
    req.user = { id: payload.sub, usuario: payload.usuario };
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Sesión expirada' });
  }
}

function optionalAuthenticate(req, res, next) {
  const accessToken = req.cookies?.access_token;

  if (!accessToken) {
    req.user = null;
    return next();
  }

  try {
    const payload = verifyToken(accessToken, process.env.JWT_ACCESS_SECRET);
    req.user = { id: payload.sub, usuario: payload.usuario };
    return next();
  } catch (error) {
    if (error.name !== 'TokenExpiredError') {
      req.user = null;
      return next();
    }
  }

  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) {
    req.user = null;
    return next();
  }

  try {
    const payload = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    const newAccessToken = jwt.sign(
      { sub: payload.sub, usuario: payload.usuario },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
    setAuthCookies(res, newAccessToken, refreshToken);
    req.user = { id: payload.sub, usuario: payload.usuario };
    return next();
  } catch {
    req.user = null;
    return next();
  }
}

module.exports = { authenticate, optionalAuthenticate };
