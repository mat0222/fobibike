const pool = require('../config/db');
const { PRODUCT_TABLES, ALLOWED_CATEGORIES, CATEGORY_TYPES } = require('../utils/constants');

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  error.expose = true;
  return error;
}

async function fetchProductsFromTable(tableName, cols) {
  const sql = `
    SELECT
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
  `;

  const [rows] = await pool.execute(sql);

  return rows.map((row) => ({
    ...row,
    category: cols.category,
    price: Number(row.price),
    installmentPrice: Number(row.installmentPrice),
    stock: Number(row.stock),
    supplier: Number(row.supplier),
  }));
}

async function getAllProducts() {
  const products = [];

  for (const tableName of ALLOWED_CATEGORIES) {
    const cols = PRODUCT_TABLES[tableName];
    const tableProducts = await fetchProductsFromTable(tableName, cols);
    products.push(...tableProducts);
  }

  return products;
}

async function getProductsByCategory(category) {
  if (!ALLOWED_CATEGORIES.includes(category)) {
    const error = new Error('Categoría no válida');
    error.status = 400;
    error.expose = true;
    throw error;
  }

  const cols = PRODUCT_TABLES[category];
  return fetchProductsFromTable(category, cols);
}

async function createProduct(data) {
  const { category, code, name, type, price, installmentPrice, stock, supplier } = data;

  if (!ALLOWED_CATEGORIES.includes(category)) {
    throw createError('Categoria no valida');
  }

  const allowedTypes = CATEGORY_TYPES[category];
  if (!allowedTypes.includes(type)) {
    throw createError('Tipo de producto no valido para esta categoria');
  }

  const cols = PRODUCT_TABLES[category];
  const [existing] = await pool.execute(
    `SELECT ${cols.code} FROM ${category} WHERE ${cols.code} = ? LIMIT 1`,
    [code]
  );

  if (existing.length > 0) {
    throw createError('Ya existe un producto con ese codigo en esta categoria', 409);
  }

  const sql = `
    INSERT INTO ${category}
      (${cols.code}, ${cols.name}, ${cols.type}, ${cols.price}, ${cols.installmentPrice}, ${cols.stock}, ${cols.supplier})
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  await pool.execute(sql, [
    code,
    name,
    type,
    price,
    installmentPrice,
    stock,
    supplier,
  ]);

  return { code, category, name, type, price, installmentPrice, stock, supplier };
}

async function updateProduct(category, code, data) {
  if (!ALLOWED_CATEGORIES.includes(category)) {
    throw createError('Categoria no valida');
  }

  const allowedTypes = CATEGORY_TYPES[category];
  if (!allowedTypes.includes(data.type)) {
    throw createError('Tipo de producto no valido para esta categoria');
  }

  const cols = PRODUCT_TABLES[category];
  const sql = `
    UPDATE ${category} SET
      ${cols.name} = ?,
      ${cols.type} = ?,
      ${cols.price} = ?,
      ${cols.installmentPrice} = ?,
      ${cols.stock} = ?,
      ${cols.supplier} = ?
    WHERE ${cols.code} = ?
  `;

  const [result] = await pool.execute(sql, [
    data.name,
    data.type,
    data.price,
    data.installmentPrice,
    data.stock,
    data.supplier,
    code,
  ]);

  if (result.affectedRows === 0) {
    throw createError('Producto no encontrado', 404);
  }

  return { code, category, ...data };
}

async function deleteProduct(category, code) {
  if (!ALLOWED_CATEGORIES.includes(category)) {
    throw createError('Categoria no valida');
  }

  const cols = PRODUCT_TABLES[category];
  const sql = `DELETE FROM ${category} WHERE ${cols.code} = ?`;
  const [result] = await pool.execute(sql, [code]);

  if (result.affectedRows === 0) {
    throw createError('Producto no encontrado', 404);
  }

  return { code, category };
}

function getTypesByCategory(category) {
  if (!ALLOWED_CATEGORIES.includes(category)) {
    throw createError('Categoria no valida');
  }
  return CATEGORY_TYPES[category];
}

module.exports = {
  getAllProducts,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  getTypesByCategory,
};
