import { FiEyeOff, FiShield } from 'react-icons/fi';
import { DEMO_MESSAGE, IS_DEMO } from '../config/demo';

export function DemoBanner() {
  if (!IS_DEMO) return null;

  return (
    <div className="bg-[#0b1220] border-b border-white/10 px-4 py-2 text-center text-xs text-slate-300 print:hidden no-print">
      <span className="font-semibold text-white">Demostración comercial</span>
      <span className="text-slate-400"> — inventario y ventas reales no se exhiben. Facturación y reparaciones usan datos de muestra.</span>
    </div>
  );
}

export function HiddenDataPanel({ section = 'esta sección' }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16 sm:py-20 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
        <FiEyeOff className="text-slate-400" size={24} />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{DEMO_MESSAGE.title}</h3>
      <p className="text-slate-500 text-sm max-w-md leading-relaxed mb-6">
        {DEMO_MESSAGE.body}
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-sm">
        <FiShield className="text-[#2563eb]" size={16} />
        <span>
          En producción, aquí verías <strong className="text-slate-800">{section}</strong>.
        </span>
      </div>
    </div>
  );
}
