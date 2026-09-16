import { FiLogOut, FiMenu } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SidebarNav from './SidebarNav';
import { DemoBanner } from './DemoBanner';
import { assetUrl } from '../config/demo';
import { useState } from 'react';

const PAGE_META = {
  '/': { title: 'Inventario', section: 'Operaciones' },
  '/ingresos': { title: 'Ingresos', section: 'Operaciones' },
  '/facturacion': { title: 'Facturación', section: 'Operaciones' },
  '/reparaciones': { title: 'Reparaciones', section: 'Operaciones' },
  '/fobi': { title: 'Fobi IA', section: 'Asistente' },
};

function getPageMeta(pathname) {
  return PAGE_META[pathname] || { title: 'Panel', section: 'FOBI Bike' };
}

export default function Layout({ children, sidebar }) {
  const { user, logout, isDemo } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const page = getPageMeta(location.pathname);
  const initial = (user?.usuario || 'U').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f3f5f8] print:bg-white">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[272px] h-screen bg-[#0b1220] text-white transform transition-transform duration-200 flex flex-col print:hidden no-print ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="shrink-0 px-5 py-5 border-b border-white/10">
          <img
            src={assetUrl('FOBIBike.png')}
            alt="FOBI Bike"
            className="w-full max-w-[168px] object-contain"
          />
          <p className="mt-3 text-[11px] text-slate-500 uppercase tracking-[0.18em]">
            Panel de administración
          </p>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <SidebarNav onNavigate={() => setSidebarOpen(false)} />
          {sidebar}
        </div>

        <div className="shrink-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#2563eb] flex items-center justify-center text-sm font-semibold">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white capitalize truncate">{user?.usuario}</p>
              <p className="text-[11px] text-slate-500">{isDemo ? 'Acceso de demostración' : 'Administrador'}</p>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm print:hidden"
          onClick={() => setSidebarOpen(false)}
          role="presentation"
        />
      )}

      <div className="lg:ml-[272px] min-h-screen flex flex-col min-w-0 print:ml-0">
        <DemoBanner />
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 flex items-center justify-between sticky top-0 z-20 print:hidden no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <FiMenu className="w-5 h-5 text-slate-700" />
            </button>

            <img
              src={assetUrl('FOBIBike.png')}
              alt="FOBI Bike"
              className="h-7 object-contain lg:hidden"
            />

            <div className="hidden lg:block min-w-0">
              <p className="text-[11px] text-slate-400 uppercase tracking-[0.16em]">{page.section}</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{page.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <span className="hidden md:block text-xs text-slate-400">
              {new Intl.DateTimeFormat('es-AR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              }).format(new Date())}
            </span>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-100 text-slate-600 text-sm font-medium transition-colors"
            >
              <FiLogOut />
              <span className="hidden sm:inline">{isDemo ? 'Salir' : 'Cerrar sesión'}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 print:p-0">{children}</main>
      </div>
    </div>
  );
}
