import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { IS_DEMO } from '../config/demo';
import { getDemoInvoices, nextDemoCae } from '../config/demoInvoices';
import { addDays, computeInvoiceTotals, isoDate } from '../utils/format';

const STORAGE_KEY = 'fobibike-demo-invoices-v3';

function readDemoInvoices() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return getDemoInvoices();
}

function writeDemoInvoices(invoices) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
}

function buildStats(invoices) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const active = invoices.filter((invoice) => invoice.status !== 'anulada');
  const thisMonth = active.filter((invoice) => String(invoice.date).startsWith(monthKey));
  const collected = thisMonth.filter((invoice) => invoice.status === 'pagada');
  const pending = invoices.filter((invoice) => invoice.status === 'emitida');
  const overdue = invoices.filter((invoice) => invoice.status === 'vencida');

  const monthlyMap = new Map();
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap.set(key, { month: key, total: 0, count: 0 });
  }
  for (const invoice of active) {
    const key = String(invoice.date).slice(0, 7);
    if (monthlyMap.has(key)) {
      const row = monthlyMap.get(key);
      row.total += Number(invoice.total) || 0;
      row.count += 1;
    }
  }

  const byTypeMap = new Map();
  for (const invoice of thisMonth) {
    const row = byTypeMap.get(invoice.type) || { type: invoice.type, total: 0, count: 0 };
    row.total += Number(invoice.total) || 0;
    row.count += 1;
    byTypeMap.set(invoice.type, row);
  }

  const sum = (list) => list.reduce((acc, invoice) => acc + Number(invoice.total || 0), 0);

  return {
    month: { total: sum(thisMonth), count: thisMonth.length },
    collected: { total: sum(collected), count: collected.length },
    pending: { total: sum(pending), count: pending.length },
    overdue: { total: sum(overdue), count: overdue.length },
    monthly: [...monthlyMap.values()],
    byType: [...byTypeMap.values()],
  };
}

export function useInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (IS_DEMO) {
        const data = readDemoInvoices();
        setInvoices(data);
        setStats(buildStats(data));
        return;
      }

      const [invoicesRes, statsRes] = await Promise.all([
        api.getInvoices(),
        api.getInvoiceStats(),
      ]);
      setInvoices(invoicesRes.data || []);
      setStats(statsRes.data);
    } catch (err) {
      setError(err.message || 'No se pudo cargar la facturación');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createInvoice = useCallback(async (payload) => {
    if (IS_DEMO) {
      const current = readDemoInvoices();
      const sameType = current.filter((invoice) => invoice.type === payload.type);
      const number = Math.max(0, ...sameType.map((invoice) => invoice.number)) + 1;
      const totals = computeInvoiceTotals(payload.items, payload.type);
      const created = {
        id: Date.now(),
        number,
        pos: 1,
        type: payload.type,
        status: 'emitida',
        customerName: payload.customerName,
        customerDoc: payload.customerDoc,
        customerCondition: payload.customerCondition,
        date: payload.date || isoDate(),
        dueDate: payload.dueDate || addDays(payload.date || isoDate(), 7),
        paymentMethod: payload.paymentMethod,
        notes: payload.notes,
        cae: nextDemoCae(),
        caeDue: addDays(payload.date || isoDate(), 10),
        saleId: payload.saleId || null,
        items: payload.items.map((item, index) => ({
          id: Date.now() + index,
          ...item,
          taxPct: payload.type === 'C' ? 0 : 21,
          subtotal: item.quantity * item.unitPrice,
        })),
        ...totals,
      };
      const next = [created, ...current];
      writeDemoInvoices(next);
      setInvoices(next);
      setStats(buildStats(next));
      return created;
    }

    const result = await api.createInvoice(payload);
    await load();
    return result.data;
  }, [load]);

  const updateStatus = useCallback(async (id, status) => {
    if (IS_DEMO) {
      const next = readDemoInvoices().map((invoice) =>
        invoice.id === id ? { ...invoice, status } : invoice
      );
      writeDemoInvoices(next);
      setInvoices(next);
      setStats(buildStats(next));
      return;
    }

    await api.updateInvoiceStatus(id, status);
    await load();
  }, [load]);

  const derived = useMemo(() => ({ invoices, stats }), [invoices, stats]);

  return {
    ...derived,
    loading,
    error,
    reload: load,
    createInvoice,
    updateStatus,
  };
}
