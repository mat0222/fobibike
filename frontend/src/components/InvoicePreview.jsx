import { useEffect } from 'react';
import { FiPrinter, FiX } from 'react-icons/fi';
import { COMPANY, PAYMENT_LABELS, statusMeta } from '../config/company';
import { assetUrl } from '../config/demo';
import { formatDate, formatDoc, formatPrice, padInvoiceNumber } from '../utils/format';

export default function InvoicePreview({ invoice, autoPrint = false, onClose }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!autoPrint || !invoice) return undefined;
    const timer = window.setTimeout(() => window.print(), 350);
    return () => window.clearTimeout(timer);
  }, [autoPrint, invoice]);

  if (!invoice) return null;

  const status = statusMeta(invoice.status);
  const number = padInvoiceNumber(invoice.pos, invoice.number);

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-8 overflow-y-auto bg-slate-900/60 backdrop-blur-sm print:static print:inset-auto print:p-0 print:bg-white print:overflow-visible print:block">
      <div className="w-full max-w-3xl my-6 print:max-w-none print:my-0">
        <div className="flex items-center justify-between mb-4 no-print">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Comprobante</p>
            <p className="text-white font-semibold">{number}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-white/80 hover:bg-white/10"
            aria-label="Cerrar"
          >
            <FiX size={20} />
          </button>
        </div>

        <article
          id="invoice-print-root"
          className="bg-white rounded-2xl shadow-2xl overflow-hidden print:rounded-none print:shadow-none"
        >
          <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div>
              <p className="text-sm font-semibold text-slate-900">Listo para imprimir</p>
              <p className="text-xs text-slate-500">Se imprime en hoja A4, sin el menú del panel.</p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold"
            >
              <FiPrinter />
              Imprimir factura
            </button>
          </div>

          <div className="h-1.5 bg-gradient-to-r from-[#1e3a8a] via-[#2563eb] to-[#22c55e] print:h-1" />

          <div className="p-8 sm:p-10">
            <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-6 border-b border-slate-200">
              <div>
                <img src={assetUrl('FOBIBike.png')} alt="FOBI Bike" className="h-12 object-contain mb-4" />
                <p className="font-semibold text-slate-900">{COMPANY.legalName}</p>
                <p className="text-sm text-slate-500 mt-1">{COMPANY.address}</p>
                <p className="text-sm text-slate-500">{COMPANY.city}</p>
                <p className="text-sm text-slate-500 mt-2">CUIT {COMPANY.cuit}</p>
                <p className="text-sm text-slate-500">{COMPANY.iva}</p>
                <p className="text-sm text-slate-500">Ing. Brutos {COMPANY.iibb}</p>
                <p className="text-sm text-slate-500">Inicio de actividades {COMPANY.startDate}</p>
              </div>

              <div className="sm:text-right">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold tracking-widest">
                  FACTURA {invoice.type}
                </div>
                <p className="mt-3 font-mono text-xl font-semibold text-slate-900">{number}</p>
                <p className="text-sm text-slate-500 mt-2">Fecha {formatDate(invoice.date)}</p>
                {invoice.dueDate && (
                  <p className="text-sm text-slate-500">Vencimiento {formatDate(invoice.dueDate)}</p>
                )}
                <span className={`inline-flex mt-3 px-2.5 py-1 rounded-full text-xs font-semibold ${status.className}`}>
                  {status.label}
                </span>
              </div>
            </header>

            <section className="grid sm:grid-cols-2 gap-6 py-6 border-b border-slate-200">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-2">Cliente</p>
                <p className="font-semibold text-slate-900">{invoice.customerName}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {String(invoice.customerDoc || '').replace(/\D/g, '').length === 11 ? 'CUIT' : 'DNI'}{' '}
                  {formatDoc(invoice.customerDoc)}
                </p>
                <p className="text-sm text-slate-500">{invoice.customerCondition}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-2">Pago</p>
                <p className="text-sm text-slate-700">
                  {PAYMENT_LABELS[invoice.paymentMethod] || invoice.paymentMethod}
                </p>
                {invoice.notes && <p className="text-sm text-slate-500 mt-2">{invoice.notes}</p>}
              </div>
            </section>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="text-left py-2 font-semibold">Descripción</th>
                    <th className="text-center py-2 font-semibold w-16">Cant.</th>
                    <th className="text-right py-2 font-semibold w-28">P. unitario</th>
                    <th className="text-right py-2 font-semibold w-28">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items || []).map((item) => (
                    <tr key={item.id || item.description} className="border-b border-slate-100">
                      <td className="py-3 text-slate-800">{item.description}</td>
                      <td className="py-3 text-center text-slate-600">{item.quantity}</td>
                      <td className="py-3 text-right text-slate-600">{formatPrice(item.unitPrice)}</td>
                      <td className="py-3 text-right font-medium text-slate-900">
                        {formatPrice(item.subtotal ?? item.quantity * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <dl className="w-full max-w-xs space-y-2 text-sm">
                <div className="flex justify-between text-slate-500">
                  <dt>Subtotal</dt>
                  <dd>{formatPrice(invoice.subtotal)}</dd>
                </div>
                <div className="flex justify-between text-slate-500">
                  <dt>{invoice.type === 'C' ? 'IVA' : 'IVA 21%'}</dt>
                  <dd>{formatPrice(invoice.tax)}</dd>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                  <dt className="font-semibold text-slate-900">Total</dt>
                  <dd className="text-xl font-semibold text-slate-900">{formatPrice(invoice.total)}</dd>
                </div>
              </dl>
            </div>

            <footer className="mt-10 pt-5 border-t border-dashed border-slate-200 text-xs text-slate-500 grid sm:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-slate-700 mb-1">CAE N° {invoice.cae || '—'}</p>
                <p>Fecha de vto. de CAE: {formatDate(invoice.caeDue)}</p>
              </div>
              <div className="sm:text-right">
                <p>Comprobante emitido por el sistema de gestión FOBI Bike.</p>
                <p className="mt-1">{COMPANY.email} · {COMPANY.phone}</p>
              </div>
            </footer>

            <div className="no-print mt-8 pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold"
              >
                <FiPrinter />
                Imprimir factura
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
