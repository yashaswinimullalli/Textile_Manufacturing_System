'use client';

import React from 'react';
import { 
  CheckCircle2, 
  FileCheck, 
  Truck, 
  Calendar, 
  Building2, 
  Printer, 
  ShieldCheck,
  Search
} from 'lucide-react';

const historyLogs = [
  { passId: 'GP-OCT-091', date: '2026-10-10 11:30', buyer: 'Arvind Lifestyle', destination: 'Bangalore Hub', vehicle: 'KA-04-E-8821', rollsCount: 16, meters: 3200, status: 'Released' },
  { passId: 'GP-OCT-090', date: '2026-10-10 09:15', buyer: 'Bombay Dyeing', destination: 'Pune Depot', vehicle: 'MH-14-B-2299', rollsCount: 16, meters: 3200, status: 'Released' },
  { passId: 'GP-OCT-089', date: '2026-10-09 16:45', buyer: 'Fabindia Retail', destination: 'Delhi Warehouse', vehicle: 'DL-01-T-7733', rollsCount: 14, meters: 2800, status: 'Released' },
  { passId: 'GP-OCT-088', date: '2026-10-09 14:00', buyer: 'Raymond Luxury', destination: 'Mumbai Terminal', vehicle: 'MH-04-A-1104', rollsCount: 12, meters: 2400, status: 'Released' },
  { passId: 'GP-OCT-087', date: '2026-10-08 17:30', buyer: 'Welspun Global', destination: 'Surat Depot', vehicle: 'GJ-05-C-9912', rollsCount: 18, meters: 3600, status: 'Released' },
  { passId: 'GP-OCT-086', date: '2026-10-08 11:15', buyer: 'Arvind Lifestyle', destination: 'Ahmedabad Port', vehicle: 'GJ-01-M-3321', rollsCount: 20, meters: 4000, status: 'Released' },
  { passId: 'GP-OCT-085', date: '2026-10-07 15:00', buyer: 'Bombay Dyeing', destination: 'Pune Depot', vehicle: 'MH-12-Q-4491', rollsCount: 18, meters: 3600, status: 'Released' },
];

export default function DispatchHistoryPage() {
  return (
    <div className="space-y-6 font-sans">
      
      {/* ─── 4 Concise 2-3 Word Summary Cards ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-slate-400">Total Rolls</div>
          <div className="text-3xl font-black text-slate-900 mt-1">114 Dispatched</div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">October Records</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-emerald-600">Gate Passes</div>
          <div className="text-3xl font-black text-emerald-600 mt-1">7 Issued</div>
          <div className="text-[11px] font-bold text-emerald-700 mt-1">Official Releases</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-purple-600">Total Metres</div>
          <div className="text-3xl font-black text-purple-600 mt-1">22,800m</div>
          <div className="text-[11px] font-bold text-purple-700 mt-1">Shipped Safely</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-blue-600">Release Accuracy</div>
          <div className="text-3xl font-black text-blue-600 mt-1">100% Verified</div>
          <div className="text-[11px] font-bold text-emerald-600 mt-1">Zero Escapes</div>
        </div>

      </div>

      {/* ─── Historical Dispatch Table ───────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Verified Consignment Archive</h2>
            <div className="text-xs font-bold text-slate-400 mt-0.5">Historical Gate Passes Released Through Dock Scanner</div>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
            7 Shipments Verified
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-5">Gate Pass</th>
                <th className="py-3 px-5">Release Date</th>
                <th className="py-3 px-5">Buyer Account</th>
                <th className="py-3 px-5">Vehicle No</th>
                <th className="py-3 px-5">Rolls Shipped</th>
                <th className="py-3 px-5">Total Length</th>
                <th className="py-3 px-5 text-right">Gate Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {historyLogs.map((log) => (
                <tr key={log.passId} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-5 font-mono font-black text-slate-900">{log.passId}</td>
                  <td className="py-3.5 px-5 text-slate-500">{log.date}</td>
                  <td className="py-3.5 px-5">
                    <span className="font-bold text-slate-900 block">{log.buyer}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{log.destination}</span>
                  </td>
                  <td className="py-3.5 px-5 font-mono text-slate-700">{log.vehicle}</td>
                  <td className="py-3.5 px-5 font-mono font-bold text-slate-800">{log.rollsCount} rolls</td>
                  <td className="py-3.5 px-5 font-mono text-slate-600">{log.meters.toLocaleString()}m</td>
                  <td className="py-3.5 px-5 text-right">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-1 justify-end inline-flex">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{log.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
