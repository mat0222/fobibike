import { useCallback, useEffect, useState } from 'react';
import {
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiPlus,
  FiShoppingCart,
  FiTrash2,
  FiTrendingUp,
} from 'react-icons/fi';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import SaleModal from '../components/SaleModal';
import InvoiceModal from '../components/InvoiceModal';
import { HiddenDataPanel } from '../components/DemoBanner';
import { api } from '../api/client';
import { IS_DEMO } from '../config/demo';
import { formatDate, formatPrice, isoDate } from '../utils/format';
import { PAYMENT_LABELS } from '../config/company';

export default function Ingresos() {
  const [stats, setStats] = useState(null);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [saleToInvoice, setSaleToInvoice] = useState(null);

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
    if (!confirm('¿Eliminar esta venta del registro? No restaura el stock.')) return;
    try {
      await api.deleteSale(id);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const maxDaily = Math.max(...(stats?.dailyLast7?.map((d) => d.total) || [1]), 1);

  const sidebar = (
    <div className="px-4 pb-6">
      <p className="text-slate-500 text-xs leading-relaxed">
        {IS_DEMO
          ? 'En la demo no se muestran ventas ni montos reales. Recorré Facturación para ver el módulo comercial.'
          : 'Registrá ventas y emití la factura correspondiente. Al confirmar, el stock se descuenta automáticamente.'}
      </p>
      {!IS_DEMO && (
        <button
          type="button"
          onClick={() => setShowSaleModal(true)}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-xl transition-colors"
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
        <PageHeader
          eyebrow="Tesorería"
          title="Control de ingresos"
          description={IS_DEMO ? 'Vista estructural — las ventas reales no se exhiben.' : 'Estadísticas y registro de ventas del local.'}
          actions={
            !IS_DEMO ? (
              <button
                type="button"
                onClick={() => setShowSaleModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-xl shadow-sm"
              >
                <FiPlus />
                Nueva venta
              </button>
            ) : null
          }
        />

        {IS_DEMO ? (
          <HiddenDataPanel section="estadísticas, gráficos y el listado de ventas" />
        ) : (
          <>
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-200">{error}</div>
            )}

            {loading ? (
              <div className="text-center py-20 text-slate-400">Cargando estadísticas...</div>
            ) : stats && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <StatCard
                    icon={FiDollarSign}
                    label="Ingresos hoy"
                    value={formatPrice(stats.today.total)}
                    sub={`${stats.today.count} venta(s)`}
                    tone="green"
                  />
                  <StatCard
                    icon={FiCalendar}
                    label="Este mes"
                    value={formatPrice(stats.month.total)}
                    sub={`${stats.month.count} venta(s)`}
                    tone="blue"
                  />
                  <StatCard
                    icon={FiTrendingUp}
                    label="Últimos 7 días"
                    value={formatPrice(stats.week.total)}
                    sub={`${stats.week.count} venta(s)`}
                    tone="blue"
                  />
                  <StatCard
                    icon={FiShoppingCart}
                    label="Total histórico"
                    value={formatPrice(stats.allTime.total)}
                    sub={`${stats.allTime.count} venta(s) registradas`}
                    tone="slate"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-900 mb-4">Ingresos últimos 7 días</h3>
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
                                className="h-full bg-[#2563eb] rounded-full transition-all"
                                style={{ width: `${(day.total / maxDaily) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-900 mb-4">Por categoría (mes actual)</h3>
                    {stats.byCategory.length === 0 ? (
                      <p className="text-slate-400 text-sm">Sin datos este mes</p>
                    ) : (
                      <div className="space-y-3">
                        {stats.byCategory.map((item) => (
                          <div key={item.category} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                            <span className="capitalize text-slate-700 font-medium">{item.category}</span>
                            <div className="text-right">
                              <p className="font-semibold text-slate-900">{formatPrice(item.total)}</p>
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
                    <h3 className="text-sm font-semibold text-slate-900">Ventas recientes</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                          <th className="text-left px-4 py-3 font-semibold">Fecha</th>
                          <th className="text-left px-4 py-3 font-semibold">Producto</th>
                          <th className="text-center px-4 py-3 font-semibold">Cant.</th>
                          <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Pago</th>
                          <th className="text-right px-4 py-3 font-semibold">Total</th>
                          <th className="text-center px-4 py-3 font-semibold">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-12 text-slate-400">
                              No hay ventas registradas. Usá &quot;Nueva venta&quot; para empezar.
                            </td>
                          </tr>
                        ) : (
                          sales.map((sale) => (
                            <tr key={sale.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(sale.date, true)}</td>
                              <td className="px-4 py-3">
                                <p className="font-medium text-slate-800 line-clamp-1">{sale.productName}</p>
                                <p className="text-xs text-slate-400 font-mono">{sale.code}</p>
                              </td>
                              <td className="px-4 py-3 text-center">{sale.quantity}</td>
                              <td className="px-4 py-3 hidden sm:table-cell capitalize text-slate-500">
                                {PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                {formatPrice(sale.total)}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setSaleToInvoice(sale)}
                                    className="p-2 text-slate-400 hover:text-[#1d4ed8] hover:bg-blue-50 rounded-lg"
                                    title="Emitir factura"
                                  >
                                    <FiFileText size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSale(sale.id)}
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                    title="Eliminar registro"
                                  >
                                    <FiTrash2 size={16} />
                                  </button>
                                </div>
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

            {saleToInvoice && (
              <InvoiceModal
                preset={{
                  type: 'B',
                  customerName: 'Consumidor Final',
                  customerCondition: 'Consumidor Final',
                  paymentMethod: saleToInvoice.paymentMethod,
                  date: isoDate(saleToInvoice.date),
                  dueDate: isoDate(saleToInvoice.date),
                  notes: `Venta #${saleToInvoice.id} · ${saleToInvoice.code}`,
                  saleId: saleToInvoice.id,
                  items: [
                    {
                      description: saleToInvoice.productName,
                      quantity: saleToInvoice.quantity,
                      unitPrice: saleToInvoice.unitPrice,
                    },
                  ],
                }}
                onClose={() => setSaleToInvoice(null)}
                onSubmit={async (payload) => {
                  await api.createInvoice(payload);
                }}
              />
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
