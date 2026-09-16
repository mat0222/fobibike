import { useMemo, useState } from 'react';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiPlus,
  FiSearch,
  FiTool,
  FiTruck,
} from 'react-icons/fi';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import RepairModal from '../components/RepairModal';
import RepairDetail from '../components/RepairDetail';
import { useRepairs } from '../hooks/useRepairs';
import {
  BOARD_COLUMNS,
  repairPriorityMeta,
  repairStatusMeta,
  repairTypeLabel,
} from '../config/repairs';
import { IS_DEMO } from '../config/demo';
import { formatDate, formatPrice, isoDate, padRepairNumber } from '../utils/format';

export default function Reparaciones() {
  const { repairs, stats, loading, error, createRepair, updateStatus } = useRepairs();
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return repairs;
    return repairs.filter((repair) => {
      const number = padRepairNumber(repair.number).toLowerCase();
      return (
        repair.customerName.toLowerCase().includes(term) ||
        repair.bike.toLowerCase().includes(term) ||
        number.includes(term) ||
        String(repair.customerPhone || '').includes(term)
      );
    });
  }, [repairs, search]);

  const handleStatusChange = async (id, status) => {
    await updateStatus(id, status);
    setSelected((current) => {
      if (!current || current.id !== id) return current;
      return {
        ...current,
        status,
        deliveredAt: status === 'entregada' ? isoDate() : current.deliveredAt,
      };
    });
  };

  const sidebar = (
    <div className="px-4 pb-6 space-y-4">
      <button
        type="button"
        onClick={() => setCreating(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold rounded-xl transition-colors"
      >
        <FiPlus />
        Nueva orden
      </button>
      <p className="text-slate-500 text-xs leading-relaxed px-1">
        {IS_DEMO
          ? 'Tablero de taller con órdenes de muestra. Podés avanzar estados y cargar ingresos sin tocar el taller real.'
          : 'Ingresá bicicletas, asigná técnico y seguí el trabajo hasta la entrega.'}
      </p>
    </div>
  );

  return (
    <Layout sidebar={sidebar}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Taller"
          title="Reparaciones"
          description={
            IS_DEMO
              ? 'Órdenes de trabajo, prioridades y tablero de estados listos para mostrar al cliente.'
              : 'Recepción, diagnóstico, reparación y entrega de bicicletas.'
          }
          actions={
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-xl shadow-sm"
            >
              <FiPlus />
              Ingresar bicicleta
            </button>
          }
        />

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-200">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-400">Cargando taller...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                icon={FiTool}
                label="En taller"
                value={stats?.inShop?.count || 0}
                sub={`${formatPrice(stats?.inShop?.total || 0)} en curso`}
                tone="blue"
              />
              <StatCard
                icon={FiCheckCircle}
                label="Listas para retirar"
                value={stats?.ready?.count || 0}
                sub="Avisar al cliente"
                tone="green"
              />
              <StatCard
                icon={FiTruck}
                label="Entregadas del mes"
                value={stats?.delivered?.count || 0}
                sub={formatPrice(stats?.delivered?.total || 0)}
                tone="slate"
              />
              <StatCard
                icon={FiAlertCircle}
                label="Fuera de término"
                value={stats?.overdue?.count || 0}
                sub="Pasaron la fecha prometida"
                tone="red"
              />
            </div>

            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por cliente, bici o número de orden..."
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {BOARD_COLUMNS.map((columnId) => {
                const column = repairStatusMeta(columnId);
                const cards = filtered.filter((repair) => repair.status === columnId);
                return (
                  <section key={columnId} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm min-h-[280px] flex flex-col">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-slate-900">{column.column}</h2>
                      <span className="text-xs font-semibold text-slate-400">{cards.length}</span>
                    </div>
                    <div className="p-3 space-y-3 flex-1">
                      {cards.length === 0 ? (
                        <p className="text-xs text-slate-400 px-1 py-6 text-center">Sin órdenes</p>
                      ) : (
                        cards.map((repair) => {
                          const priority = repairPriorityMeta(repair.priority);
                          const overdue = repair.status !== 'entregada' && repair.promisedAt && repair.promisedAt < isoDate();
                          return (
                            <button
                              key={repair.id}
                              type="button"
                              onClick={() => setSelected(repair)}
                              className="w-full text-left rounded-xl border border-slate-200 bg-slate-50/70 hover:border-blue-200 hover:bg-white p-3 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-mono text-[11px] font-semibold text-slate-500">
                                  {padRepairNumber(repair.number)}
                                </p>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${priority.className}`}>
                                  {priority.label}
                                </span>
                              </div>
                              <p className="mt-2 text-sm font-semibold text-slate-900 line-clamp-1">{repair.customerName}</p>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{repair.bike}</p>
                              <p className="text-xs text-slate-500 mt-2 line-clamp-2">{repair.issue}</p>
                              <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400">
                                <span>{repairTypeLabel(repair.type)}</span>
                                <span className={overdue ? 'text-red-600 font-medium' : ''}>
                                  {formatDate(repair.promisedAt)}
                                </span>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </section>
                );
              })}
            </div>

            {filtered.some((repair) => repair.status === 'cancelada') && (
              <p className="text-xs text-slate-400">
                Hay {filtered.filter((repair) => repair.status === 'cancelada').length} orden(es) cancelada(s) fuera del tablero.
              </p>
            )}
          </>
        )}
      </div>

      {selected && (
        <RepairDetail
          repair={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
      {creating && (
        <RepairModal
          onClose={() => setCreating(false)}
          onSubmit={createRepair}
        />
      )}
    </Layout>
  );
}
