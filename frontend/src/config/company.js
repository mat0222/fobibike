export const COMPANY = {
  name: 'FOBI Bike',
  legalName: 'FOBI Bike S.A.',
  cuit: '30-71654829-4',
  iva: 'IVA Responsable Inscripto',
  address: 'Av. San Martín 1450',
  city: 'CABA, Buenos Aires',
  phone: '+54 11 4567-8900',
  email: 'administracion@fobibike.com',
  iibb: '901-71654829-4',
  startDate: '01/03/2019',
  pos: 1,
};

export const INVOICE_TYPES = [
  { id: 'A', label: 'Factura A', hint: 'Resp. Inscripto' },
  { id: 'B', label: 'Factura B', hint: 'Consumidor final' },
  { id: 'C', label: 'Factura C', hint: 'Monotributo' },
];

export const INVOICE_STATUSES = [
  { id: 'emitida', label: 'Emitida', className: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200' },
  { id: 'pagada', label: 'Pagada', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  { id: 'vencida', label: 'Vencida', className: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200' },
  { id: 'anulada', label: 'Anulada', className: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200' },
];

export const PAYMENT_LABELS = {
  contado: 'Contado',
  plazo: 'Plazo / cuotas',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
};

export const CUSTOMER_CONDITIONS = [
  'Consumidor Final',
  'IVA Responsable Inscripto',
  'IVA Monotributo',
  'IVA Exento',
];

export function statusMeta(status) {
  return INVOICE_STATUSES.find((item) => item.id === status) || INVOICE_STATUSES[0];
}
