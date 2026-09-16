export const REPAIR_STATUSES = [
  { id: 'recepcionada', label: 'Recibida', className: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200', column: 'Recibida' },
  { id: 'en_reparacion', label: 'En taller', className: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200', column: 'En taller' },
  { id: 'lista', label: 'Lista', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', column: 'Lista para retirar' },
  { id: 'entregada', label: 'Entregada', className: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200', column: 'Entregada' },
  { id: 'cancelada', label: 'Cancelada', className: 'bg-red-50 text-red-700 ring-1 ring-red-200', column: 'Cancelada' },
];

export const BOARD_COLUMNS = ['recepcionada', 'en_reparacion', 'lista', 'entregada'];

export const REPAIR_PRIORITIES = [
  { id: 'baja', label: 'Baja', className: 'bg-slate-100 text-slate-600' },
  { id: 'media', label: 'Media', className: 'bg-blue-50 text-blue-700' },
  { id: 'alta', label: 'Alta', className: 'bg-amber-50 text-amber-800' },
  { id: 'urgente', label: 'Urgente', className: 'bg-red-50 text-red-700' },
];

export const REPAIR_TYPES = [
  { id: 'service', label: 'Service completo' },
  { id: 'frenos', label: 'Frenos' },
  { id: 'transmision', label: 'Transmisión' },
  { id: 'ruedas', label: 'Ruedas / cubiertas' },
  { id: 'electrico', label: 'E-bike / eléctrico' },
  { id: 'diagnostico', label: 'Diagnóstico' },
  { id: 'garantia', label: 'Garantía' },
];

export const TECHNICIANS = ['Julián Soto', 'Marina López', 'Pablo Rivas'];

export function repairStatusMeta(status) {
  return REPAIR_STATUSES.find((item) => item.id === status) || REPAIR_STATUSES[0];
}

export function repairPriorityMeta(priority) {
  return REPAIR_PRIORITIES.find((item) => item.id === priority) || REPAIR_PRIORITIES[1];
}

export function repairTypeLabel(type) {
  return REPAIR_TYPES.find((item) => item.id === type)?.label || type;
}

export function nextRepairStatus(status) {
  const flow = ['recepcionada', 'en_reparacion', 'lista', 'entregada'];
  const index = flow.indexOf(status);
  return index >= 0 && index < flow.length - 1 ? flow[index + 1] : null;
}

export function nextRepairStatusLabel(status) {
  const next = nextRepairStatus(status);
  if (!next) return null;
  if (next === 'en_reparacion') return 'Pasar a taller';
  if (next === 'lista') return 'Marcar lista';
  if (next === 'entregada') return 'Entregar';
  return repairStatusMeta(next).label;
}
