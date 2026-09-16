import { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import {
  nextRepairStatus,
  nextRepairStatusLabel,
  repairPriorityMeta,
  repairStatusMeta,
  repairTypeLabel,
} from '../config/repairs';
import { formatDate, formatPrice, isoDate, padRepairNumber } from '../utils/format';

export default function RepairDetail({ repair, onClose, onStatusChange }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!repair) return null;

  const status = repairStatusMeta(repair.status);
  const priority = repairPriorityMeta(repair.priority);
  const next = nextRepairStatus(repair.status);
  const overdue = repair.promisedAt && repair.promisedAt < isoDate() && repair.status !== 'entregada' && repair.status !== 'cancelada';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
      <button type="button" className="flex-1 cursor-default" onClick={onClose} aria-label="Cerrar panel" />
      <aside className="w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto">
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2563eb]">Orden de trabajo</p>
            <h2 className="text-xl font-semibold text-slate-900 mt-1">{padRepairNumber(repair.number)}</h2>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${status.className}`}>{status.label}</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${priority.className}`}>{priority.label}</span>
              {overdue && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700">Vencida</span>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-2">Cliente</p>
            <p className="font-semibold text-slate-900">{repair.customerName}</p>
            <p className="text-sm text-slate-500 mt-1">{repair.customerPhone || 'Sin teléfono'}</p>
          </section>

          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-2">Bicicleta</p>
            <p className="font-semibold text-slate-900">{repair.bike}</p>
            <p className="text-sm text-slate-500 mt-1">
              {repair.color || 'Color no indicado'} · {repairTypeLabel(repair.type)}
            </p>
          </section>

          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-2">Trabajo</p>
            <p className="text-sm text-slate-700 leading-relaxed">{repair.issue}</p>
            {repair.notes && <p className="text-sm text-slate-500 mt-2">{repair.notes}</p>}
          </section>

          <section className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-1">Ingreso</p>
              <p className="text-slate-800">{formatDate(repair.receivedAt)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-1">Promesa</p>
              <p className={overdue ? 'text-red-600 font-medium' : 'text-slate-800'}>{formatDate(repair.promisedAt)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-1">Técnico</p>
              <p className="text-slate-800">{repair.technician || 'Sin asignar'}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-1">Entrega</p>
              <p className="text-slate-800">{repair.deliveredAt ? formatDate(repair.deliveredAt) : '—'}</p>
            </div>
          </section>

          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-2">Presupuesto</p>
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              {(repair.items || []).length ? (
                <table className="w-full text-sm">
                  <tbody>
                    {repair.items.map((item) => (
                      <tr key={item.id || item.description} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2 text-slate-700">
                          <p>{item.description}</p>
                          <p className="text-[11px] text-slate-400">
                            {item.kind === 'repuesto' ? 'Repuesto' : 'Mano de obra'}
                          </p>
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-900 whitespace-nowrap">
                          {formatPrice((item.quantity || 1) * (item.unitPrice || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="px-3 py-4 text-sm text-slate-400">Sin ítems cargados.</p>
              )}
              <div className="bg-slate-50 px-3 py-3 flex justify-between text-sm">
                <span className="text-slate-500">Total</span>
                <span className="font-semibold text-slate-900">{formatPrice(repair.total)}</span>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-2">
            {next && (
              <button
                type="button"
                onClick={() => onStatusChange(repair.id, next)}
                className="w-full py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-xl"
              >
                {nextRepairStatusLabel(repair.status)}
              </button>
            )}
            {repair.status !== 'cancelada' && repair.status !== 'entregada' && (
              <button
                type="button"
                onClick={() => onStatusChange(repair.id, 'cancelada')}
                className="w-full py-2.5 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50"
              >
                Cancelar orden
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
