const pool = require('../config/db');

const REPAIR_STATUSES = ['recepcionada', 'en_reparacion', 'lista', 'entregada', 'cancelada'];
const REPAIR_PRIORITIES = ['baja', 'media', 'alta', 'urgente'];
const REPAIR_TYPES = ['service', 'frenos', 'transmision', 'ruedas', 'electrico', 'diagnostico', 'garantia'];

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  error.expose = true;
  return error;
}

function mapRepair(row, items = []) {
  const labor = Number(row.labor);
  const parts = Number(row.parts);
  return {
    id: row.id,
    number: Number(row.number),
    status: row.status,
    priority: row.priority,
    type: row.type,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    bike: row.bike,
    color: row.color,
    issue: row.issue,
    technician: row.technician,
    receivedAt: row.receivedAt,
    promisedAt: row.promisedAt,
    deliveredAt: row.deliveredAt,
    labor,
    parts,
    total: Number(row.total),
    notes: row.notes,
    items,
  };
}

async function getItems(ids) {
  if (!ids.length) return new Map();
  const placeholders = ids.map(() => '?').join(',');
  const [rows] = await pool.execute(
    `SELECT id_item AS id, id_reparacion AS repairId, descripcion AS description,
            cantidad AS quantity, precio_unitario AS unitPrice, tipo AS kind
     FROM reparacion_items WHERE id_reparacion IN (${placeholders})`,
    ids
  );

  const grouped = new Map();
  for (const row of rows) {
    const list = grouped.get(row.repairId) || [];
    list.push({
      id: row.id,
      description: row.description,
      quantity: Number(row.quantity),
      unitPrice: Number(row.unitPrice),
      kind: row.kind,
    });
    grouped.set(row.repairId, list);
  }
  return grouped;
}

async function listRepairs(limit = 100) {
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);
  const [rows] = await pool.execute(
    `SELECT id_reparacion AS id, numero AS number, estado AS status, prioridad AS priority,
            tipo AS type, cliente_nombre AS customerName, cliente_telefono AS customerPhone,
            bicicleta AS bike, color, problema AS issue, tecnico AS technician,
            fecha_ingreso AS receivedAt, fecha_prometida AS promisedAt, fecha_entrega AS deliveredAt,
            mano_obra AS labor, repuestos AS parts, total, notas AS notes
     FROM reparaciones ORDER BY fecha_ingreso DESC, numero DESC LIMIT ${safeLimit}`
  );
  const itemsByRepair = await getItems(rows.map((row) => row.id));
  return rows.map((row) => mapRepair(row, itemsByRepair.get(row.id) || []));
}

async function getRepairById(id) {
  const [rows] = await pool.execute(
    `SELECT id_reparacion AS id, numero AS number, estado AS status, prioridad AS priority,
            tipo AS type, cliente_nombre AS customerName, cliente_telefono AS customerPhone,
            bicicleta AS bike, color, problema AS issue, tecnico AS technician,
            fecha_ingreso AS receivedAt, fecha_prometida AS promisedAt, fecha_entrega AS deliveredAt,
            mano_obra AS labor, repuestos AS parts, total, notas AS notes
     FROM reparaciones WHERE id_reparacion = ? LIMIT 1`,
    [id]
  );
  if (!rows.length) {
    throw createError('Orden de reparación no encontrada', 404);
  }
  const itemsByRepair = await getItems([rows[0].id]);
  return mapRepair(rows[0], itemsByRepair.get(rows[0].id) || []);
}

async function getStats() {
  const [[inShop]] = await pool.execute(
    `SELECT COUNT(*) AS count, COALESCE(SUM(total), 0) AS total
     FROM reparaciones WHERE estado IN ('recepcionada', 'en_reparacion')`
  );
  const [[ready]] = await pool.execute(
    `SELECT COUNT(*) AS count FROM reparaciones WHERE estado = 'lista'`
  );
  const [[delivered]] = await pool.execute(
    `SELECT COUNT(*) AS count, COALESCE(SUM(total), 0) AS total
     FROM reparaciones
     WHERE estado = 'entregada'
       AND YEAR(COALESCE(fecha_entrega, fecha_ingreso)) = YEAR(CURDATE())
       AND MONTH(COALESCE(fecha_entrega, fecha_ingreso)) = MONTH(CURDATE())`
  );
  const [[overdue]] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM reparaciones
     WHERE estado IN ('recepcionada', 'en_reparacion', 'lista')
       AND fecha_prometida IS NOT NULL
       AND fecha_prometida < CURDATE()`
  );

  return {
    inShop: { count: Number(inShop.count), total: Number(inShop.total) },
    ready: { count: Number(ready.count) },
    delivered: { count: Number(delivered.count), total: Number(delivered.total) },
    overdue: { count: Number(overdue.count) },
  };
}

async function createRepair(data) {
  const customerName = String(data.clienteNombre || data.customerName || '').trim();
  const bike = String(data.bicicleta || data.bike || '').trim();
  const issue = String(data.problema || data.issue || '').trim();
  if (customerName.length < 2) throw createError('Indica el nombre del cliente');
  if (bike.length < 2) throw createError('Indica la bicicleta');
  if (issue.length < 4) throw createError('Describe el problema');

  const type = data.tipo || data.type || 'service';
  const priority = data.prioridad || data.priority || 'media';
  if (!REPAIR_TYPES.includes(type)) throw createError('Tipo de trabajo no valido');
  if (!REPAIR_PRIORITIES.includes(priority)) throw createError('Prioridad no valida');

  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items = rawItems
    .map((item) => {
      const description = String(item.descripcion || item.description || '').trim();
      const quantity = Number(item.cantidad ?? item.quantity) || 1;
      const unitPrice = Number(item.precioUnitario ?? item.unitPrice) || 0;
      const kind = item.tipo || item.kind || 'mano_obra';
      if (!description) return null;
      return { description: description.slice(0, 150), quantity, unitPrice, kind: kind === 'repuesto' ? 'repuesto' : 'mano_obra' };
    })
    .filter(Boolean);

  const labor = items
    .filter((item) => item.kind === 'mano_obra')
    .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const parts = items
    .filter((item) => item.kind === 'repuesto')
    .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalLabor = labor || Number(data.manoObra ?? data.labor) || 0;
  const totalParts = parts || Number(data.repuestos ?? data.parts) || 0;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[next]] = await connection.execute(
      'SELECT COALESCE(MAX(numero), 0) + 1 AS nextNumber FROM reparaciones'
    );

    const [result] = await connection.execute(
      `INSERT INTO reparaciones
        (numero, estado, prioridad, tipo, cliente_nombre, cliente_telefono, bicicleta, color,
         problema, tecnico, fecha_ingreso, fecha_prometida, mano_obra, repuestos, total, notas)
       VALUES (?, 'recepcionada', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        next.nextNumber,
        priority,
        type,
        customerName,
        data.clienteTelefono || data.customerPhone || null,
        bike,
        data.color || null,
        issue,
        data.tecnico || data.technician || null,
        data.fechaIngreso || data.receivedAt || new Date(),
        data.fechaPrometida || data.promisedAt || null,
        totalLabor,
        totalParts,
        totalLabor + totalParts,
        data.notas || data.notes || null,
      ]
    );

    const repairId = result.insertId;
    for (const item of items) {
      await connection.execute(
        `INSERT INTO reparacion_items (id_reparacion, descripcion, cantidad, precio_unitario, tipo)
         VALUES (?, ?, ?, ?, ?)`,
        [repairId, item.description, item.quantity, item.unitPrice, item.kind]
      );
    }

    await connection.commit();
    return getRepairById(repairId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateStatus(id, status) {
  if (!REPAIR_STATUSES.includes(status)) {
    throw createError('Estado no valido');
  }

  await getRepairById(id);
  const [result] = await pool.execute(
    'UPDATE reparaciones SET estado = ?, fecha_entrega = CASE WHEN ? = \'entregada\' THEN COALESCE(fecha_entrega, CURDATE()) ELSE fecha_entrega END WHERE id_reparacion = ?',
    [status, status, id]
  );

  if (result.affectedRows === 0) {
    throw createError('Orden de reparación no encontrada', 404);
  }

  return getRepairById(id);
}

module.exports = {
  listRepairs,
  getRepairById,
  getStats,
  createRepair,
  updateStatus,
  REPAIR_STATUSES,
  REPAIR_PRIORITIES,
  REPAIR_TYPES,
};
