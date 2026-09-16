const chatTools = require('./chatTools.service');
const salesService = require('./sales.service');

const CATEGORY_PATTERNS = {
  bicicletas: /\b(bicicleta|bici|cicl|mtb|rodado|mountain\s*bike|fixie|ruta)\b/i,
  accesorios: /\b(accesorio|luces?|candado|bomba|portabidon|bidon|espejo)\b/i,
  repuestos: /\b(repuesto|cadenas?|frenos?|cubiertas?|neumatic|camaras?|cadena|pastilla)\b/i,
  indumentarias: /\b(indumentaria|remeras?|shorts?|guantes?|calzas?|malla|jersey|cascos?)\b/i,
};

const CATEGORY_LABELS = {
  bicicletas: 'Bicicletas',
  accesorios: 'Accesorios',
  repuestos: 'Repuestos',
  indumentarias: 'Indumentarias',
};

const STOP_WORDS = new Set([
  'a', 'al', 'algo', 'busca', 'buscar', 'como', 'con', 'cual', 'cuales', 'cuanto', 'cuantos',
  'cuesta', 'cuestan', 'de', 'del', 'disponible', 'disponibles', 'el', 'en', 'es', 'esta',
  'estan', 'este', 'esto', 'hay', 'la', 'las', 'listar', 'lo', 'los', 'me', 'mostrar', 'mostrame',
  'muestrame', 'necesito', 'o', 'para', 'por', 'precio', 'precios', 'producto', 'productos',
  'que', 'qué', 'quedan', 'saber', 'se', 'si', 'sin', 'sobre', 'stock', 'tambien', 'también',
  'tengo', 'tenemos', 'tienen', 'tiene', 'toda', 'todas', 'todo', 'todos', 'un', 'una', 'uno',
  'unos', 'ver', 'y', 'vos', 'fobi', 'fobibike', 'fobi', 'bike', 'local', 'tienda',
]);

function formatPrice(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function detectCategory(text) {
  for (const [category, pattern] of Object.entries(CATEGORY_PATTERNS)) {
    if (pattern.test(text)) return category;
  }
  return null;
}

function getUserText(messages) {
  const userMessages = messages.filter((m) => m.role === 'user');
  const last = userMessages[userMessages.length - 1]?.content?.trim() || '';
  const previous = userMessages[userMessages.length - 2]?.content?.trim() || '';

  if (/^(y\s+|también|tambien)/i.test(last) && previous) {
    return `${previous} ${last}`;
  }

  return last;
}

function extractSearchQuery(text) {
  let query = text
    .replace(/[¿?¡!.,;:]/g, ' ')
    .replace(/\b(hay|tienen|tenemos|buscar|busca|mostrar|mostrame|muestrame|encontrar|listar|consultar|ver|stock|precio|precios|disponible|disponibles|productos?|articulos?|unidades?)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = query
    .split(' ')
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word.toLowerCase()));

  if (tokens.length === 0) {
    return text.replace(/[¿?¡!.,;:]/g, ' ').trim();
  }

  return tokens.join(' ');
}

function extractProductCode(text) {
  const match = text.match(/\b([A-Za-z0-9][A-Za-z0-9._-]{2,})\b/);
  if (!match) return null;

  const code = match[1];
  if (STOP_WORDS.has(code.toLowerCase())) return null;
  if (/^\d+$/.test(code) && code.length < 4) return null;

  return code;
}

function extractStockThreshold(text) {
  if (/\bsin\s*stock\b|\bagotad|\bcero\b|\b0\b/i.test(text)) return 0;

  const match = text.match(/(?:menos\s*de|hasta|bajo|<=?)\s*(\d+)/i);
  if (match) return Number(match[1]);

  return 5;
}

function isGreeting(text) {
  return /^(hola|buenas|buen\s*d[ií]a|hey|qu[eé]\s*tal|saludos?)[!.?\s]*$/i.test(text.trim());
}

function isHelp(text) {
  return /\b(ayuda|qu[eé]\s*(pod[eé]s|sab[eé]s|hac[eé]s)|c[oó]mo\s*funciona|comandos?|opciones)\b/i.test(text);
}

function isLowStockQuery(text) {
  return /\b(stock\s*bajo|sin\s*stock|agotad|reposici[oó]n|reponer|faltan|alertas?\s*de\s*stock|poco\s*stock)\b/i.test(text);
}

function isSalesQuery(text) {
  return /\b(ventas?|ingresos?|facturaci[oó]n|vendimos|vendieron|cu[aá]nto\s*(vend|factur|ingres|entr[oó])|estad[ií]sticas?\s*de\s*ventas?)\b/i.test(text)
    || /\b(este\s*mes|esta\s*semana|hoy|hist[oó]rico)\b/i.test(text) && /\b(ventas?|ingresos?|vend)\b/i.test(text);
}

function formatProductList(products, query) {
  if (products.length === 0) {
    return `No encontre productos para **"${query}"**.\n\nProba con otro nombre, codigo o categoria (bicicletas, accesorios, repuestos, indumentarias).`;
  }

  const lines = products.map((product, index) => {
    const stockLabel = product.stock <= 0
      ? '**Sin stock**'
      : product.stock <= 5
        ? `**${product.stock}** u. (bajo)`
        : `${product.stock} u.`;

    return `${index + 1}. **${product.name}** (${product.code})\n   ${CATEGORY_LABELS[product.category] || product.category} | ${formatPrice(product.price)} | Stock: ${stockLabel}`;
  });

  return `Encontre **${products.length}** resultado${products.length === 1 ? '' : 's'} para **"${query}"**:\n\n${lines.join('\n\n')}`;
}

function formatProductDetail(product) {
  const stockLabel = product.stock <= 0
    ? 'Sin stock'
    : product.stock <= 5
      ? `${product.stock} unidades (stock bajo)`
      : `${product.stock} unidades`;

  return [
    `**${product.name}**`,
    `Codigo: \`${product.code}\` | ${CATEGORY_LABELS[product.category] || product.category}`,
    product.type ? `Tipo: ${product.type}` : null,
    product.supplierName ? `Proveedor: ${product.supplierName}` : null,
    `Precio contado: **${formatPrice(product.price)}**`,
    product.installmentPrice ? `Precio plazo: ${formatPrice(product.installmentPrice)}` : null,
    `Stock: **${stockLabel}**`,
  ].filter(Boolean).join('\n');
}

function formatLowStock(products, threshold) {
  if (products.length === 0) {
    return threshold === 0
      ? 'Buenas noticias: no hay productos **sin stock** en este momento.'
      : `No hay productos con stock **igual o menor a ${threshold}** unidades.`;
  }

  const title = threshold === 0
    ? 'Productos **sin stock**:'
    : `Productos con stock **bajo** (≤ ${threshold} u.):`;

  const lines = products.map((product) => {
    const stockText = product.stock <= 0 ? '**0**' : `**${product.stock}**`;
    return `• **${product.name}** (${product.code}) — ${CATEGORY_LABELS[product.category]}: ${stockText} u. — ${formatPrice(product.price)}`;
  });

  return `${title}\n\n${lines.join('\n')}`;
}

function formatSales(stats) {
  const categoryLines = stats.byCategory.length
    ? stats.byCategory
      .slice(0, 4)
      .map((row) => `• ${CATEGORY_LABELS[row.category] || row.category}: ${formatPrice(row.total)} (${row.count} ventas)`)
      .join('\n')
    : '• Todavia no hay ventas registradas este mes.';

  return [
    '**Resumen de ventas e ingresos**',
    '',
    `**Hoy:** ${formatPrice(stats.today.total)} (${stats.today.count} venta${stats.today.count === 1 ? '' : 's'})`,
    `**Ultimos 7 dias:** ${formatPrice(stats.week.total)} (${stats.week.count} venta${stats.week.count === 1 ? '' : 's'})`,
    `**Este mes:** ${formatPrice(stats.month.total)} (${stats.month.count} venta${stats.month.count === 1 ? '' : 's'})`,
    `**Historico:** ${formatPrice(stats.allTime.total)} (${stats.allTime.count} venta${stats.allTime.count === 1 ? '' : 's'})`,
    '',
    '**Por categoria (mes actual):**',
    categoryLines,
  ].join('\n');
}

function buildHelpReply(userName) {
  const greeting = userName ? `Hola **${userName}**! ` : '';
  return `${greeting}Soy **Fobi** y consulto tu inventario real sin costo de API. Podes preguntarme cosas como:

• "¿Que productos tienen stock bajo?"
• "¿Cuanto vendimos este mes?"
• "Buscar cascos"
• "¿Hay bicicletas MTB rodado 29?"
• "Consultar codigo ABC123"

Uso datos reales de tu base: precios, stock e ingresos.`;
}

function buildGreetingReply(userName) {
  if (userName) {
    return `Hola **${userName}**! Soy Fobi, tu asistente de FOBI Bike. Decime que queres consultar del inventario o de las ventas.`;
  }
  return 'Hola! Soy **Fobi**, tu asistente de FOBI Bike. Puedo ayudarte con stock, productos e ingresos del local.';
}

async function chat(messages, userName) {
  const text = getUserText(messages);
  const normalized = text.toLowerCase();

  if (!text) {
    return { reply: 'Escribime tu consulta y te ayudo con el inventario o las ventas.', model: 'fobi-local' };
  }

  if (isGreeting(text)) {
    return { reply: buildGreetingReply(userName), model: 'fobi-local' };
  }

  if (isHelp(text)) {
    return { reply: buildHelpReply(userName), model: 'fobi-local' };
  }

  if (isLowStockQuery(text)) {
    const threshold = extractStockThreshold(text);
    const products = await chatTools.getLowStockProducts(threshold);
    return { reply: formatLowStock(products, threshold), model: 'fobi-local' };
  }

  if (isSalesQuery(text)) {
    const stats = await salesService.getStats();
    return { reply: formatSales(stats), model: 'fobi-local' };
  }

  const productCode = extractProductCode(text);
  if (productCode && (/\bcodigo\b|\bcódigo\b|\bconsultar\b|\bdetalle\b/i.test(text) || text.split(/\s+/).length <= 3)) {
    const category = detectCategory(text);
    const product = await chatTools.getProductByCode(productCode, category);
    if (product) {
      return { reply: formatProductDetail(product), model: 'fobi-local' };
    }
  }

  const category = detectCategory(text);
  const query = extractSearchQuery(text);
  let products = await chatTools.searchProducts(query, category);

  if (products.length === 0 && query.endsWith('s') && query.length > 3) {
    products = await chatTools.searchProducts(query.slice(0, -1), category);
  }

  if (products.length === 1) {
    return { reply: formatProductDetail(products[0]), model: 'fobi-local' };
  }

  return { reply: formatProductList(products, query), model: 'fobi-local' };
}

module.exports = { chat };
