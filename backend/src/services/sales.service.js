const pool = require('../config/db');
const { PRODUCT_TABLES, ALLOWED_CATEGORIES } = require('../utils/constants');

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  error.expose = true;
  return error;
}

const PAYMENT_METHODS = ['contado', 'plazo', 'transferencia', 'tarjeta'];

async function decreaseStockWithConnection(connection, category, code, quantity) {
  const cols = PRODUCT_TABLES[category];
  const [rows] = await connection.execute(
    `SELECT ${cols.stock} AS stock FROM ${category} WHERE ${cols.code} = ? LIMIT 1`,
    [code]
  );

  if (rows.length === 0) {
    throw createError('Producto no encontrado', 404);
  }

  const currentStock = Number(rows[0].stock);
  if (currentStock < quantity) {
    throw createError(`Stock insuficiente. Disponible: ${currentStock}`, 400);
  }

  await connection.execute(
    `UPDATE ${category} SET ${cols.stock} = ${cols.stock} - ? WHERE ${cols.code} = ?`,
    [quantity, code]
  );
}

async function createSale(data) {
  const {
    category,
    code,
    quantity,
    precioUnitario,
    metodoPago,
    notas,
  } = data;

  if (!ALLOWED_CATEGORIES.includes(category)) {
    throw createError('Categoria no valida');
  }

  if (!PAYMENT_METHODS.includes(metodoPago)) {
    throw createError('Metodo de pago no valido');
  }

  const cols = PRODUCT_TABLES[category];
  const [products] = await pool.execute(
    `SELECT ${cols.name} AS name FROM ${category} WHERE ${cols.code} = ? LIMIT 1`,
    [code]
  );

  if (products.length === 0) {
    throw createError('Producto no encontrado', 404);
  }

  const qty = Number(quantity);
  const unitPrice = Number(precioUnitario);
  const total = qty * unitPrice;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await decreaseStockWithConnection(connection, category, code, qty);

    const [result] = await connection.execute(
      `INSERT INTO ventas
        (codigo_producto, categoria, nombre_producto, cantidad, precio_unitario, total, metodo_pago, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, category, products[0].name, qty, unitPrice, total, metodoPago, notas || null]
    );

    await connection.commit();

    return {
      id: result.insertId,
      code,
      category,
      productName: products[0].name,
      quantity: qty,
      unitPrice,
      total,
      paymentMethod: metodoPago,
      notes: notas || null,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getSales(limit = 50) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const [rows] = await pool.execute(
    `SELECT id_venta AS id, codigo_producto AS code, categoria AS category,
            nombre_producto AS productName, cantidad AS quantity,
            precio_unitario AS unitPrice, total, metodo_pago AS paymentMethod,
            fecha AS date, notas AS notes
     FROM ventas ORDER BY fecha DESC LIMIT ${safeLimit}`
  );

  return rows.map((row) => ({
    ...row,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unitPrice),
    total: Number(row.total),
  }));
}

async function getStats() {
  const [[today]] = await pool.execute(
    `SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS count
     FROM ventas WHERE DATE(fecha) = CURDATE()`
  );

  const [[week]] = await pool.execute(
    `SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS count
     FROM ventas WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`
  );

  const [[month]] = await pool.execute(
    `SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS count
     FROM ventas WHERE YEAR(fecha) = YEAR(CURDATE()) AND MONTH(fecha) = MONTH(CURDATE())`
  );

  const [[allTime]] = await pool.execute(
    `SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS count FROM ventas`
  );

  const [byCategory] = await pool.execute(
    `SELECT categoria AS category, COALESCE(SUM(total), 0) AS total, COUNT(*) AS count
     FROM ventas
     WHERE YEAR(fecha) = YEAR(CURDATE()) AND MONTH(fecha) = MONTH(CURDATE())
     GROUP BY categoria ORDER BY total DESC`
  );

  const [byPayment] = await pool.execute(
    `SELECT metodo_pago AS method, COALESCE(SUM(total), 0) AS total, COUNT(*) AS count
     FROM ventas
     WHERE YEAR(fecha) = YEAR(CURDATE()) AND MONTH(fecha) = MONTH(CURDATE())
     GROUP BY metodo_pago ORDER BY total DESC`
  );

  const [dailyLast7] = await pool.execute(
    `SELECT DATE(fecha) AS date, COALESCE(SUM(total), 0) AS total, COUNT(*) AS count
     FROM ventas
     WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY DATE(fecha) ORDER BY date ASC`
  );

  return {
    today: { total: Number(today.total), count: Number(today.count) },
    week: { total: Number(week.total), count: Number(week.count) },
    month: { total: Number(month.total), count: Number(month.count) },
    allTime: { total: Number(allTime.total), count: Number(allTime.count) },
    byCategory: byCategory.map((r) => ({
      category: r.category,
      total: Number(r.total),
      count: Number(r.count),
    })),
    byPayment: byPayment.map((r) => ({
      method: r.method,
      total: Number(r.total),
      count: Number(r.count),
    })),
    dailyLast7: dailyLast7.map((r) => ({
      date: r.date,
      total: Number(r.total),
      count: Number(r.count),
    })),
  };
}

async function deleteSale(id) {
  const [result] = await pool.execute('DELETE FROM ventas WHERE id_venta = ?', [id]);
  if (result.affectedRows === 0) {
    throw createError('Venta no encontrada', 404);
  }
  return { id };
}

module.exports = {
  createSale,
  getSales,
  getStats,
  deleteSale,
  PAYMENT_METHODS,
};
