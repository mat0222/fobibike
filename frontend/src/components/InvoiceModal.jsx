import { useMemo, useState } from 'react';
import { FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import { CUSTOMER_CONDITIONS, INVOICE_TYPES, PAYMENT_LABELS } from '../config/company';
import { computeInvoiceTotals, formatPrice, isoDate } from '../utils/format';

const emptyItem = { description: '', quantity: 1, unitPrice: '' };

export default function InvoiceModal({ preset, onClose, onSubmit }) {
  const [type, setType] = useState(preset?.type || 'B');
  const [customerName, setCustomerName] = useState(preset?.customerName || '');
  const [customerDoc, setCustomerDoc] = useState(preset?.customerDoc || '');
  const [customerCondition, setCustomerCondition] = useState(preset?.customerCondition || 'Consumidor Final');
  const [date, setDate] = useState(preset?.date || isoDate());
  const [dueDate, setDueDate] = useState(preset?.dueDate || isoDate());
  const [paymentMethod, setPaymentMethod] = useState(preset?.paymentMethod || 'contado');
  const [notes, setNotes] = useState(preset?.notes || '');
  const [items, setItems] = useState(preset?.items?.length ? preset.items : [{ ...emptyItem }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const totals = useMemo(
    () =>
      computeInvoiceTotals(
        items.map((item) => ({
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice) || 0,
        })),
        type
      ),
    [items, type]
  );

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validItems = items.filter((item) => item.description.trim() && Number(item.unitPrice) >= 0 && Number(item.quantity) > 0);
    if (!validItems.length) {
      setError('Agregá al menos un ítem con descripción y precio');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSubmit({
        type,
        customerName: customerName.trim(),
        customerDoc: customerDoc.trim(),
        customerCondition,
        date,
        dueDate,
        paymentMethod,
        notes: notes.trim() || null,
        saleId: preset?.saleId || null,
        items: validItems.map((item) => ({
          description: item.description.trim(),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'No se pudo emitir la factura');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2563eb]">Facturación</p>
            <h2 className="text-lg font-semibold text-slate-900">Nueva factura</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid sm:grid-cols-3 gap-3">
            {INVOICE_TYPES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setType(item.id)}
                className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                  type === item.id
                    ? 'border-[#2563eb] bg-blue-50 ring-2 ring-[#2563eb]/15'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.hint}</p>
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cliente</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                placeholder="Nombre o razón social"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">DNI / CUIT</label>
              <input
                value={customerDoc}
                onChange={(e) => setCustomerDoc(e.target.value)}
                placeholder="20-12345678-3"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Condición IVA</label>
              <select
                value={customerCondition}
                onChange={(e) => setCustomerCondition(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {CUSTOMER_CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Método de pago</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {Object.entries(PAYMENT_LABELS).map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Vencimiento</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">Ítems</label>
              <button
                type="button"
                onClick={() => setItems((prev) => [...prev, { ...emptyItem }])}
                className="flex items-center gap-1 text-sm text-[#2563eb] font-medium hover:text-[#1d4ed8]"
              >
                <FiPlus />
                Agregar
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Descripción"
                    className="col-span-12 sm:col-span-6 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    className="col-span-4 sm:col-span-2 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                    placeholder="Precio"
                    className="col-span-6 sm:col-span-3 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))}
                    className="col-span-2 sm:col-span-1 p-2 text-slate-400 hover:text-red-600"
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
              placeholder="Observaciones internas o del comprobante"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Total a emitir</p>
              <p className="text-xs text-slate-400 mt-1">
                Subtotal {formatPrice(totals.subtotal)} · IVA {formatPrice(totals.tax)}
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
              {saving ? 'Emitiendo...' : 'Emitir factura'}
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
