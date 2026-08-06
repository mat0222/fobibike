import { FiEyeOff, FiShield } from 'react-icons/fi';
import { DEMO_MESSAGE, IS_DEMO } from '../config/demo';

/** Banner fijo en la parte superior cuando la app corre en modo demo (GitHub Pages). */
export function DemoBanner() {
  if (!IS_DEMO) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center text-sm text-amber-900">
      <span className="font-semibold">Vista previa pública</span>
      <span className="text-amber-800/80"> — los datos del negocio no se muestran por privacidad.</span>
    </div>
  );
}

/**
 * Panel amigable en lugar de tablas/listados con datos reales.
 * Usar en Inventario, Ingresos y Fobi cuando IS_DEMO.
 */
export function HiddenDataPanel({ section = 'esta sección' }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16 sm:py-20 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
        <FiEyeOff className="text-slate-400" size={28} />
      </div>
      <h3 className="text-xl font-bold text-[#0a1628] mb-2">{DEMO_MESSAGE.title}</h3>
      <p className="text-slate-500 text-sm max-w-md leading-relaxed mb-6">
        {DEMO_MESSAGE.body}
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-sm">
        <FiShield className="text-[#2563eb]" size={16} />
        <span>
          En producción, aquí verías <strong className="text-slate-800">{section}</strong> con datos reales.
        </span>
      </div>
    </div>
  );
}
