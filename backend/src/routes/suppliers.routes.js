const { Router } = require('express');
const suppliersController = require('../controllers/suppliers.controller');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');

const router = Router();

router.use(authenticate);
router.get('/', asyncHandler(suppliersController.getAll));

module.exports = router;
