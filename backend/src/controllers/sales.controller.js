const salesService = require('../services/sales.service');

async function create(req, res) {
  const sale = await salesService.createSale({
    category: req.body.category,
    code: req.body.code.trim(),
    quantity: req.body.quantity,
    precioUnitario: req.body.precioUnitario,
    metodoPago: req.body.metodoPago,
    notas: req.body.notas?.trim() || null,
  });

  return res.status(201).json({
    success: true,
    message: 'Venta registrada',
    data: sale,
  });
}

async function getAll(req, res) {
  const limit = req.query.limit || 50;
  const sales = await salesService.getSales(limit);
  return res.json({ success: true, data: sales });
}

async function getStats(req, res) {
  const stats = await salesService.getStats();
  return res.json({ success: true, data: stats });
}

async function remove(req, res) {
  await salesService.deleteSale(req.params.id);
  return res.json({ success: true, message: 'Venta eliminada' });
}

module.exports = { create, getAll, getStats, remove };
