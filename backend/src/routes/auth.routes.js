const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos. Esperá 15 minutos.' },
});

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Datos inválidos' });
  }
  return next();
}

router.post(
  '/login',
  loginLimiter,
  [
    body('usuario').trim().isLength({ min: 3, max: 50 }),
    body('password').isLength({ min: 4, max: 128 }),
  ],
  handleValidation,
  asyncHandler(authController.login)
);

router.post('/logout', asyncHandler(authController.logout));
router.get('/me', optionalAuthenticate, asyncHandler(authController.me));

module.exports = router;
