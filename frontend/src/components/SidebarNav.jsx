import { NavLink } from 'react-router-dom';
import { FiBox, FiDollarSign, FiMessageCircle } from 'react-icons/fi';

const navItems = [
  { to: '/', label: 'Inventario', icon: FiBox, end: true },
  { to: '/ingresos', label: 'Ingresos', icon: FiDollarSign, end: false },
  { to: '/fobi', label: 'Fobi', icon: FiMessageCircle, end: false },
];

export default function SidebarNav() {
  return (
    <nav className="px-3 py-4 border-b border-white/15 shrink-0">
      <p className="px-3 text-[10px] font-bold text-blue-100/60 uppercase tracking-widest mb-2">
        Menu
      </p>
      <div className="space-y-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white text-[#1e40af] shadow-md'
                  : 'text-blue-50 hover:bg-white/10'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
