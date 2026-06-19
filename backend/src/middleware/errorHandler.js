function errorHandler(err, req, res, _next) {
  console.error('[Error]', err.message);

  const status = err.status || 500;
  const isClientError = status >= 400 && status < 500 && err.expose;

  const message = isClientError ? err.message : 'Error interno del servidor';

  res.status(status).json({ success: false, message });
}

module.exports = { errorHandler };
