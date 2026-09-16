import { useMemo, useState } from 'react';
import { FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import { REPAIR_PRIORITIES, REPAIR_TYPES, TECHNICIANS } from '../config/repairs';
import { addDays, formatPrice, isoDate } from '../utils/format';

const emptyItem = { description: '', quantity: 1, unitPrice: '', kind: 'mano_obra' };

export default function RepairModal({ onClose, onSubmit }) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bike, setBike] = useState('');
  const [color, setColor] = useState('');
  const [type, setType] = useState('service');
  const [priority, setPriority] = useState('media');
  const [technician, setTechnician] = useState(TECHNICIANS[0]);
  const [issue, setIssue] = useState('');
  const [promisedAt, setPromisedAt] = useState(addDays(isoDate(), 3));
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const totals = useMemo(() => {
    const labor = items
      .filter((item) => item.kind === 'mano_obra')
      .reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
    const parts = items
      .filter((item) => item.kind === 'repuesto')
      .reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
    return { labor, parts, total: labor + parts };
  }, [items]);

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validItems = items.filter((item) => item.description.trim());
    setSaving(true);
    setError('');
    try {
      await onSubmit({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        bike: bike.trim(),
        color: color.trim(),
        type,
        priority,
        technician,
        issue: issue.trim(),
        receivedAt: isoDate(),
        promisedAt,
        notes: notes.trim() || null,
        labor: totals.labor,
        parts: totals.parts,
        items: validItems.map((item) => ({
          description: item.description.trim(),
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          kind: item.kind,
        })),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'No se pudo crear la orden');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2563eb]">Taller</p>
            <h2 className="text-lg font-semibold text-slate-900">Nueva orden de reparación</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cliente</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                placeholder="Nombre y apellido"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Teléfono</label>
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="11 0000-0000"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Bicicleta</label>
              <input
                value={bike}
                onChange={(e) => setBike(e.target.value)}
                required
                placeholder="Marca y modelo"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Color</label>
              <input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Negro, rojo..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo de trabajo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm"
              >
                {REPAIR_TYPES.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm"
              >
                {REPAIR_PRIORITIES.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Técnico</label>
              <select
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm"
              >
                {TECHNICIANS.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Promesa de entrega</label>
              <input
                type="date"
                value={promisedAt}
                onChange={(e) => setPromisedAt(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Problema / trabajo</label>
            <textarea
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              required
              rows={2}
              placeholder="Qué hay que revisar o reparar"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">Mano de obra y repuestos</label>
              <button
                type="button"
                onClick={() => setItems((prev) => [...prev, { ...emptyItem }])}
                className="flex items-center gap-1 text-sm text-[#2563eb] font-medium"
              >
                <FiPlus />
                Agregar
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <select
                    value={item.kind}
                    onChange={(e) => updateItem(index, 'kind', e.target.value)}
                    className="col-span-12 sm:col-span-3 px-2 py-2 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="mano_obra">Mano de obra</option>
                    <option value="repuesto">Repuesto</option>
                  </select>
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Descripción"
                    className="col-span-12 sm:col-span-5 px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                    placeholder="Precio"
                    className="col-span-8 sm:col-span-3 px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))}
                    className="col-span-4 sm:col-span-1 p-2 text-slate-400 hover:text-red-600"
                    aria-label="Quitar ítem"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Notas</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={255}
              placeholder="Accesorios que deja el cliente, seña, etc."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Presupuesto</p>
              <p className="text-xs text-slate-400 mt-1">
                Mano de obra {formatPrice(totals.labor)} · Repuestos {formatPrice(totals.parts)}
              </p>
            </div>
            <p className="text-2xl font-semibold">{formatPrice(totals.total)}</p>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-xl disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Ingresar al taller'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
