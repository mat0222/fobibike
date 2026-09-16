import { NavLink } from 'react-router-dom';
import { FiBox, FiFileText, FiMessageCircle, FiTool, FiTrendingUp } from 'react-icons/fi';

const groups = [
  {
    label: 'Operaciones',
    items: [
      { to: '/', label: 'Inventario', icon: FiBox, end: true },
      { to: '/ingresos', label: 'Ingresos', icon: FiTrendingUp },
      { to: '/facturacion', label: 'Facturación', icon: FiFileText },
      { to: '/reparaciones', label: 'Reparaciones', icon: FiTool },
    ],
  },
  {
    label: 'Asistente',
    items: [
      { to: '/fobi', label: 'Fobi IA', icon: FiMessageCircle },
    ],
  },
];

export default function SidebarNav({ onNavigate }) {
  return (
    <nav className="px-3 py-4 space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.18em]">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/10'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
