const PRODUCT_TABLES = {
  bicicletas: {
    category: 'bicicletas',
    code: 'codigo',
    name: 'nombre',
    type: 'categoria',
    price: 'precio_contado',
    installmentPrice: 'precio_plazo',
    stock: 'stock',
    supplier: 'id_proveedor',
  },
  accesorios: {
    category: 'accesorios',
    code: 'codigo',
    name: 'nombre',
    type: 'categoria',
    price: 'precio_contado',
    installmentPrice: 'precio_plazo',
    stock: 'stock',
    supplier: 'proveedor_id',
  },
  indumentarias: {
    category: 'indumentarias',
    code: 'codigo',
    name: 'nombre',
    type: 'categoria',
    price: 'precio_contado',
    installmentPrice: 'precio_plazo',
    stock: 'stock',
    supplier: 'proveedor_id',
  },
  repuestos: {
    category: 'repuestos',
    code: 'codigo',
    name: 'nombre',
    type: 'categoria',
    price: 'precio_contado',
    installmentPrice: 'precio_plazo',
    stock: 'stock',
    supplier: 'proveedor_id',
  },
};

const ALLOWED_CATEGORIES = Object.keys(PRODUCT_TABLES);

const CATEGORY_TYPES = {
  bicicletas: ['mountain bike', 'ruta', 'niño/a', 'electrico', 'paseo'],
  accesorios: [
    'carga y transporte', 'decoraciones', 'entrenamiento', 'fundas', 'herramientas',
    'hidratacion', 'iluminacion', 'infladores', 'mantenimiento', 'seguridad',
    'soportes', 'protecciones', 'accesorios',
  ],
  indumentarias: ['calzado', 'cascos', 'mochila', 'proteccion', 'ropa'],
  repuestos: [
    'amortiguadores', 'asientos y partes', 'cableado', 'caja pedalera', 'cambios',
    'cuadros', 'direccion', 'ebikes', 'forros', 'frenos', 'horquillas',
    'juego direccion', 'manubrios', 'neumaticos', 'pedales', 'portasilla',
    'puños', 'ruedas', 'transmision', 'terminales',
  ],
};

module.exports = { PRODUCT_TABLES, ALLOWED_CATEGORIES, CATEGORY_TYPES };
