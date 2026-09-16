import { FiSearch, FiFilter, FiX } from 'react-icons/fi';

const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'bicicletas', label: 'Bicicletas' },
  { id: 'accesorios', label: 'Accesorios' },
  { id: 'repuestos', label: 'Repuestos' },
  { id: 'indumentarias', label: 'Indumentaria' },
];

const STOCK_OPTIONS = [
  { id: 'in-stock', label: 'En stock' },
  { id: 'low-stock', label: 'Stock bajo' },
  { id: 'out-of-stock', label: 'Sin stock' },
];

export default function FilterSidebar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  supplier,
  onSupplierChange,
  type,
  onTypeChange,
  stockFilters,
  onStockFilterChange,
  sort,
  onSortChange,
  suppliers,
  types,
  activeFilterCount,
  onClearFilters,
}) {
  return (
    <div className="px-4 pb-8 space-y-5 border-t border-white/10 pt-4">
      <div>
        <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.16em] mb-2">Búsqueda</h3>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Código o nombre..."
            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/40 text-sm"
          />
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.16em] mb-2">Categoría</h3>
        <div className="space-y-0.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                category === cat.id
                  ? 'bg-[#2563eb] text-white font-medium'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.16em] mb-2">Proveedor</h3>
        <select
          value={supplier}
          onChange={(e) => onSupplierChange(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 capitalize"
        >
          <option value="" className="text-slate-800">Todos</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id} className="text-slate-800">{s.name}</option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.16em] mb-2">Tipo</h3>
        <select
          value={type}
          onChange={(e) => onTypeChange(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 capitalize"
        >
          <option value="" className="text-slate-800">Todos</option>
          {types.map((t) => (
            <option key={t} value={t} className="text-slate-800 capitalize">{t}</option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.16em] mb-2">Estado de stock</h3>
        <div className="space-y-1">
          {STOCK_OPTIONS.map((opt) => (
            <label
              key={opt.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 cursor-pointer text-sm text-slate-400"
            >
              <input
                type="checkbox"
                checked={stockFilters.includes(opt.id)}
                onChange={() => onStockFilterChange(opt.id)}
                className="rounded border-white/30 text-[#2563eb] focus:ring-blue-500/40"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.16em] mb-2">Ordenar por</h3>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <option value="name" className="text-slate-800">Nombre</option>
          <option value="code" className="text-slate-800">Código</option>
          <option value="price-asc" className="text-slate-800">Precio: menor a mayor</option>
          <option value="price-desc" className="text-slate-800">Precio: mayor a menor</option>
          <option value="stock" className="text-slate-800">Stock</option>
        </select>
      </div>

      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={onClearFilters}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/15 border border-red-400/20 text-red-300 hover:bg-red-500/25 text-sm font-medium transition-colors"
        >
          <FiX size={16} />
          Limpiar filtros ({activeFilterCount})
        </button>
      )}

      <div className="flex items-center gap-2 text-slate-600 text-xs pt-1">
        <FiFilter size={14} />
        <span>Filtros del inventario</span>
      </div>
    </div>
  );
}
