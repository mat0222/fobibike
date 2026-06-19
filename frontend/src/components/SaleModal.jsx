import { useEffect, useMemo, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { api } from '../api/client';

const PAYMENT_METHODS = [
  { id: 'contado', label: 'Contado' },
  { id: 'plazo', label: 'Plazo / cuotas' },
  { id: 'transferencia', label: 'Transferencia' },
  { id: 'tarjeta', label: 'Tarjeta' },
];

export default function SaleModal({ products, onClose, onSaved }) {
  const [search, setSearch] = useState('');
  const [selectedKey, setSelectedKey] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('contado');
  const [useInstallment, setUseInstallment] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedProduct = useMemo(() => {
    if (!selectedKey) return null;
    return products.find((p) => `${p.category}-${p.code}` === selectedKey) || null;
  }, [products, selectedKey]);

  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return products.slice(0, 50);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          String(p.code).toLowerCase().includes(term)
      )
      .slice(0, 50);
  }, [products, search]);

  const unitPrice = selectedProduct
    ? useInstallment
      ? selectedProduct.installmentPrice
      : selectedProduct.price
    : 0;

  const total = unitPrice * quantity;

  useEffect(() => {
    if (selectedProduct && quantity > selectedProduct.stock) {
      setQuantity(Math.max(1, selectedProduct.stock));
    }
  }, [selectedProduct, quantity]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      setError('Selecciona un producto');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.createSale({
        category: selectedProduct.category,
        code: selectedProduct.code,
        quantity,
        precioUnitario: unitPrice,
        metodoPago: paymentMethod,
        notas: notes || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'No se pudo registrar la venta');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-[#1a3a8f] to-[#2563eb]">
          <h2 className="text-lg font-bold text-white">Registrar venta</h2>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white p-1">
            <FiX size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Buscar producto</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Codigo o nombre..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 mb-2"
            />
            <select
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="">Seleccionar producto...</option>
              {filteredProducts.map((p) => (
                <option key={`${p.category}-${p.code}`} value={`${p.category}-${p.code}`}>
                  [{p.code}] {p.name} — Stock: {p.stock}
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="bg-blue-50 rounded-lg p-3 text-sm text-slate-600">
              <p className="font-medium text-slate-800">{selectedProduct.name}</p>
              <p className="capitalize mt-1">{selectedProduct.category} · {selectedProduct.type}</p>
              <p className="mt-1">Stock disponible: <strong>{selectedProduct.stock}</strong></p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cantidad</label>
              <input
                type="number"
                min="1"
                max={selectedProduct?.stock || 9999}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Metodo de pago</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={useInstallment}
              onChange={(e) => setUseInstallment(e.target.checked)}
              className="rounded text-[#2563eb]"
            />
            Usar precio a plazo
          </label>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Notas (opcional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={255}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          <div className="bg-[#0a1628] text-white rounded-xl p-4 flex justify-between items-center">
            <span className="text-blue-200 text-sm">Total de la venta</span>
            <span className="text-2xl font-bold text-[#22c55e]">
              {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(total)}
            </span>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || !selectedProduct}
              className="flex-1 py-2.5 bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold rounded-lg disabled:opacity-60"
            >
              {saving ? 'Registrando...' : 'Confirmar venta'}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
