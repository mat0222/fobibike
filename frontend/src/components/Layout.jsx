import { FiLogOut, FiMenu } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import SidebarNav from './SidebarNav';
import { useState } from 'react';

export default function Layout({ children, sidebar }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 h-screen bg-gradient-to-b from-[#2563eb] to-[#1e40af] text-white transform transition-transform duration-200 flex flex-col shadow-xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="shrink-0 p-5 border-b border-white/20 bg-white/5">
          <img
            src="/FOBIBike.png"
            alt="FOBI Bike"
            className="w-full max-w-[200px] mx-auto object-contain"
          />
          <p className="text-center text-blue-100/80 text-xs mt-2 font-medium tracking-wide uppercase">
            Panel de administracion
          </p>
        </div>
        <SidebarNav />
        <div className="flex-1 overflow-y-auto overscroll-contain">{sidebar}</div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          role="presentation"
        />
      )}

      <div className="lg:ml-72 min-h-screen flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200/80 px-4 lg:px-8 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
            onClick={() => setSidebarOpen(true)}
          >
            <FiMenu className="w-6 h-6 text-slate-700" />
          </button>

          <img
            src="/FOBIBike.png"
            alt="FOBI Bike"
            className="h-8 object-contain lg:hidden"
          />

          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm text-slate-500 hidden sm:block">
              <span className="text-slate-400">Usuario:</span>{' '}
              <strong className="text-[#1a3a8f] capitalize">{user?.usuario}</strong>
            </span>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-sm font-medium transition-colors"
            >
              <FiLogOut />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
