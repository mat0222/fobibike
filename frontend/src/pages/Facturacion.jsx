import { useMemo, useState } from 'react';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiFileText,
  FiPlus,
  FiPrinter,
  FiSearch,
} from 'react-icons/fi';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import InvoicePreview from '../components/InvoicePreview';
import InvoiceModal from '../components/InvoiceModal';
import { useInvoices } from '../hooks/useInvoices';
import { INVOICE_STATUSES, INVOICE_TYPES, PAYMENT_LABELS, statusMeta } from '../config/company';
import { IS_DEMO } from '../config/demo';
import { formatDate, formatPrice, padInvoiceNumber } from '../utils/format';

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function monthLabel(key) {
  const [, month] = String(key).split('-');
  return MONTH_LABELS[Number(month) - 1] || key;
}

export default function Facturacion() {
  const { invoices, stats, loading, error, createInvoice, updateStatus } = useInvoices();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [autoPrint, setAutoPrint] = useState(false);

  const openInvoice = (invoice, shouldPrint = false) => {
    setAutoPrint(shouldPrint);
    setSelected(invoice);
  };

  const closeInvoice = () => {
    setSelected(null);
    setAutoPrint(false);
  };

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return invoices.filter((invoice) => {
      if (status !== 'all' && invoice.status !== status) return false;
      if (type !== 'all' && invoice.type !== type) return false;
      if (!term) return true;
      const number = padInvoiceNumber(invoice.pos, invoice.number).toLowerCase();
      return (
        invoice.customerName.toLowerCase().includes(term) ||
        number.includes(term) ||
        String(invoice.customerDoc || '').includes(term)
      );
    });
  }, [invoices, search, status, type]);

  const maxMonthly = Math.max(1, ...(stats?.monthly?.map((row) => row.total) || [1]));

  const sidebar = (
    <div className="px-4 pb-6 space-y-4">
      <button
        type="button"
        onClick={() => setCreating(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold rounded-xl transition-colors"
      >
        <FiPlus />
        Nueva factura
      </button>
      <p className="text-slate-500 text-xs leading-relaxed px-1">
        {IS_DEMO
          ? 'Comprobantes de muestra para la presentación. Podés emitir, cobrar o anular sin afectar datos reales.'
          : 'Emití facturas A, B o C, registrá cobros y consultá el CAE simulado del comprobante.'}
      </p>
    </div>
  );

  return (
    <Layout sidebar={sidebar}>
      <div className="space-y-6 no-print">
        <PageHeader
          eyebrow="Tesorería"
          title="Facturación"
          description={
            IS_DEMO
              ? 'Módulo comercial listo para mostrar: comprobantes, estados y vista previa imprimible.'
              : 'Emisión de comprobantes, control de cobros y seguimiento de vencimientos.'
          }
          actions={
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-xl shadow-sm"
            >
              <FiPlus />
              Emitir factura
            </button>
          }
        />

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-200">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-400">Cargando facturación...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                icon={FiFileText}
                label="Facturado del mes"
                value={formatPrice(stats?.month?.total || 0)}
                sub={`${stats?.month?.count || 0} comprobantes`}
                tone="blue"
              />
              <StatCard
                icon={FiCheckCircle}
                label="Cobrado"
                value={formatPrice(stats?.collected?.total || 0)}
                sub={`${stats?.collected?.count || 0} pagadas`}
                tone="green"
              />
              <StatCard
                icon={FiClock}
                label="Pendiente"
                value={formatPrice(stats?.pending?.total || 0)}
                sub={`${stats?.pending?.count || 0} por cobrar`}
                tone="amber"
              />
              <StatCard
                icon={FiAlertCircle}
                label="Vencido"
                value={formatPrice(stats?.overdue?.total || 0)}
                sub={`${stats?.overdue?.count || 0} fuera de término`}
                tone="red"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900 mb-4">Facturado últimos 6 meses</h2>
                {stats?.monthly?.length ? (
                  <div className="flex items-end gap-3 h-40">
                    {stats.monthly.map((row) => (
                      <div key={row.month} className="flex-1 flex flex-col items-center gap-2 h-full">
                        <div className="w-full flex-1 flex items-end">
                          <div
                            className="w-full rounded-t-lg bg-gradient-to-t from-[#1e40af] to-[#60a5fa] min-h-1"
                            style={{ height: `${Math.max(6, (row.total / maxMonthly) * 100)}%` }}
                            title={formatPrice(row.total)}
                          />
                        </div>
                        <span className="text-[11px] text-slate-400">{monthLabel(row.month)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Todavía no hay comprobantes para graficar.</p>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900 mb-4">Por tipo (mes)</h2>
                {stats?.byType?.length ? (
                  <div className="space-y-3">
                    {stats.byType.map((row) => (
                      <div key={row.type} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-800">Factura {row.type}</p>
                          <p className="text-xs text-slate-400">{row.count} comprobantes</p>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{formatPrice(row.total)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Sin movimiento este mes.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por cliente, CUIT o número..."
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option value="all">Todos los estados</option>
                  {INVOICE_STATUSES.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option value="all">Todos los tipos</option>
                  {INVOICE_TYPES.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                      <th className="text-left px-4 py-3 font-semibold">Comprobante</th>
                      <th className="text-left px-4 py-3 font-semibold">Cliente</th>
                      <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Fecha</th>
                      <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Estado</th>
                      <th className="text-right px-4 py-3 font-semibold">Total</th>
                      <th className="text-right px-4 py-3 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-16 text-slate-400">
                          No hay comprobantes con esos filtros.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((invoice) => {
                        const meta = statusMeta(invoice.status);
                        return (
                          <tr key={invoice.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                            <td className="px-4 py-3">
                              <p className="font-mono text-xs font-semibold text-slate-800">
                                {padInvoiceNumber(invoice.pos, invoice.number)}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">Factura {invoice.type}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-800">{invoice.customerName}</p>
                              <p className="text-xs text-slate-400">
                                {PAYMENT_LABELS[invoice.paymentMethod] || invoice.paymentMethod}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-slate-500 hidden md:table-cell whitespace-nowrap">
                              {formatDate(invoice.date)}
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${meta.className}`}>
                                {meta.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900">
                              {formatPrice(invoice.total)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => openInvoice(invoice)}
                                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#1d4ed8]"
                                  title="Ver comprobante"
                                >
                                  <FiEye size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openInvoice(invoice, true)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#1d4ed8] hover:bg-blue-50"
                                  title="Imprimir factura"
                                >
                                  <FiPrinter size={14} />
                                  Imprimir
                                </button>
                                {invoice.status === 'emitida' || invoice.status === 'vencida' ? (
                                  <button
                                    type="button"
                                    onClick={() => updateStatus(invoice.id, 'pagada')}
                                    className="px-2 py-1 text-xs font-semibold rounded-lg text-emerald-700 hover:bg-emerald-50"
                                  >
                                    Cobrar
                                  </button>
                                ) : null}
                                {invoice.status !== 'anulada' && invoice.status !== 'pagada' ? (
                                  <button
                                    type="button"
                                    onClick={() => updateStatus(invoice.id, 'anulada')}
                                    className="px-2 py-1 text-xs font-semibold rounded-lg text-slate-500 hover:bg-slate-100"
                                  >
                                    Anular
                                  </button>
                                ) : null}
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
          </>
        )}
      </div>

      {selected && (
        <InvoicePreview
          invoice={selected}
          autoPrint={autoPrint}
          onClose={closeInvoice}
        />
      )}
      {creating && (
        <InvoiceModal
          onClose={() => setCreating(false)}
          onSubmit={createInvoice}
        />
      )}
    </Layout>
  );
}
