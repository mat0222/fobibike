const { Router } = require('express');
const { body, param, validationResult } = require('express-validator');
const salesController = require('../controllers/sales.controller');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');
const { ALLOWED_CATEGORIES } = require('../utils/constants');
const { PAYMENT_METHODS } = require('../services/sales.service');

const router = Router();

router.use(authenticate);

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Datos invalidos' });
  }
  return next();
}

router.get('/stats', asyncHandler(salesController.getStats));

router.get('/', asyncHandler(salesController.getAll));

router.post(
  '/',
  [
    body('category').isIn(ALLOWED_CATEGORIES),
    body('code').trim().isLength({ min: 1, max: 20 }).matches(/^[a-zA-Z0-9_-]+$/),
    body('quantity').isInt({ min: 1 }),
    body('precioUnitario').isFloat({ min: 0 }),
    body('metodoPago').isIn(PAYMENT_METHODS),
    body('notas').optional().trim().isLength({ max: 255 }),
  ],
  handleValidation,
  asyncHandler(salesController.create)
);

router.delete(
  '/:id',
  [param('id').isInt({ min: 1 })],
  handleValidation,
  asyncHandler(salesController.remove)
);

module.exports = router;
