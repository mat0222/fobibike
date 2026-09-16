const { Router } = require('express');
const { body, param, validationResult } = require('express-validator');
const productsController = require('../controllers/products.controller');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');
const { ALLOWED_CATEGORIES } = require('../utils/constants');

const router = Router();

router.use(authenticate);

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Datos invalidos' });
  }
  return next();
}

const categoryParam = param('category').isIn(ALLOWED_CATEGORIES);
const codeParam = param('code').trim().isLength({ min: 1, max: 20 }).matches(/^[a-zA-Z0-9_-]+$/);

const updateValidators = [
  categoryParam,
  codeParam,
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('type').trim().isLength({ min: 1, max: 50 }),
  body('price').isFloat({ min: 0 }),
  body('installmentPrice').isFloat({ min: 0 }),
  body('stock').isInt({ min: 0 }),
  body('supplier').isInt({ min: 1 }),
];

const createValidators = [
  body('category').isIn(ALLOWED_CATEGORIES),
  body('code').trim().isLength({ min: 1, max: 20 }).matches(/^[a-zA-Z0-9_-]+$/),
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('type').trim().isLength({ min: 1, max: 50 }),
  body('price').isFloat({ min: 0 }),
  body('installmentPrice').isFloat({ min: 0 }),
  body('stock').isInt({ min: 0 }),
  body('supplier').isInt({ min: 1 }),
];

router.get('/', asyncHandler(productsController.getAll));

router.post('/', createValidators, handleValidation, asyncHandler(productsController.create));

router.get(
  '/meta/types/:category',
  [categoryParam],
  handleValidation,
  asyncHandler(productsController.getTypes)
);

router.put(
  '/:category/:code',
  updateValidators,
  handleValidation,
  asyncHandler(productsController.update)
);

router.delete(
  '/:category/:code',
  [categoryParam, codeParam],
  handleValidation,
  asyncHandler(productsController.remove)
);

router.get(
  '/:category',
  [categoryParam],
  handleValidation,
  asyncHandler(productsController.getByCategory)
);

module.exports = router;
