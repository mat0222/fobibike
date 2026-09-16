const { Router } = require('express');
const { body, param, validationResult } = require('express-validator');
const repairsController = require('../controllers/repairs.controller');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  REPAIR_STATUSES,
  REPAIR_PRIORITIES,
  REPAIR_TYPES,
} = require('../services/repairs.service');

const router = Router();

router.use(authenticate);

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Datos invalidos' });
  }
  return next();
}

router.get('/stats', asyncHandler(repairsController.getStats));
router.get('/', asyncHandler(repairsController.list));

router.get(
  '/:id',
  [param('id').isInt({ min: 1 })],
  handleValidation,
  asyncHandler(repairsController.getById)
);

router.post(
  '/',
  [
    body('tipo').optional().isIn(REPAIR_TYPES),
    body('type').optional().isIn(REPAIR_TYPES),
    body('prioridad').optional().isIn(REPAIR_PRIORITIES),
    body('priority').optional().isIn(REPAIR_PRIORITIES),
    body('clienteNombre').optional().trim().isLength({ min: 2, max: 120 }),
    body('customerName').optional().trim().isLength({ min: 2, max: 120 }),
    body('items').optional().isArray(),
  ],
  handleValidation,
  asyncHandler(repairsController.create)
);

router.patch(
  '/:id/status',
  [
    param('id').isInt({ min: 1 }),
    body('estado').optional().isIn(REPAIR_STATUSES),
    body('status').optional().isIn(REPAIR_STATUSES),
  ],
  handleValidation,
  asyncHandler(repairsController.updateStatus)
);

module.exports = router;
