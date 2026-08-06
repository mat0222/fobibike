import { useCallback, useEffect, useState } from 'react';
import {
  FiCalendar,
  FiDollarSign,
  FiPlus,
  FiShoppingCart,
  FiTrendingUp,
  FiTrash2,
} from 'react-icons/fi';
import Layout from '../components/Layout';
import SaleModal from '../components/SaleModal';
import { HiddenDataPanel } from '../components/DemoBanner';
import { api } from '../api/client';
import { IS_DEMO } from '../config/demo';

function formatPrice(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

const PAYMENT_LABELS = {
  contado: 'Contado',
  plazo: 'Plazo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
};

function StatCard({ icon: Icon, label, value, sub, accent = 'blue' }) {
  const colors = {
    blue: 'from-[#2563eb] to-[#1e40af]',
    green: 'from-[#22c55e] to-[#16a34a]',
    dark: 'from-[#0a1628] to-[#1e3a5f]',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[accent]} rounded-2xl p-5 text-white shadow-lg`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
          {sub && <p className="text-white/60 text-sm mt-1">{sub}</p>}
        </div>
        <div className="p-2.5 bg-white/15 rounded-xl">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

export default function Ingresos() {
  const [stats, setStats] = useState(null);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSaleModal, setShowSaleModal] = useState(false);

  const loadData = useCallback(async () => {
    if (IS_DEMO) {
      setStats(null);
      setSales([]);
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [statsRes, salesRes, productsRes] = await Promise.all([
        api.getSalesStats(),
        api.getSales(),
        api.getProducts(),
      ]);
      setStats(statsRes.data);
      setSales(salesRes.data || []);
      setProducts(productsRes.data || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los ingresos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteSale = async (id) => {
    if (!confirm('Eliminar esta venta del registro? (No restaura el stock)')) return;
    try {
      await api.deleteSale(id);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const maxDaily = Math.max(...(stats?.dailyLast7?.map((d) => d.total) || [1]), 1);

  const sidebar = (
    <div className="p-4">
      <p className="text-blue-100/70 text-sm leading-relaxed">
        {IS_DEMO
          ? 'En la demo no se muestran ventas ni montos reales. Solo la estructura del panel.'
          : 'Registra ventas para llevar el control de ingresos. Al confirmar una venta, el stock se descuenta automaticamente.'}
      </p>
      {!IS_DEMO && (
        <button
          type="button"
          onClick={() => setShowSaleModal(true)}
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold rounded-xl transition-colors shadow-lg shadow-green-900/20"
        >
          <FiPlus />
          Nueva venta
        </button>
      )}
    </div>
  );

  return (
    <Layout sidebar={sidebar}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#0a1628]">Control de ingresos</h2>
            <p className="text-slate-500 text-sm mt-1">
              {IS_DEMO ? 'Vista previa — datos ocultos por privacidad' : 'Estadisticas y registro de ventas'}
            </p>
          </div>
        </div>

        {IS_DEMO ? (
          <HiddenDataPanel section="estadísticas, gráficos y el listado de ventas" />
        ) : (
          <>
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-200">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-400">Cargando estadisticas...</div>
        ) : stats && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                icon={FiDollarSign}
                label="Ingresos hoy"
                value={formatPrice(stats.today.total)}
                sub={`${stats.today.count} venta(s)`}
                accent="green"
              />
              <StatCard
                icon={FiCalendar}
                label="Este mes"
                value={formatPrice(stats.month.total)}
                sub={`${stats.month.count} venta(s)`}
                accent="blue"
              />
              <StatCard
                icon={FiTrendingUp}
                label="Ultimos 7 dias"
                value={formatPrice(stats.week.total)}
                sub={`${stats.week.count} venta(s)`}
                accent="blue"
              />
              <StatCard
                icon={FiShoppingCart}
                label="Total historico"
                value={formatPrice(stats.allTime.total)}
                sub={`${stats.allTime.count} venta(s) registradas`}
                accent="dark"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <h3 className="font-bold text-[#0a1628] mb-4">Ingresos ultimos 7 dias</h3>
                {stats.dailyLast7.length === 0 ? (
                  <p className="text-slate-400 text-sm">Sin ventas registradas</p>
                ) : (
                  <div className="space-y-3">
                    {stats.dailyLast7.map((day) => (
                      <div key={day.date}>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>{new Date(day.date).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                          <span className="font-medium text-slate-700">{formatPrice(day.total)}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#2563eb] to-[#22c55e] rounded-full transition-all"
                            style={{ width: `${(day.total / maxDaily) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <h3 className="font-bold text-[#0a1628] mb-4">Por categoria (mes actual)</h3>
                {stats.byCategory.length === 0 ? (
                  <p className="text-slate-400 text-sm">Sin datos este mes</p>
                ) : (
                  <div className="space-y-3">
                    {stats.byCategory.map((item) => (
                      <div key={item.category} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                        <span className="capitalize text-slate-700 font-medium">{item.category}</span>
                        <div className="text-right">
                          <p className="font-semibold text-[#1a3a8f]">{formatPrice(item.total)}</p>
                          <p className="text-xs text-slate-400">{item.count} venta(s)</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-bold text-[#0a1628]">Ventas recientes</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                      <th className="text-left px-4 py-3">Fecha</th>
                      <th className="text-left px-4 py-3">Producto</th>
                      <th className="text-center px-4 py-3">Cant.</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Pago</th>
                      <th className="text-right px-4 py-3">Total</th>
                      <th className="text-center px-4 py-3">Accion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400">
                          No hay ventas registradas. Usa &quot;Nueva venta&quot; para empezar.
                        </td>
                      </tr>
                    ) : (
                      sales.map((sale) => (
                        <tr key={sale.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(sale.date)}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800 line-clamp-1">{sale.productName}</p>
                            <p className="text-xs text-slate-400 font-mono">{sale.code}</p>
                          </td>
                          <td className="px-4 py-3 text-center">{sale.quantity}</td>
                          <td className="px-4 py-3 hidden sm:table-cell capitalize text-slate-500">
                            {PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-[#22c55e]">
                            {formatPrice(sale.total)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteSale(sale.id)}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Eliminar registro"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      {showSaleModal && (
        <SaleModal
          products={products}
          onClose={() => setShowSaleModal(false)}
          onSaved={loadData}
        />
      )}
          </>
        )}
      </div>
    </Layout>
  );
}
