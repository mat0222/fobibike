const { Router } = require('express');
const { body, param, validationResult } = require('express-validator');
const invoicesController = require('../controllers/invoices.controller');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  INVOICE_TYPES,
  INVOICE_STATUSES,
  PAYMENT_METHODS,
} = require('../services/invoices.service');

const router = Router();

router.use(authenticate);

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Datos invalidos' });
  }
  return next();
}

router.get('/stats', asyncHandler(invoicesController.getStats));

router.get('/', asyncHandler(invoicesController.list));

router.get(
  '/:id',
  [param('id').isInt({ min: 1 })],
  handleValidation,
  asyncHandler(invoicesController.getById)
);

router.post(
  '/',
  [
    body('tipo').optional().isIn(INVOICE_TYPES),
    body('type').optional().isIn(INVOICE_TYPES),
    body('clienteNombre').optional().trim().isLength({ min: 2, max: 120 }),
    body('customerName').optional().trim().isLength({ min: 2, max: 120 }),
    body('metodoPago').optional().isIn(PAYMENT_METHODS),
    body('paymentMethod').optional().isIn(PAYMENT_METHODS),
    body('items').isArray({ min: 1 }),
  ],
  handleValidation,
  asyncHandler(invoicesController.create)
);

router.patch(
  '/:id/status',
  [
    param('id').isInt({ min: 1 }),
    body('estado').optional().isIn(INVOICE_STATUSES),
    body('status').optional().isIn(INVOICE_STATUSES),
  ],
  handleValidation,
  asyncHandler(invoicesController.updateStatus)
);

module.exports = router;
