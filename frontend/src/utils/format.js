export function parseLocalDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const str = String(value);
  const dateOnly = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly && (str.length === 10 || str.endsWith('T00:00:00.000Z'))) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isoDate(value = new Date()) {
  const date = value instanceof Date ? new Date(value) : parseLocalDate(value);
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(value, days) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return isoDate(new Date(year, month - 1, day + Number(days)));
  }

  const date = value instanceof Date ? new Date(value) : parseLocalDate(value);
  if (!date) return '';
  date.setDate(date.getDate() + Number(days));
  return isoDate(date);
}

export function formatPrice(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export function formatDate(value, withTime = false) {
  const date = parseLocalDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: withTime ? 'short' : '2-digit',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

export function formatDoc(value) {
  if (!value) return '—';
  const digits = String(value).replace(/\D/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
  }
  if (digits.length === 8 || digits.length === 7) {
    return Number(digits).toLocaleString('es-AR');
  }
  return value;
}

export function padInvoiceNumber(pos, number) {
  return `${String(pos).padStart(4, '0')}-${String(number).padStart(8, '0')}`;
}

export function padRepairNumber(number) {
  return `REP-${String(number).padStart(4, '0')}`;
}

export function computeInvoiceTotals(items, type = 'B') {
  const total = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  if (type === 'C') {
    return { subtotal: Math.round(total), tax: 0, total: Math.round(total) };
  }

  const subtotal = Math.round(total / 1.21);
  const tax = Math.round(total) - subtotal;
  return { subtotal, tax, total: Math.round(total) };
}
