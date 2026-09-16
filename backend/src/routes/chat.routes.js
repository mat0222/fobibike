const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const chatController = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');

const router = Router();

router.use(authenticate);

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados mensajes. Espera un momento.' },
});

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Datos invalidos' });
  }
  return next();
}

router.post(
  '/',
  chatLimiter,
  [
    body('messages').isArray({ min: 1, max: 20 }),
    body('messages.*.role').isIn(['user', 'assistant']),
    body('messages.*.content').isString().isLength({ min: 1, max: 2000 }),
  ],
  handleValidation,
  asyncHandler(chatController.sendMessage)
);

module.exports = router;
