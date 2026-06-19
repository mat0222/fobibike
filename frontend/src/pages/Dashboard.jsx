import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiPackage, FiPlus, FiTrash2 } from 'react-icons/fi';
import Layout from '../components/Layout';
import FilterSidebar from '../components/FilterSidebar';
import ProductModal from '../components/ProductModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { api } from '../api/client';

function getStockKey(stock) {
  if (stock === 0) return 'out-of-stock';
  if (stock <= 5) return 'low-stock';
  return 'in-stock';
}

function getStockBadge(stock) {
  if (stock === 0) return { label: 'Sin stock', className: 'bg-red-100 text-red-700 ring-1 ring-red-200' };
  if (stock <= 5) return { label: `${stock} bajo`, className: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' };
  return { label: `${stock} u.`, className: 'bg-green-100 text-green-700 ring-1 ring-green-200' };
}

function formatPrice(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [supplier, setSupplier] = useState('');
  const [type, setType] = useState('');
  const [stockFilters, setStockFilters] = useState([]);
  const [sort, setSort] = useState('name');

  const [editingProduct, setEditingProduct] = useState(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [productsRes, suppliersRes] = await Promise.all([
        api.getProducts(),
        api.getSuppliers(),
      ]);
      setProducts(productsRes.data || []);
      setSuppliers(suppliersRes.data || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const availableTypes = useMemo(() => {
    const source = category === 'all'
      ? products
      : products.filter((p) => p.category === category);
    return [...new Set(source.map((p) => p.type).filter(Boolean))].sort();
  }, [products, category]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (search) count++;
    if (category !== 'all') count++;
    if (supplier) count++;
    if (type) count++;
    if (stockFilters.length) count++;
    if (sort !== 'name') count++;
    return count;
  }, [search, category, supplier, type, stockFilters, sort]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();

    let result = products.filter((product) => {
      if (category !== 'all' && product.category !== category) return false;
      if (supplier && String(product.supplier) !== supplier) return false;
      if (type && product.type !== type) return false;
      if (stockFilters.length && !stockFilters.includes(getStockKey(product.stock))) return false;
      if (term) {
        const matchCode = String(product.code).toLowerCase().includes(term);
        const matchName = product.name.toLowerCase().includes(term);
        if (!matchCode && !matchName) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      switch (sort) {
        case 'code':
          return String(a.code).localeCompare(String(b.code));
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'stock':
          return b.stock - a.stock;
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [products, search, category, supplier, type, stockFilters, sort]);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setType('');
  };

  const handleStockFilterChange = (id) => {
    setStockFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setSupplier('');
    setType('');
    setStockFilters([]);
    setSort('name');
  };

  const handleDelete = async () => {
    await api.deleteProduct(deletingProduct.category, deletingProduct.code);
    await loadData();
  };

  const sidebar = (
    <FilterSidebar
      search={search}
      onSearchChange={setSearch}
      category={category}
      onCategoryChange={handleCategoryChange}
      supplier={supplier}
      onSupplierChange={setSupplier}
      type={type}
      onTypeChange={setType}
      stockFilters={stockFilters}
      onStockFilterChange={handleStockFilterChange}
      sort={sort}
      onSortChange={setSort}
      suppliers={suppliers}
      types={availableTypes}
      activeFilterCount={activeFilterCount}
      onClearFilters={clearFilters}
    />
  );

  return (
    <Layout sidebar={sidebar}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#0a1628]">Inventario</h2>
            <p className="text-slate-500 text-sm mt-1">
              {loading ? 'Cargando productos...' : `${filtered.length} de ${products.length} productos`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAddingProduct(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              <FiPlus />
              Agregar producto
            </button>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-1.5 bg-[#1a3a8f]/10 rounded-lg">
                <FiPackage className="text-[#1a3a8f]" />
              </div>
              <div className="text-sm">
                <span className="text-slate-400">Total</span>{' '}
                <strong className="text-[#0a1628]">{products.length}</strong>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0a1628] text-white">
                  <th className="text-left px-4 py-3.5 font-semibold text-xs uppercase tracking-wider">Codigo</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-xs uppercase tracking-wider">Producto</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-xs uppercase tracking-wider hidden md:table-cell">Categoria</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-xs uppercase tracking-wider hidden lg:table-cell">Tipo</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-xs uppercase tracking-wider hidden xl:table-cell">Proveedor</th>
                  <th className="text-right px-4 py-3.5 font-semibold text-xs uppercase tracking-wider">Contado</th>
                  <th className="text-right px-4 py-3.5 font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">Plazo</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-xs uppercase tracking-wider">Stock</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-xs uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-slate-400">
                      <div className="inline-block h-8 w-8 border-4 border-[#1a3a8f] border-t-transparent rounded-full animate-spin mb-3" />
                      <p>Cargando productos...</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-slate-400">
                      No se encontraron productos con los filtros aplicados
                    </td>
                  </tr>
                ) : (
                  filtered.map((product) => {
                    const stock = getStockBadge(product.stock);
                    return (
                      <tr
                        key={`${product.category}-${product.code}`}
                        className="border-b border-slate-100 hover:bg-blue-50/40 transition-colors group"
                      >
                        <td className="px-4 py-3 font-mono text-[#1a3a8f] font-medium text-xs">{product.code}</td>
                        <td className="px-4 py-3 text-slate-800 max-w-[220px]">
                          <span className="line-clamp-2">{product.name}</span>
                        </td>
                        <td className="px-4 py-3 capitalize text-slate-500 hidden md:table-cell">
                          <span className="px-2 py-0.5 bg-blue-50 text-[#1a3a8f] rounded text-xs font-medium">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 hidden lg:table-cell capitalize text-xs">
                          {product.type}
                        </td>
                        <td className="px-4 py-3 text-slate-500 hidden xl:table-cell text-xs">
                          {product.supplierName || product.supplier}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800">
                          {formatPrice(product.price)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 hidden sm:table-cell">
                          {formatPrice(product.installmentPrice)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${stock.className}`}>
                            {stock.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingProduct(product)}
                              title="Editar"
                              className="p-2 rounded-lg text-[#1a3a8f] hover:bg-[#1a3a8f]/10 transition-colors"
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingProduct(product)}
                              title="Eliminar"
                              className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editingProduct && (
        <ProductModal
          mode="edit"
          product={editingProduct}
          suppliers={suppliers}
          onClose={() => setEditingProduct(null)}
          onSaved={loadData}
        />
      )}

      {addingProduct && (
        <ProductModal
          mode="add"
          defaultCategory={category}
          suppliers={suppliers}
          onClose={() => setAddingProduct(false)}
          onSaved={loadData}
        />
      )}

      {deletingProduct && (
        <DeleteConfirmModal
          product={deletingProduct}
          onClose={() => setDeletingProduct(null)}
          onConfirm={handleDelete}
        />
      )}
    </Layout>
  );
}
