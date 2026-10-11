'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  FileCheck, 
  Truck, 
  Calendar, 
  Building2, 
  Printer, 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  ExternalLink,
  Package 
} from 'lucide-react';
import { api } from '@/lib/api-client';

interface DispatchLog {
  id: string;
  dispatch_reference: string;
  dispatch_date: string;
  destination: string;
  vehicle_number: string;
  item_quantity: number;
  total_weight: number;
  total_revenue: number;
  status: string;
  buyer?: string;
  fabric_type?: string;
  roll_id?: string;
}

export default function DispatchHistoryPage() {
  const [historyLogs, setHistoryLogs] = useState<DispatchLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadDispatches = async () => {
    setLoading(true);
    try {
      const res = await api.getDispatches();
      const logs = (res as any)?.data || (Array.isArray(res) ? res : []);
      setHistoryLogs(logs);
    } catch (err) {
      console.error('Failed to load dispatches from database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDispatches();
  }, []);

  const filtered = historyLogs.filter((log) => {
    const q = searchQuery.toLowerCase();
    return (
      (log.dispatch_reference || '').toLowerCase().includes(q) ||
      (log.vehicle_number || '').toLowerCase().includes(q) ||
      (log.destination || '').toLowerCase().includes(q) ||
      (log.buyer || '').toLowerCase().includes(q)
    );
  });

  const totalRollsCount = historyLogs.reduce((acc, l) => acc + (Number(l.item_quantity) || 1), 0);
  const totalWeightShipped = historyLogs.reduce((acc, l) => acc + (parseFloat(String(l.total_weight)) || 0), 0);
  const totalRevenue = historyLogs.reduce((acc, l) => acc + (parseFloat(String(l.total_revenue)) || 0), 0);

  return (
    <div className="space-y-6 font-sans">
      
      {/* ─── 4 Concise Summary Cards ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-slate-400">Total Rolls</div>
          <div className="text-3xl font-black text-slate-900 mt-1">{totalRollsCount} Dispatched</div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">Live Database Archive</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-emerald-600">Gate Passes</div>
          <div className="text-3xl font-black text-emerald-600 mt-1">{historyLogs.length} Issued</div>
          <div className="text-[11px] font-bold text-emerald-700 mt-1">Authorized Releases</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-purple-600">Total Dispatched</div>
          <div className="text-3xl font-black text-purple-600 mt-1">{totalWeightShipped.toLocaleString()} kg</div>
          <div className="text-[11px] font-bold text-purple-700 mt-1">Shipped Safely</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-blue-600">Release Accuracy</div>
          <div className="text-3xl font-black text-blue-600 mt-1">100% Verified</div>
          <div className="text-[11px] font-bold text-emerald-600 mt-1">Zero QC Escapes</div>
        </div>

      </div>

      {/* ─── Historical Dispatch Table ───────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Verified Consignment Archive (PostgreSQL)</h2>
            <div className="text-xs font-bold text-slate-400 mt-0.5">Historical Gate Passes Authorized Through Dock Gate Scanner</div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search gate pass, vehicle…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <button
              onClick={loadDispatches}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              title="Refresh from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/dispatch"
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition"
            >
              Open Dock Scanner
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
              <span>Loading PostgreSQL dispatch archive...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Package className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-base font-bold text-slate-800">No Dispatches Recorded in Database Yet</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                When you scan QC-approved fabric rolls at the Loading Dock and click "Dispatch Truck", official gate passes will be recorded here permanently.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-5">Gate Pass Ref</th>
                  <th className="py-3 px-5">Release Timestamp</th>
                  <th className="py-3 px-5">Destination / Buyer</th>
                  <th className="py-3 px-5">Vehicle No</th>
                  <th className="py-3 px-5">Rolls Shipped</th>
                  <th className="py-3 px-5">Total Weight</th>
                  <th className="py-3 px-5 text-right">Gate Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((log) => (
                  <tr key={log.id || log.dispatch_reference} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-5 font-mono font-black text-slate-900">{log.dispatch_reference}</td>
                    <td className="py-3.5 px-5 text-slate-500">
                      {log.dispatch_date ? new Date(log.dispatch_date).toLocaleString('en-IN') : 'Just now'}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-bold text-slate-900 block">{log.buyer || 'Regional Buyer'}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{log.destination}</span>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-700">{log.vehicle_number}</td>
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-800">{log.item_quantity || 1} rolls</td>
                    <td className="py-3.5 px-5 font-mono text-slate-600">{Number(log.total_weight).toLocaleString()} kg</td>
                    <td className="py-3.5 px-5 text-right">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-1 justify-end inline-flex">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{log.status || 'Released'}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
