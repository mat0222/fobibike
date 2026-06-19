const pool = require('../config/db');

async function getAllSuppliers() {
  const [rows] = await pool.execute(
    'SELECT id_proveedor AS id, nombre AS name FROM proveedores ORDER BY nombre'
  );
  return rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
  }));
}

module.exports = { getAllSuppliers };
