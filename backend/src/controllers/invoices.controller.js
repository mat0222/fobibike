const invoicesService = require('../services/invoices.service');

async function list(req, res) {
  const invoices = await invoicesService.listInvoices(req.query.limit || 100);
  return res.json({ success: true, data: invoices });
}

async function getById(req, res) {
  const invoice = await invoicesService.getInvoiceById(req.params.id);
  return res.json({ success: true, data: invoice });
}

async function getStats(_req, res) {
  const stats = await invoicesService.getStats();
  return res.json({ success: true, data: stats });
}

async function create(req, res) {
  const invoice = await invoicesService.createInvoice(req.body);
  return res.status(201).json({
    success: true,
    message: 'Factura emitida',
    data: invoice,
  });
}

async function updateStatus(req, res) {
  const invoice = await invoicesService.updateStatus(req.params.id, req.body.estado || req.body.status);
  return res.json({
    success: true,
    message: 'Estado actualizado',
    data: invoice,
  });
}

module.exports = { list, getById, getStats, create, updateStatus };
