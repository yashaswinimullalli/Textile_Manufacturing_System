'use client';

import React from 'react';
import { OwnerOrderProgress } from '@/types/factory';
import { Package, Clock, CheckCircle2, AlertTriangle, XCircle, ArrowUpRight } from 'lucide-react';

interface OrderProgressTableProps {
  orders: OwnerOrderProgress[];
}

export default function OrderProgressTable({ orders }: OrderProgressTableProps) {
  if (!orders || orders.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-900">No Orders Found</h3>
        <p className="text-xs text-slate-500 mt-1">No production batches match your current filter.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <h2 className="text-lg font-black text-slate-900">
            Customer Orders & Production Progress
          </h2>
          <p className="text-xs text-slate-500">
            Compare ordered volume against passed fabric, fabric in repair, and scrapped cloth
          </p>
        </div>
        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full self-start">
          All quantities in meters (m)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">Customer & Order Ref</th>
              <th className="py-3.5 px-4">Target Order</th>
              <th className="py-3.5 px-4">Total Woven</th>
              <th className="py-3.5 px-4">Passed (Ready to Ship)</th>
              <th className="py-3.5 px-4">Being Repaired</th>
              <th className="py-3.5 px-4">Scrapped</th>
              <th className="py-3.5 px-4">Still Needed</th>
              <th className="py-3.5 px-4">Progress</th>
              <th className="py-3.5 px-4">Delivery Deadline</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((o) => {
              const pct = Math.min(100, Math.max(0, Number(o.completion_percentage)));
              const isDelayed = o.status === 'DELAYED';

              return (
                <tr key={o.order_id} className="hover:bg-slate-50/80 transition">
                  <td className="py-4 px-4">
                    <div className="font-black text-sm text-slate-900">{o.customer_reference}</div>
                    <div className="font-mono text-xs font-bold text-slate-500">{o.order_code}</div>
                  </td>

                  <td className="py-4 px-4 font-black text-slate-800 text-sm">
                    {o.target_quantity.toLocaleString()} {o.unit}
                  </td>

                  <td className="py-4 px-4 font-bold text-slate-700">
                    {o.produced_quantity.toLocaleString()} {o.unit}
                  </td>

                  <td className="py-4 px-4 font-black text-emerald-700 bg-emerald-50/50">
                    {o.passed_quantity.toLocaleString()} {o.unit}
                  </td>

                  <td className="py-4 px-4 font-bold text-amber-700">
                    {o.rework_quantity > 0 ? `${o.rework_quantity} ${o.unit}` : '0 m'}
                  </td>

                  <td className="py-4 px-4 font-bold text-rose-700">
                    {o.rejected_quantity > 0 ? `${o.rejected_quantity} ${o.unit}` : '0 m'}
                  </td>

                  <td className="py-4 px-4 font-black text-slate-900 text-sm">
                    {o.remaining_target.toLocaleString()} {o.unit}
                  </td>

                  {/* Visual Progress Bar */}
                  <td className="py-4 px-4 min-w-[150px]">
                    <div className="flex items-center justify-between text-xs font-black text-slate-800 mb-1">
                      <span>{pct.toFixed(0)}% ready</span>
                      <span className="text-[10px] text-slate-500 font-normal">{o.passed_quantity}/{o.target_quantity}m</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct >= 90 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{o.due_date}</span>
                      <span className={`inline-block text-[10px] font-black uppercase mt-0.5 px-2 py-0.5 rounded-md w-fit ${
                        isDelayed ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isDelayed ? 'Deadline at Risk' : 'On Schedule'}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
