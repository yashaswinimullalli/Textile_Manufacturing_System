'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { History, ArrowLeft, RefreshCw, Filter, ArrowUpRight, ArrowDownLeft, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { StockMovement } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');

  const loadMovements = async () => {
    setLoading(true);
    try {
      const data = await api.getStockMovements();
      setMovements(data);
    } catch (err) {
      console.error('Failed to load stock movements', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovements();
  }, []);

  const filtered = movements.filter((m) => {
    if (typeFilter === 'ALL') return true;
    return m.movement_type === typeFilter;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/storekeeper/inventory"
            className="p-2 border border-slate-300 rounded-lg hover:bg-white text-slate-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">Stock Movements Ledger</h1>
              <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                Audit Trail
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Immutable ledger of all yarn receipts, line consumptions, and inventory adjustments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadMovements}
            className="p-2 border border-slate-300 rounded-lg hover:bg-white text-slate-600 transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/storekeeper/receive-yarn"
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            + New Receipt
          </Link>
        </div>
      </div>

      {/* Audit Guarantee Card */}
      <div className="bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/20 text-teal-400 rounded-lg">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-teal-400">Ledger Integrity</p>
            <p className="text-xs text-slate-300 mt-0.5">
              Stock levels are updated only via append-only ledger entries. Quantities cannot be modified without an explicit movement record.
            </p>
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Filter by Movement:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">All Movements ({movements.length})</option>
            <option value="RECEIPT">RECEIPT (Incoming Batch)</option>
            <option value="CONSUMPTION">CONSUMPTION (Weaving Issue)</option>
            <option value="ADJUSTMENT">ADJUSTMENT (Audit Correction)</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {filtered.length} entries
        </span>
      </div>

      {/* Movements Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Batch Lot Code</th>
                <th className="py-3 px-4">Movement Type</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4">Reference / Audit Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                    Loading ledger entries...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-sans">
                    <History className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700">No stock movements found</p>
                    <p className="text-xs text-slate-500 mt-1">Receipts and line consumptions will appear here.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((mov) => {
                  const isReceipt = mov.movement_type === 'RECEIPT';
                  return (
                    <tr key={mov.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500 font-sans">
                        {new Date(mov.created_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {mov.batch_code || mov.batch_id}
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <StatusBadge status={mov.movement_type} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold">
                        <span
                          className={`inline-flex items-center gap-1 ${
                            isReceipt ? 'text-emerald-700' : 'text-blue-700'
                          }`}
                        >
                          {isReceipt ? (
                            <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5 text-blue-600" />
                          )}
                          {isReceipt ? '+' : '-'}
                          {mov.quantity.toLocaleString()} kg
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-sans text-xs">
                        {mov.reference}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
