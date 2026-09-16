import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { IS_DEMO } from '../config/demo';
import { getDemoRepairs } from '../config/demoRepairs';
import { addDays, isoDate } from '../utils/format';

const STORAGE_KEY = 'fobibike-demo-repairs-v1';

function readDemoRepairs() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return getDemoRepairs();
}

function writeDemoRepairs(repairs) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(repairs));
}

function buildStats(repairs) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const inShop = repairs.filter((item) => item.status === 'recepcionada' || item.status === 'en_reparacion');
  const ready = repairs.filter((item) => item.status === 'lista');
  const delivered = repairs.filter(
    (item) => item.status === 'entregada' && String(item.deliveredAt || item.receivedAt).startsWith(monthKey)
  );
  const overdue = repairs.filter((item) => {
    if (item.status === 'entregada' || item.status === 'cancelada') return false;
    return item.promisedAt && item.promisedAt < isoDate();
  });

  return {
    inShop: { count: inShop.length, total: inShop.reduce((sum, item) => sum + Number(item.total || 0), 0) },
    ready: { count: ready.length },
    delivered: { count: delivered.length, total: delivered.reduce((sum, item) => sum + Number(item.total || 0), 0) },
    overdue: { count: overdue.length },
  };
}

export function useRepairs() {
  const [repairs, setRepairs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (IS_DEMO) {
        const data = readDemoRepairs();
        setRepairs(data);
        setStats(buildStats(data));
        return;
      }

      const [repairsRes, statsRes] = await Promise.all([
        api.getRepairs(),
        api.getRepairStats(),
      ]);
      setRepairs(repairsRes.data || []);
      setStats(statsRes.data);
    } catch (err) {
      setError(err.message || 'No se pudo cargar el taller');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createRepair = useCallback(async (payload) => {
    if (IS_DEMO) {
      const current = readDemoRepairs();
      const number = Math.max(0, ...current.map((item) => item.number)) + 1;
      const labor = Number(payload.labor) || 0;
      const parts = Number(payload.parts) || 0;
      const created = {
        id: Date.now(),
        number,
        status: 'recepcionada',
        priority: payload.priority || 'media',
        type: payload.type || 'service',
        customerName: payload.customerName,
        customerPhone: payload.customerPhone || '',
        bike: payload.bike,
        color: payload.color || '',
        issue: payload.issue,
        technician: payload.technician || '',
        receivedAt: payload.receivedAt || isoDate(),
        promisedAt: payload.promisedAt || addDays(isoDate(), 3),
        deliveredAt: null,
        labor,
        parts,
        total: labor + parts,
        notes: payload.notes || null,
        items: payload.items || [],
      };
      const next = [created, ...current];
      writeDemoRepairs(next);
      setRepairs(next);
      setStats(buildStats(next));
      return created;
    }

    const result = await api.createRepair(payload);
    await load();
    return result.data;
  }, [load]);

  const updateStatus = useCallback(async (id, status) => {
    if (IS_DEMO) {
      const next = readDemoRepairs().map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          status,
          deliveredAt: status === 'entregada' ? isoDate() : item.deliveredAt,
        };
      });
      writeDemoRepairs(next);
      setRepairs(next);
      setStats(buildStats(next));
      return;
    }

    await api.updateRepairStatus(id, status);
    await load();
  }, [load]);

  return {
    repairs,
    stats,
    loading,
    error,
    reload: load,
    createRepair,
    updateStatus,
  };
}
