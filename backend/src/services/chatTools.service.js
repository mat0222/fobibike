const pool = require('../config/db');
const { PRODUCT_TABLES, ALLOWED_CATEGORIES } = require('../utils/constants');

async function searchProducts(query, category = null, limit = 8) {
  const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 15);
  const term = `%${query.trim()}%`;
  const categories = category && ALLOWED_CATEGORIES.includes(category)
    ? [category]
    : ALLOWED_CATEGORIES;

  const results = [];

  for (const tableName of categories) {
    const cols = PRODUCT_TABLES[tableName];
    const sql = `
      SELECT
        t.${cols.code} AS code,
        t.${cols.name} AS name,
        t.${cols.type} AS type,
        t.${cols.price} AS price,
        t.${cols.installmentPrice} AS installmentPrice,
        t.${cols.stock} AS stock
      FROM ${tableName} t
      WHERE t.${cols.name} LIKE ? OR t.${cols.code} LIKE ?
      LIMIT ${safeLimit}
    `;

    const [rows] = await pool.execute(sql, [term, term]);
    rows.forEach((row) => {
      results.push({
        code: row.code,
        name: row.name,
        category: tableName,
        type: row.type,
        price: Number(row.price),
        installmentPrice: Number(row.installmentPrice),
        stock: Number(row.stock),
      });
    });
  }

  return results.slice(0, safeLimit);
}

async function getProductByCode(code, category = null) {
  const categories = category && ALLOWED_CATEGORIES.includes(category)
    ? [category]
    : ALLOWED_CATEGORIES;

  for (const tableName of categories) {
    const cols = PRODUCT_TABLES[tableName];
    const [rows] = await pool.execute(
      `SELECT
        t.${cols.code} AS code,
        t.${cols.name} AS name,
        t.${cols.type} AS type,
        t.${cols.price} AS price,
        t.${cols.installmentPrice} AS installmentPrice,
        t.${cols.stock} AS stock,
        t.${cols.supplier} AS supplier,
        p.nombre AS supplierName
       FROM ${tableName} t
       LEFT JOIN proveedores p ON p.id_proveedor = t.${cols.supplier}
       WHERE t.${cols.code} = ?
       LIMIT 1`,
      [code]
    );

    if (rows.length > 0) {
      return {
        ...rows[0],
        category: tableName,
        price: Number(rows[0].price),
        installmentPrice: Number(rows[0].installmentPrice),
        stock: Number(rows[0].stock),
        supplier: Number(rows[0].supplier),
      };
    }
  }

  return null;
}

async function getLowStockProducts(threshold = 5, limit = 10) {
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 20);
  const safeThreshold = Math.max(Number(threshold) || 5, 0);
  const results = [];

  for (const tableName of ALLOWED_CATEGORIES) {
    const cols = PRODUCT_TABLES[tableName];
    const [rows] = await pool.execute(
      `SELECT
        t.${cols.code} AS code,
        t.${cols.name} AS name,
        t.${cols.stock} AS stock,
        t.${cols.price} AS price
       FROM ${tableName} t
       WHERE t.${cols.stock} <= ?
       ORDER BY t.${cols.stock} ASC
       LIMIT ${safeLimit}`,
      [safeThreshold]
    );

    rows.forEach((row) => {
      results.push({
        code: row.code,
        name: row.name,
        category: tableName,
        stock: Number(row.stock),
        price: Number(row.price),
      });
    });
  }

  return results
    .sort((a, b) => a.stock - b.stock)
    .slice(0, safeLimit);
}

async function getTopProductsByPrice(order = 'desc', category = null, limit = 5) {
  const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 10);
  const direction = order === 'asc' ? 'ASC' : 'DESC';
  const categories = category && ALLOWED_CATEGORIES.includes(category)
    ? [category]
    : ALLOWED_CATEGORIES;
  const perTableLimit = category ? safeLimit : 3;
  const results = [];

  for (const tableName of categories) {
    const cols = PRODUCT_TABLES[tableName];
    const [rows] = await pool.execute(
      `SELECT
        t.${cols.code} AS code,
        t.${cols.name} AS name,
        t.${cols.type} AS type,
        t.${cols.price} AS price,
        t.${cols.installmentPrice} AS installmentPrice,
        t.${cols.stock} AS stock
       FROM ${tableName} t
       WHERE t.${cols.price} > 0
       ORDER BY t.${cols.price} ${direction}
       LIMIT ${perTableLimit}`
    );

    rows.forEach((row) => {
      results.push({
        code: row.code,
        name: row.name,
        category: tableName,
        type: row.type,
        price: Number(row.price),
        installmentPrice: Number(row.installmentPrice),
        stock: Number(row.stock),
      });
    });
  }

  return results
    .sort((a, b) => (order === 'asc' ? a.price - b.price : b.price - a.price))
    .slice(0, safeLimit);
}

module.exports = { searchProducts, getProductByCode, getLowStockProducts, getTopProductsByPrice };
