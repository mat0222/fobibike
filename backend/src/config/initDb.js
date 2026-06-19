const pool = require('./db');

async function ensureVentasTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS ventas (
      id_venta INT NOT NULL AUTO_INCREMENT,
      codigo_producto VARCHAR(20) NOT NULL,
      categoria ENUM('bicicletas','accesorios','repuestos','indumentarias') NOT NULL,
      nombre_producto VARCHAR(100) NOT NULL,
      cantidad INT NOT NULL DEFAULT 1,
      precio_unitario DECIMAL(12,2) NOT NULL,
      total DECIMAL(12,2) NOT NULL,
      metodo_pago ENUM('contado','plazo','transferencia','tarjeta') NOT NULL DEFAULT 'contado',
      fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      notas VARCHAR(255) DEFAULT NULL,
      PRIMARY KEY (id_venta),
      KEY idx_ventas_fecha (fecha),
      KEY idx_ventas_categoria (categoria)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
}

module.exports = { ensureVentasTable };
