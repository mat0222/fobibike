const suppliersService = require('../services/suppliers.service');

async function getAll(req, res) {
  const suppliers = await suppliersService.getAllSuppliers();
  return res.json({ success: true, data: suppliers });
}

module.exports = { getAll };
