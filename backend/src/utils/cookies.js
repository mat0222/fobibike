const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 minutos
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 días

function getCookieOptions(maxAge) {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge,
    path: '/',
  };
}

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie('access_token', accessToken, getCookieOptions(ACCESS_TOKEN_MAX_AGE));
  res.cookie('refresh_token', refreshToken, getCookieOptions(REFRESH_TOKEN_MAX_AGE));
}

function clearAuthCookies(res) {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
}

module.exports = {
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
  setAuthCookies,
  clearAuthCookies,
};
