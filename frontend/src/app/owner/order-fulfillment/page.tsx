'use client';

import React from 'react';
import { 
  Package, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Truck, 
  Building2,
  Calendar,
  ChevronRight
} from 'lucide-react';

const ordersData = [
  { id: 'ORD-101', buyer: 'Arvind Lifestyle', fabric: 'Cotton Twill 240 GSM', requiredMeters: 3000, completedMeters: 2400, deadline: '2026-10-14', status: 'On Track', rollsAssigned: 12, shortMeters: 0 },
  { id: 'ORD-102', buyer: 'Raymond Luxury', fabric: 'Raw Indigo Denim', requiredMeters: 1400, completedMeters: 1220, deadline: '2026-10-11', status: 'At Risk', rollsAssigned: 7, shortMeters: 180 },
  { id: 'ORD-103', buyer: 'Fabindia Retail', fabric: 'Pure Organic Linen', requiredMeters: 2000, completedMeters: 1800, deadline: '2026-10-16', status: 'On Track', rollsAssigned: 10, shortMeters: 0 },
  { id: 'ORD-104', buyer: 'Bombay Dyeing', fabric: '100% Combed Cotton', requiredMeters: 3200, completedMeters: 3200, deadline: '2026-10-12', status: 'Ready to Ship', rollsAssigned: 16, shortMeters: 0 },
  { id: 'ORD-105', buyer: 'Welspun Global', fabric: 'Heavy Canvas 300 GSM', requiredMeters: 1600, completedMeters: 1400, deadline: '2026-10-18', status: 'On Track', rollsAssigned: 8, shortMeters: 0 },
  { id: 'ORD-106', buyer: 'Raymond Luxury', fabric: 'Mulberry Silk Chiffon', requiredMeters: 800, completedMeters: 600, deadline: '2026-10-13', status: 'At Risk', rollsAssigned: 4, shortMeters: 200 },
];

export default function OrderFulfillmentPage() {
  return (
    <div className="space-y-6 font-sans">
      
      {/* ─── 4 Concise 2-3 Word Summary Cards ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-slate-400">Total Orders</div>
          <div className="text-3xl font-black text-slate-900 mt-1">6 Active</div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">October Contracts</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-emerald-600">On Schedule</div>
          <div className="text-3xl font-black text-emerald-600 mt-1">4 Orders</div>
          <div className="text-[11px] font-bold text-emerald-700 mt-1">Buffer Safe</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-rose-600">Delivery Risk</div>
          <div className="text-3xl font-black text-rose-600 mt-1">2 Orders</div>
          <div className="text-[11px] font-bold text-rose-700 mt-1">380m Short</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-blue-600">Total Yardage</div>
          <div className="text-3xl font-black text-blue-600 mt-1">12,000m</div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">88.5% Weaved</div>
        </div>

      </div>

      {/* ─── Customer Order Fulfillment Table ───────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Buyer Order Status</h2>
            <div className="text-xs font-bold text-slate-400 mt-0.5">Manufacturing Completion vs Dispatch Deadlines</div>
          </div>
          <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-200">
            6 Buyer Accounts
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {ordersData.map((order) => {
            const pct = Math.round((order.completedMeters / order.requiredMeters) * 100);
            const isAtRisk = order.status === 'At Risk';
            const isReady = order.status === 'Ready to Ship';

            return (
              <div key={order.id} className="p-6 hover:bg-slate-50 transition space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-base text-slate-900">{order.id}</span>
                    <span className="text-sm font-bold text-purple-700">{order.buyer}</span>
                    <span className="text-xs font-semibold text-slate-500">• {order.fabric}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-medium">
                      Deadline: <strong className="text-slate-800">{order.deadline}</strong>
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      isAtRisk ? 'bg-rose-100 text-rose-800' : (isReady ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800')
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Progress Bar & Metric Numbers */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600">
                      Completed: {order.completedMeters.toLocaleString()}m / {order.requiredMeters.toLocaleString()}m ({order.rollsAssigned} rolls assigned)
                    </span>
                    <span className="font-mono font-black text-slate-900">{pct}%</span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        isAtRisk ? 'bg-rose-500' : (isReady ? 'bg-emerald-500' : 'bg-blue-500')
                      }`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>

                {isAtRisk && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800 font-bold">
                    <span>Deficit Alert: Short {order.shortMeters}m due to floor inspection reject.</span>
                    <span className="uppercase text-[10px] underline cursor-pointer">Order Weaving Top-Up</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
