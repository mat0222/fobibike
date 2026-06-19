const chatTools = require('./chatTools.service');
const salesService = require('./sales.service');

const STOP_WORDS = new Set([
  'a', 'al', 'algo', 'busca', 'buscar', 'como', 'con', 'cual', 'cuales', 'cuanto', 'cuantos',
  'cuesta', 'cuestan', 'de', 'del', 'disponible', 'disponibles', 'el', 'en', 'es', 'esta',
  'estan', 'este', 'esto', 'hay', 'la', 'las', 'listar', 'lo', 'los', 'me', 'mostrar', 'mostrame',
  'muestrame', 'necesito', 'o', 'para', 'por', 'precio', 'precios', 'producto', 'productos',
  'que', 'qué', 'quedan', 'saber', 'se', 'si', 'sin', 'sobre', 'stock', 'tambien', 'también',
  'tengo', 'tenemos', 'tienen', 'tiene', 'toda', 'todas', 'todo', 'todos', 'un', 'una', 'uno',
  'unos', 'ver', 'y', 'vos', 'fobi', 'fobibike', 'bike', 'local', 'tienda', 'tiempo', 'real',
  'actual', 'actualizado', 'actualizada', 'chat', 'mas', 'más', 'caro', 'cara', 'caros', 'caras',
  'barato', 'barata', 'baratos', 'baratas', 'costoso', 'costosa', 'economico', 'económico',
  'mayor', 'menor', 'cual', 'cuál', 'es', 'el', 'la', 'los', 'las',
]);

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
  const tokens = text
    .replace(/[¿?¡!.,;:]/g, ' ')
    .replace(/\b(hay|tienen|tenemos|buscar|busca|mostrar|mostrame|muestrame|encontrar|listar|consultar|ver|disponible|disponibles|productos?|articulos?|unidades?|inventario|actual|tiempo|real)\b/gi, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word.toLowerCase()));

  return tokens.join(' ');
}

function extractStockThreshold(text) {
  if (/\bsin\s*stock\b|\bagotad|\bcero\b/i.test(text)) return 0;
  const match = text.match(/(?:menos\s*de|hasta|bajo|<=?)\s*(\d+)/i);
  if (match) return Number(match[1]);
  return 5;
}

function extractProductCode(text) {
  const match = text.match(/\b([A-Za-z0-9][A-Za-z0-9._-]{2,})\b/);
  if (!match) return null;
  const code = match[1];
  if (STOP_WORDS.has(code.toLowerCase())) return null;
  if (/^\d+$/.test(code) && code.length < 4) return null;
  return code;
}

function isGreeting(text) {
  return /^(hola|buenas|buen\s*d[ií]a|hey|qu[eé]\s*tal|saludos?)[!.?\s]*$/i.test(text.trim());
}

function isHelp(text) {
  return /\b(ayuda|qu[eé]\s*(pod[eé]s|sab[eé]s|hac[eé]s)|c[oó]mo\s*funciona)\b/i.test(text);
}

function isWriteAction(text) {
  return /\b(crear|agregar|a[nñ]adir|eliminar|borrar|editar|actualizar|modificar|registrar\s*una?\s*venta|vender|dar\s*de\s*baja)\b/i.test(text);
}

function isLowStockQuery(text) {
  return /\b(stock\s*bajo|sin\s*stock|agotad|reposici[oó]n|reponer|faltan|alertas?\s*de\s*stock|poco\s*stock)\b/i.test(text);
}

function isSalesQuery(text) {
  return /\b(ventas?|ingresos?|facturaci[oó]n|vendimos|vendieron|cu[aá]nto\s*(vend|factur|ingres|entr[oó]))\b/i.test(text)
    || (/\b(este\s*mes|esta\s*semana|hoy|hist[oó]rico)\b/i.test(text) && /\b(ventas?|ingresos?|vend)\b/i.test(text));
}

function detectCategory(text) {
  if (/\bbicicletas?\b|\bmtb\b|\bbici\b/i.test(text)) return 'bicicletas';
  if (/\baccesorios?\b/i.test(text)) return 'accesorios';
  if (/\bindumentarias?\b/i.test(text)) return 'indumentarias';
  if (/\brepuestos?\b/i.test(text)) return 'repuestos';
  return null;
}

function detectPriceRanking(text) {
  if (/\b(m[aá]s\s+car[oa]s?|mas\s+car[oa]s?|mayor\s+precio|m[aá]s\s+costos[oa]s?|producto\s+m[aá]s\s+car[oa]|precio\s+m[aá]s\s+alt[oa])\b/i.test(text)) {
    return 'desc';
  }
  if (/\b(m[aá]s\s+barat[oa]s?|mas\s+barat[oa]s?|menor\s+precio|m[aá]s\s+econ[oó]mic[oa]s?|producto\s+m[aá]s\s+barat[oa]|precio\s+m[aá]s\s+baj[oa])\b/i.test(text)) {
    return 'asc';
  }
  return null;
}

function isInventoryQuery(text) {
  return isLowStockQuery(text)
    || isSalesQuery(text)
    || detectPriceRanking(text)
    || /\b(stock|inventario|precio|productos?|disponible|hay|buscar|mostrar|consultar|cascos?|bicicletas?|repuestos?|accesorios?)\b/i.test(text);
}

async function searchProducts(query) {
  if (!query || query.length < 2) return [];

  let products = await chatTools.searchProducts(query, null, 12);
  if (products.length === 0 && query.endsWith('s') && query.length > 3) {
    products = await chatTools.searchProducts(query.slice(0, -1), null, 12);
  }
  return products;
}

function filterByTerm(products, term) {
  if (!term) return products;
  const normalized = term.toLowerCase();
  return products.filter((product) => product.name.toLowerCase().includes(normalized));
}

async function prefetchInventoryContext(messages) {
  const text = getUserText(messages);
  if (!text || isGreeting(text) || isHelp(text) || isWriteAction(text)) {
    return null;
  }

  if (!isInventoryQuery(text)) {
    return null;
  }

  const blocks = [];
  const searchTerm = extractSearchQuery(text);
  const priceOrder = detectPriceRanking(text);

  if (priceOrder) {
    blocks.push({
      tipo: priceOrder === 'desc' ? 'productos_mas_caros' : 'productos_mas_baratos',
      categoria: detectCategory(text),
      productos: await chatTools.getTopProductsByPrice(priceOrder, detectCategory(text), 5),
    });
  } else if (isSalesQuery(text) && !isLowStockQuery(text) && searchTerm.length < 3) {
    blocks.push({
      tipo: 'ventas',
      datos: await salesService.getStats(),
    });
  } else if (isLowStockQuery(text)) {
    const threshold = extractStockThreshold(text);
    let products = await chatTools.getLowStockProducts(threshold, 15);
    if (searchTerm.length >= 3) {
      products = filterByTerm(products, searchTerm);
    }
    blocks.push({ tipo: 'stock_bajo', umbral: threshold, productos: products });
  } else {
    const code = extractProductCode(text);
    if (code && (/\bcodigo\b|\bcódigo\b|\bconsultar\b|\bdetalle\b/i.test(text) || text.split(/\s+/).length <= 4)) {
      const product = await chatTools.getProductByCode(code, null);
      if (product) {
        blocks.push({ tipo: 'producto', producto: product });
      }
    }

    if (blocks.length === 0 && searchTerm.length >= 2) {
      blocks.push({
        tipo: 'busqueda',
        consulta: searchTerm,
        productos: await searchProducts(searchTerm),
      });
    }
  }

  if (blocks.length === 0) {
    return null;
  }

  return `\n\nDATOS EN TIEMPO REAL (consultados ahora mismo en MySQL):\n${JSON.stringify(blocks)}\n\nEstos datos son actuales. Respondelos al usuario. PROHIBIDO decir que no tenes acceso en tiempo real, que no podes ver stock, o que debe consultar manualmente el inventario.`;
}

function isGenericDenial(text) {
  if (!text) return false;
  return /\b(no tengo acceso|no puedo acceder|no tengo informaci[oó]n en tiempo real|no dispongo de informaci[oó]n|consulta(?:r)?\s+(?:el\s+)?inventario|no tengo acceso a informaci[oó]n)\b/i.test(text);
}

module.exports = {
  prefetchInventoryContext,
  isGenericDenial,
  getUserText,
};
