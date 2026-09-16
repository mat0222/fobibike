const repairsService = require('../services/repairs.service');

async function list(req, res) {
  const repairs = await repairsService.listRepairs(req.query.limit || 100);
  return res.json({ success: true, data: repairs });
}

async function getById(req, res) {
  const repair = await repairsService.getRepairById(req.params.id);
  return res.json({ success: true, data: repair });
}

async function getStats(_req, res) {
  const stats = await repairsService.getStats();
  return res.json({ success: true, data: stats });
}

async function create(req, res) {
  const repair = await repairsService.createRepair(req.body);
  return res.status(201).json({
    success: true,
    message: 'Orden de reparación creada',
    data: repair,
  });
}

async function updateStatus(req, res) {
  const repair = await repairsService.updateStatus(req.params.id, req.body.estado || req.body.status);
  return res.json({
    success: true,
    message: 'Estado actualizado',
    data: repair,
  });
}

module.exports = { list, getById, getStats, create, updateStatus };
