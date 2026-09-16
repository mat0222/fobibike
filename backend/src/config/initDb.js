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

async function ensureFacturasTables() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS facturas (
      id_factura INT NOT NULL AUTO_INCREMENT,
      numero INT NOT NULL,
      punto_venta INT NOT NULL DEFAULT 1,
      tipo ENUM('A','B','C') NOT NULL DEFAULT 'B',
      estado ENUM('emitida','pagada','vencida','anulada') NOT NULL DEFAULT 'emitida',
      cliente_nombre VARCHAR(120) NOT NULL,
      cliente_doc VARCHAR(20) DEFAULT NULL,
      cliente_condicion VARCHAR(40) DEFAULT 'Consumidor Final',
      fecha DATE NOT NULL,
      vencimiento DATE DEFAULT NULL,
      subtotal DECIMAL(12,2) NOT NULL,
      iva DECIMAL(12,2) NOT NULL DEFAULT 0,
      total DECIMAL(12,2) NOT NULL,
      metodo_pago ENUM('contado','plazo','transferencia','tarjeta') NOT NULL DEFAULT 'contado',
      cae VARCHAR(20) DEFAULT NULL,
      cae_vto DATE DEFAULT NULL,
      notas VARCHAR(255) DEFAULT NULL,
      id_venta INT DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id_factura),
      UNIQUE KEY uq_factura_pv_num_tipo (punto_venta, numero, tipo),
      KEY idx_facturas_fecha (fecha),
      KEY idx_facturas_estado (estado)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS factura_items (
      id_item INT NOT NULL AUTO_INCREMENT,
      id_factura INT NOT NULL,
      descripcion VARCHAR(150) NOT NULL,
      cantidad INT NOT NULL DEFAULT 1,
      precio_unitario DECIMAL(12,2) NOT NULL,
      iva_pct DECIMAL(5,2) NOT NULL DEFAULT 21,
      subtotal DECIMAL(12,2) NOT NULL,
      PRIMARY KEY (id_item),
      KEY idx_factura_items_factura (id_factura),
      CONSTRAINT fk_factura_items_factura
        FOREIGN KEY (id_factura) REFERENCES facturas(id_factura) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
}

async function ensureReparacionesTables() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS reparaciones (
      id_reparacion INT NOT NULL AUTO_INCREMENT,
      numero INT NOT NULL,
      estado ENUM('recepcionada','en_reparacion','lista','entregada','cancelada') NOT NULL DEFAULT 'recepcionada',
      prioridad ENUM('baja','media','alta','urgente') NOT NULL DEFAULT 'media',
      tipo VARCHAR(40) NOT NULL DEFAULT 'service',
      cliente_nombre VARCHAR(120) NOT NULL,
      cliente_telefono VARCHAR(30) DEFAULT NULL,
      bicicleta VARCHAR(120) NOT NULL,
      color VARCHAR(40) DEFAULT NULL,
      problema VARCHAR(255) NOT NULL,
      tecnico VARCHAR(80) DEFAULT NULL,
      fecha_ingreso DATE NOT NULL,
      fecha_prometida DATE DEFAULT NULL,
      fecha_entrega DATE DEFAULT NULL,
      mano_obra DECIMAL(12,2) NOT NULL DEFAULT 0,
      repuestos DECIMAL(12,2) NOT NULL DEFAULT 0,
      total DECIMAL(12,2) NOT NULL DEFAULT 0,
      notas VARCHAR(255) DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id_reparacion),
      UNIQUE KEY uq_reparacion_numero (numero),
      KEY idx_reparaciones_estado (estado),
      KEY idx_reparaciones_fecha (fecha_ingreso)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS reparacion_items (
      id_item INT NOT NULL AUTO_INCREMENT,
      id_reparacion INT NOT NULL,
      descripcion VARCHAR(150) NOT NULL,
      cantidad INT NOT NULL DEFAULT 1,
      precio_unitario DECIMAL(12,2) NOT NULL DEFAULT 0,
      tipo ENUM('mano_obra','repuesto') NOT NULL DEFAULT 'mano_obra',
      PRIMARY KEY (id_item),
      KEY idx_reparacion_items_rep (id_reparacion),
      CONSTRAINT fk_reparacion_items_rep
        FOREIGN KEY (id_reparacion) REFERENCES reparaciones(id_reparacion) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
}

module.exports = { ensureVentasTable, ensureFacturasTables, ensureReparacionesTables };
