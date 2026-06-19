const chatTools = require('./chatTools.service');
const productsService = require('./products.service');
const salesService = require('./sales.service');
const suppliersService = require('./suppliers.service');

const FOBI_SYSTEM_PROMPT = `Sos Fobi, el asistente de inteligencia artificial de FOBI Bike, una bicicleteria en Argentina.

Tu usuario es el DUENO o empleado del local. Podes ADMINISTRAR la web del negocio usando herramientas:
- Consultar inventario, precios, stock y proveedores
- Detectar productos con stock bajo
- Crear, editar y eliminar productos
- Registrar ventas (descuenta stock automaticamente)
- Ver estadisticas de ingresos

Reglas:
- Tenes acceso EN TIEMPO REAL a la base de datos del local mediante herramientas
- NUNCA digas que no tenes acceso, que no ves stock en tiempo real, ni pidas consultar manualmente
- Si recibis DATOS EN TIEMPO REAL en el system prompt, usalos como fuente principal
- Responde en espanol rioplatense, claro y profesional
- Usa herramientas para datos y acciones reales; NUNCA inventes precios, stock ni productos
- Antes de crear, editar, eliminar o vender, confirma los datos clave si la instruccion es ambigua
- Para editar un producto, consultalo primero si no tenes todos los datos
- Los tipos de producto deben ser validos para cada categoria (usa tipos_por_categoria si hace falta)
- Metodos de pago validos para ventas: contado, plazo, transferencia, tarjeta
- Formatea precios en pesos argentinos (ARS)
- Tras una accion exitosa, confirma que se hizo y resume el resultado`;

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'buscar_productos',
      description: 'Busca productos en el inventario por nombre o codigo. Usar cuando pregunten por un producto, tipo de articulo o disponibilidad.',
      parameters: {
        type: 'object',
        properties: {
          consulta: { type: 'string', description: 'Texto a buscar (nombre o codigo)' },
          categoria: {
            type: 'string',
            enum: ['bicicletas', 'accesorios', 'repuestos', 'indumentarias'],
            description: 'Filtrar por categoria (opcional)',
          },
        },
        required: ['consulta'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_producto',
      description: 'Obtiene detalle de un producto por su codigo exacto.',
      parameters: {
        type: 'object',
        properties: {
          codigo: { type: 'string', description: 'Codigo del producto' },
          categoria: {
            type: 'string',
            enum: ['bicicletas', 'accesorios', 'repuestos', 'indumentarias'],
            description: 'Categoria (opcional, acelera la busqueda)',
          },
        },
        required: ['codigo'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'productos_stock_bajo',
      description: 'Lista productos con stock bajo o sin stock. Usar cuando pregunten por reposicion o alertas de inventario.',
      parameters: {
        type: 'object',
        properties: {
          limite: {
            type: 'number',
            description: 'Umbral de stock bajo (default 5). 0 = solo sin stock',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'resumen_ventas',
      description: 'Obtiene estadisticas de ingresos y ventas: hoy, semana, mes e historico.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'productos_por_precio',
      description: 'Lista los productos mas caros o mas baratos del inventario. Usar cuando pregunten por mayor/menor precio, mas caro, mas barato, etc.',
      parameters: {
        type: 'object',
        properties: {
          orden: {
            type: 'string',
            enum: ['desc', 'asc'],
            description: 'desc = mas caros primero, asc = mas baratos primero',
          },
        },
        required: ['orden'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_proveedores',
      description: 'Lista proveedores disponibles con su id. Usar antes de crear productos.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'tipos_por_categoria',
      description: 'Devuelve los tipos validos para una categoria de producto.',
      parameters: {
        type: 'object',
        properties: {
          categoria: {
            type: 'string',
            enum: ['bicicletas', 'accesorios', 'repuestos', 'indumentarias'],
          },
        },
        required: ['categoria'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'crear_producto',
      description: 'Crea un producto nuevo en el inventario.',
      parameters: {
        type: 'object',
        properties: {
          categoria: {
            type: 'string',
            enum: ['bicicletas', 'accesorios', 'repuestos', 'indumentarias'],
          },
          codigo: { type: 'string' },
          nombre: { type: 'string' },
          tipo: { type: 'string', description: 'Tipo valido de la categoria' },
          precio_contado: { type: 'number' },
          precio_plazo: { type: 'number' },
          stock: { type: 'number' },
          proveedor_id: { type: 'number', description: 'id_proveedor de listar_proveedores' },
        },
        required: ['categoria', 'codigo', 'nombre', 'tipo', 'precio_contado', 'precio_plazo', 'stock', 'proveedor_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'actualizar_producto',
      description: 'Actualiza un producto existente. Solo envia los campos que cambian; consulta el producto antes si falta info.',
      parameters: {
        type: 'object',
        properties: {
          categoria: {
            type: 'string',
            enum: ['bicicletas', 'accesorios', 'repuestos', 'indumentarias'],
          },
          codigo: { type: 'string' },
          nombre: { type: 'string' },
          tipo: { type: 'string' },
          precio_contado: { type: 'number' },
          precio_plazo: { type: 'number' },
          stock: { type: 'number' },
          proveedor_id: { type: 'number' },
        },
        required: ['categoria', 'codigo'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'eliminar_producto',
      description: 'Elimina un producto del inventario por categoria y codigo.',
      parameters: {
        type: 'object',
        properties: {
          categoria: {
            type: 'string',
            enum: ['bicicletas', 'accesorios', 'repuestos', 'indumentarias'],
          },
          codigo: { type: 'string' },
        },
        required: ['categoria', 'codigo'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'registrar_venta',
      description: 'Registra una venta y descuenta stock del producto.',
      parameters: {
        type: 'object',
        properties: {
          categoria: {
            type: 'string',
            enum: ['bicicletas', 'accesorios', 'repuestos', 'indumentarias'],
          },
          codigo: { type: 'string' },
          cantidad: { type: 'number' },
          precio_unitario: { type: 'number' },
          metodo_pago: {
            type: 'string',
            enum: ['contado', 'plazo', 'transferencia', 'tarjeta'],
          },
          notas: { type: 'string' },
        },
        required: ['categoria', 'codigo', 'cantidad', 'precio_unitario', 'metodo_pago'],
      },
    },
  },
];

async function executeTool(name, args) {
  try {
    switch (name) {
      case 'buscar_productos':
        return chatTools.searchProducts(args.consulta, args.categoria || null);
      case 'consultar_producto': {
        const product = await chatTools.getProductByCode(args.codigo, args.categoria || null);
        return product || { mensaje: 'Producto no encontrado' };
      }
      case 'productos_stock_bajo':
        return chatTools.getLowStockProducts(args.limite ?? 5);
      case 'resumen_ventas':
        return salesService.getStats();
      case 'productos_por_precio':
        return chatTools.getTopProductsByPrice(
          args.orden || 'desc',
          args.categoria || null,
          args.limite ?? 5
        );
      case 'listar_proveedores':
        return suppliersService.getAllSuppliers();
      case 'tipos_por_categoria':
        return {
          categoria: args.categoria,
          tipos: productsService.getTypesByCategory(args.categoria),
        };
      case 'crear_producto':
        return {
          success: true,
          producto: await productsService.createProduct({
            category: args.categoria,
            code: args.codigo,
            name: args.nombre,
            type: args.tipo,
            price: args.precio_contado,
            installmentPrice: args.precio_plazo,
            stock: args.stock,
            supplier: args.proveedor_id,
          }),
        };
      case 'actualizar_producto': {
        const existing = await chatTools.getProductByCode(args.codigo, args.categoria);
        if (!existing) {
          return { success: false, error: 'Producto no encontrado' };
        }

        const updated = await productsService.updateProduct(args.categoria, args.codigo, {
          name: args.nombre ?? existing.name,
          type: args.tipo ?? existing.type,
          price: args.precio_contado ?? existing.price,
          installmentPrice: args.precio_plazo ?? existing.installmentPrice,
          stock: args.stock ?? existing.stock,
          supplier: args.proveedor_id ?? existing.supplier,
        });

        return { success: true, producto: updated };
      }
      case 'eliminar_producto':
        return {
          success: true,
          ...(await productsService.deleteProduct(args.categoria, args.codigo)),
        };
      case 'registrar_venta':
        return {
          success: true,
          venta: await salesService.createSale({
            category: args.categoria,
            code: args.codigo,
            quantity: args.cantidad,
            precioUnitario: args.precio_unitario,
            metodoPago: args.metodo_pago,
            notas: args.notas || null,
          }),
        };
      default:
        return { error: 'Herramienta desconocida' };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Error al ejecutar la accion',
    };
  }
}

function buildSystemPrompt(userName) {
  if (!userName) return FOBI_SYSTEM_PROMPT;
  return `${FOBI_SYSTEM_PROMPT}\n\nEl usuario conectado se llama: ${userName}.`;
}

module.exports = {
  FOBI_SYSTEM_PROMPT,
  TOOLS,
  executeTool,
  buildSystemPrompt,
};
