const pool = require('../config/db');

const INVOICE_TYPES = ['A', 'B', 'C'];
const INVOICE_STATUSES = ['emitida', 'pagada', 'vencida', 'anulada'];
const PAYMENT_METHODS = ['contado', 'plazo', 'transferencia', 'tarjeta'];

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  error.expose = true;
  return error;
}

function computeTotals(items, type) {
  const total = items.reduce((sum, item) => {
    const qty = Number(item.cantidad ?? item.quantity) || 0;
    const price = Number(item.precioUnitario ?? item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  if (type === 'C') {
    return { subtotal: Math.round(total), tax: 0, total: Math.round(total) };
  }

  const roundedTotal = Math.round(total);
  const subtotal = Math.round(roundedTotal / 1.21);
  return { subtotal, tax: roundedTotal - subtotal, total: roundedTotal };
}

function generateCae() {
  return String(74192836000000 + Math.floor(Math.random() * 900000));
}

function addDays(date, days) {
  const raw = typeof date === 'string' ? date.slice(0, 10) : null;
  const base = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T12:00:00`)
    : new Date(date);
  base.setDate(base.getDate() + days);
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, '0');
  const day = String(base.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function mapInvoice(row, items = []) {
  return {
    id: row.id,
    number: Number(row.number),
    pos: Number(row.pos),
    type: row.type,
    status: row.status,
    customerName: row.customerName,
    customerDoc: row.customerDoc,
    customerCondition: row.customerCondition,
    date: row.date,
    dueDate: row.dueDate,
    paymentMethod: row.paymentMethod,
    subtotal: Number(row.subtotal),
    tax: Number(row.tax),
    total: Number(row.total),
    cae: row.cae,
    caeDue: row.caeDue,
    notes: row.notes,
    saleId: row.saleId,
    items,
  };
}

async function markOverdue() {
  await pool.execute(
    `UPDATE facturas
     SET estado = 'vencida'
     WHERE estado = 'emitida'
       AND vencimiento IS NOT NULL
       AND vencimiento < CURDATE()`
  );
}

async function getInvoiceItems(ids) {
  if (!ids.length) return new Map();
  const placeholders = ids.map(() => '?').join(',');
  const [rows] = await pool.execute(
    `SELECT id_item AS id, id_factura AS invoiceId, descripcion AS description,
            cantidad AS quantity, precio_unitario AS unitPrice, iva_pct AS taxPct, subtotal
     FROM factura_items WHERE id_factura IN (${placeholders})`,
    ids
  );

  const grouped = new Map();
  for (const row of rows) {
    const list = grouped.get(row.invoiceId) || [];
    list.push({
      id: row.id,
      description: row.description,
      quantity: Number(row.quantity),
      unitPrice: Number(row.unitPrice),
      taxPct: Number(row.taxPct),
      subtotal: Number(row.subtotal),
    });
    grouped.set(row.invoiceId, list);
  }
  return grouped;
}

async function listInvoices(limit = 100) {
  await markOverdue();
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);
  const [rows] = await pool.execute(
    `SELECT id_factura AS id, numero AS number, punto_venta AS pos, tipo AS type,
            estado AS status, cliente_nombre AS customerName, cliente_doc AS customerDoc,
            cliente_condicion AS customerCondition, fecha AS date, vencimiento AS dueDate,
            metodo_pago AS paymentMethod, subtotal, iva AS tax, total, cae, cae_vto AS caeDue,
            notas AS notes, id_venta AS saleId
     FROM facturas ORDER BY fecha DESC, numero DESC LIMIT ${safeLimit}`
  );

  const itemsByInvoice = await getInvoiceItems(rows.map((row) => row.id));
  return rows.map((row) => mapInvoice(row, itemsByInvoice.get(row.id) || []));
}

async function getInvoiceById(id) {
  await markOverdue();
  const [rows] = await pool.execute(
    `SELECT id_factura AS id, numero AS number, punto_venta AS pos, tipo AS type,
            estado AS status, cliente_nombre AS customerName, cliente_doc AS customerDoc,
            cliente_condicion AS customerCondition, fecha AS date, vencimiento AS dueDate,
            metodo_pago AS paymentMethod, subtotal, iva AS tax, total, cae, cae_vto AS caeDue,
            notas AS notes, id_venta AS saleId
     FROM facturas WHERE id_factura = ? LIMIT 1`,
    [id]
  );

  if (!rows.length) {
    throw createError('Factura no encontrada', 404);
  }

  const itemsByInvoice = await getInvoiceItems([rows[0].id]);
  return mapInvoice(rows[0], itemsByInvoice.get(rows[0].id) || []);
}

async function getStats() {
  await markOverdue();

  const [[month]] = await pool.execute(
    `SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS count
     FROM facturas
     WHERE estado <> 'anulada'
       AND YEAR(fecha) = YEAR(CURDATE()) AND MONTH(fecha) = MONTH(CURDATE())`
  );

  const [[collected]] = await pool.execute(
    `SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS count
     FROM facturas
     WHERE estado = 'pagada'
       AND YEAR(fecha) = YEAR(CURDATE()) AND MONTH(fecha) = MONTH(CURDATE())`
  );

  const [[pending]] = await pool.execute(
    `SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS count
     FROM facturas WHERE estado = 'emitida'`
  );

  const [[overdue]] = await pool.execute(
    `SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS count
     FROM facturas WHERE estado = 'vencida'`
  );

  const [monthly] = await pool.execute(
    `SELECT DATE_FORMAT(fecha, '%Y-%m') AS monthKey,
            COALESCE(SUM(CASE WHEN estado <> 'anulada' THEN total ELSE 0 END), 0) AS total,
            COUNT(CASE WHEN estado <> 'anulada' THEN 1 END) AS count
     FROM facturas
     WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
     GROUP BY DATE_FORMAT(fecha, '%Y-%m')
     ORDER BY monthKey ASC`
  );

  const [byType] = await pool.execute(
    `SELECT tipo AS type, COALESCE(SUM(total), 0) AS total, COUNT(*) AS count
     FROM facturas
     WHERE estado <> 'anulada'
       AND YEAR(fecha) = YEAR(CURDATE()) AND MONTH(fecha) = MONTH(CURDATE())
     GROUP BY tipo`
  );

  return {
    month: { total: Number(month.total), count: Number(month.count) },
    collected: { total: Number(collected.total), count: Number(collected.count) },
    pending: { total: Number(pending.total), count: Number(pending.count) },
    overdue: { total: Number(overdue.total), count: Number(overdue.count) },
    monthly: monthly.map((row) => ({
      month: row.monthKey,
      total: Number(row.total),
      count: Number(row.count),
    })),
    byType: byType.map((row) => ({
      type: row.type,
      total: Number(row.total),
      count: Number(row.count),
    })),
  };
}

async function createInvoice(data) {
  const type = String(data.tipo || data.type || 'B').toUpperCase();
  if (!INVOICE_TYPES.includes(type)) {
    throw createError('Tipo de comprobante no valido');
  }

  const paymentMethod = data.metodoPago || data.paymentMethod || 'contado';
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    throw createError('Metodo de pago no valido');
  }

  const customerName = String(data.clienteNombre || data.customerName || '').trim();
  if (customerName.length < 2) {
    throw createError('Indica el nombre del cliente');
  }

  const rawItems = Array.isArray(data.items) ? data.items : [];
  if (!rawItems.length) {
    throw createError('La factura debe tener al menos un item');
  }

  const items = rawItems.map((item) => {
    const description = String(item.descripcion || item.description || '').trim();
    const quantity = Number(item.cantidad ?? item.quantity);
    const unitPrice = Number(item.precioUnitario ?? item.unitPrice);
    if (!description || quantity < 1 || unitPrice < 0) {
      throw createError('Hay un item incompleto');
    }
    return {
      description: description.slice(0, 150),
      quantity,
      unitPrice,
      taxPct: type === 'C' ? 0 : 21,
      subtotal: Math.round(quantity * unitPrice),
    };
  });

  const totals = computeTotals(items, type);
  const pos = Number(data.puntoVenta || data.pos || 1);
  const date = data.fecha || data.date || new Date();
  const dueDate = data.vencimiento || data.dueDate || null;
  const notes = data.notas || data.notes || null;
  const saleId = data.idVenta || data.saleId || null;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [[next]] = await connection.execute(
      `SELECT COALESCE(MAX(numero), 0) + 1 AS nextNumber
       FROM facturas WHERE punto_venta = ? AND tipo = ?`,
      [pos, type]
    );

    const cae = generateCae();
    const caeDue = addDays(date, 10);

    const [result] = await connection.execute(
      `INSERT INTO facturas
        (numero, punto_venta, tipo, estado, cliente_nombre, cliente_doc, cliente_condicion,
         fecha, vencimiento, subtotal, iva, total, metodo_pago, cae, cae_vto, notas, id_venta)
       VALUES (?, ?, ?, 'emitida', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        next.nextNumber,
        pos,
        type,
        customerName,
        data.clienteDoc || data.customerDoc || null,
        data.clienteCondicion || data.customerCondition || 'Consumidor Final',
        date,
        dueDate,
        totals.subtotal,
        totals.tax,
        totals.total,
        paymentMethod,
        cae,
        caeDue,
        notes,
        saleId,
      ]
    );

    const invoiceId = result.insertId;
    for (const item of items) {
      await connection.execute(
        `INSERT INTO factura_items
          (id_factura, descripcion, cantidad, precio_unitario, iva_pct, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [invoiceId, item.description, item.quantity, item.unitPrice, item.taxPct, item.subtotal]
      );
    }

    await connection.commit();
    return getInvoiceById(invoiceId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateStatus(id, status) {
  if (!INVOICE_STATUSES.includes(status)) {
    throw createError('Estado no valido');
  }

  const invoice = await getInvoiceById(id);
  if (invoice.status === 'anulada' && status !== 'anulada') {
    throw createError('No se puede reactivar una factura anulada');
  }

  const [result] = await pool.execute(
    'UPDATE facturas SET estado = ? WHERE id_factura = ?',
    [status, id]
  );

  if (result.affectedRows === 0) {
    throw createError('Factura no encontrada', 404);
  }

  return getInvoiceById(id);
}

module.exports = {
  listInvoices,
  getInvoiceById,
  getStats,
  createInvoice,
  updateStatus,
  INVOICE_TYPES,
  INVOICE_STATUSES,
  PAYMENT_METHODS,
};
