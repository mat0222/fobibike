const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function findUserByUsername(usuario) {
  const [rows] = await pool.execute(
    'SELECT id, usuario, password FROM usuarios WHERE usuario = ? LIMIT 1',
    [usuario]
  );
  return rows[0] || null;
}

async function validateCredentials(usuario, password) {
  const user = await findUserByUsername(usuario);
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;

  return { id: user.id, usuario: user.usuario };
}

function generateTokens(user) {
  const payload = { sub: user.id, usuario: user.usuario };

  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });

  return { accessToken, refreshToken };
}

module.exports = { validateCredentials, generateTokens, findUserByUsername };
