import { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { api } from '../api/client';

const CATEGORIES = [
  { id: 'bicicletas', label: 'Bicicletas' },
  { id: 'accesorios', label: 'Accesorios' },
  { id: 'repuestos', label: 'Repuestos' },
  { id: 'indumentarias', label: 'Indumentaria' },
];

const emptyForm = {
  code: '',
  category: 'bicicletas',
  name: '',
  type: '',
  price: '',
  installmentPrice: '',
  stock: '',
  supplier: '',
};

export default function ProductModal({ mode = 'edit', product, defaultCategory, suppliers, onClose, onSaved }) {
  const isAdd = mode === 'add';
  const [form, setForm] = useState(emptyForm);
  const [types, setTypes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAdd) {
      setForm({
        ...emptyForm,
        category: defaultCategory && defaultCategory !== 'all' ? defaultCategory : 'bicicletas',
        supplier: suppliers[0]?.id ?? '',
      });
      return;
    }

    if (!product) return;

    setForm({
      code: product.code || '',
      category: product.category || '',
      name: product.name || '',
      type: product.type || '',
      price: product.price ?? '',
      installmentPrice: product.installmentPrice ?? '',
      stock: product.stock ?? '',
      supplier: product.supplier ?? '',
    });
  }, [product, isAdd, defaultCategory, suppliers]);

  useEffect(() => {
    const category = isAdd ? form.category : product?.category;
    if (!category) return;

    api.getProductTypes(category)
      .then((res) => setTypes(res.data || []))
      .catch(() => setTypes([]));
  }, [form.category, product?.category, isAdd]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      name: form.name,
      type: form.type,
      price: parseFloat(form.price),
      installmentPrice: parseFloat(form.installmentPrice),
      stock: parseInt(form.stock, 10),
      supplier: parseInt(form.supplier, 10),
    };

    try {
      if (isAdd) {
        await api.createProduct({
          ...payload,
          category: form.category,
          code: form.code.trim(),
        });
      } else {
        await api.updateProduct(product.category, product.code, payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdd && !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-[#1a3a8f] to-[#2563eb]">
          <h2 className="text-lg font-bold text-white">
            {isAdd ? 'Agregar producto' : 'Editar producto'}
          </h2>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white p-1">
            <FiX size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Codigo</label>
              <input
                name="code"
                value={form.code}
                onChange={handleChange}
                disabled={!isAdd}
                required
                className={`w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-sm ${
                  isAdd
                    ? 'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500'
                    : 'bg-slate-100 text-slate-500'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Categoria</label>
              {isAdd ? (
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg capitalize focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={form.category}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 capitalize text-sm"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nombre</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg capitalize focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="">Seleccionar...</option>
                {types.map((t) => (
                  <option key={t} value={t} className="capitalize">{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Proveedor</label>
              <select
                name="supplier"
                value={form.supplier}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="">Seleccionar...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Contado</label>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Plazo</label>
              <input
                name="installmentPrice"
                type="number"
                step="0.01"
                min="0"
                value={form.installmentPrice}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Stock</label>
              <input
                name="stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold rounded-lg transition-colors disabled:opacity-60"
            >
              {saving ? 'Guardando...' : isAdd ? 'Agregar producto' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
