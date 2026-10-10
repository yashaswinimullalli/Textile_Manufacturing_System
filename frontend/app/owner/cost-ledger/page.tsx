'use client';

import React from 'react';
import { 
  IndianRupee, 
  Minus, 
  TrendingDown, 
  Receipt, 
  AlertOctagon, 
  FileText, 
  Printer,
  ShieldCheck
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

const scrapBreakdown = [
  { fabric: 'Raw Indigo Denim', metersScrapped: 180, unitLoss: 250, totalLoss: 45000, reason: 'Tension Curl' },
  { fabric: 'Mulberry Silk Chiffon', metersScrapped: 90, unitLoss: 688, totalLoss: 62000, reason: 'Oil Contamination' },
  { fabric: 'Pure Organic Linen', metersScrapped: 120, unitLoss: 250, totalLoss: 30000, reason: 'Shade Mismatch' },
  { fabric: 'Cotton Twill 240 GSM', metersScrapped: 90, unitLoss: 200, totalLoss: 18000, reason: 'Hole in Weave' },
];

const expenseVouchers = [
  { id: 'VOU-OCT-101', date: '2026-10-10', category: 'Raw Materials', description: 'Gujarat Cotton Federation Combed Yarn', amount: 52000, status: 'Audited' },
  { id: 'VOU-OCT-102', date: '2026-10-10', category: 'Floor Scrap', description: 'Scrapped Roll #ROLL-1042 Raw Indigo Denim', amount: 48000, status: 'Logged' },
  { id: 'VOU-OCT-103', date: '2026-10-10', category: 'Floor Scrap', description: 'Scrapped Roll #ROLL-1028 Mulberry Silk Chiffon', amount: 62000, status: 'Logged' },
  { id: 'VOU-OCT-104', date: '2026-10-09', category: 'Labor Wages', description: 'Weaving Shift A & B Operator Wages', amount: 21000, status: 'Audited' },
  { id: 'VOU-OCT-105', date: '2026-10-09', category: 'Rework Wash', description: 'Chemical Scouring Bath Finishing Bath', amount: 14500, status: 'Audited' },
  { id: 'VOU-OCT-106', date: '2026-10-08', category: 'Maintenance', description: 'Loom-03 Shuttle Alignment Replacement', amount: 16800, status: 'Audited' },
];

export default function CostLedgerPage() {
  const totalScrap = scrapBreakdown.reduce((sum, item) => sum + item.totalLoss, 0);

  return (
    <div className="space-y-6 font-sans">
      
      {/* ─── 4 Concise 2-3 Word Summary Cards ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm">
          <div className="text-[11px] font-medium uppercase text-rose-600">Total Scrap</div>
          <div className="text-2xl sm:text-3xl font-serif tracking-tight text-rose-600 mt-1">{formatCurrency(totalScrap)}</div>
          <div className="text-[11px] font-medium text-rose-700 mt-1">480m Scrapped</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm">
          <div className="text-[11px] font-medium uppercase text-amber-600">Rework Bills</div>
          <div className="text-2xl sm:text-3xl font-serif tracking-tight text-amber-600 mt-1">₹32,500</div>
          <div className="text-[11px] font-medium text-amber-700 mt-1">Chemical Washes</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium uppercase text-slate-400">Yarn Spend</div>
          <div className="text-2xl sm:text-3xl font-serif tracking-tight text-slate-900 mt-1">₹5,20,000</div>
          <div className="text-[11px] font-medium text-slate-500 mt-1">October Purchases</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm">
          <div className="text-[11px] font-medium uppercase text-emerald-600">Audit Status</div>
          <div className="text-3xl font-serif tracking-tight text-emerald-600 mt-1">Verified Clean</div>
          <div className="text-[11px] font-medium text-emerald-700 mt-1">Reconciled Ledger</div>
        </div>

      </div>

      {/* ─── Scrap Loss Breakdown Table ─────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-serif text-slate-900 tracking-tight">Floor Scrap Breakdown</h2>
            <div className="text-xs font-medium text-slate-400 mt-0.5">Direct Losses Incurred From Rejected Cloth</div>
          </div>
          <span className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-medium rounded-full border border-rose-200">
            {formatCurrency(totalScrap)} Total Loss
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-5">Fabric Type</th>
                <th className="py-3 px-5">Meters Scrapped</th>
                <th className="py-3 px-5">Cost / Metre</th>
                <th className="py-3 px-5">Rejection Root Cause</th>
                <th className="py-3 px-5 text-right">Net Scrap Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {scrapBreakdown.map((s) => (
                <tr key={s.fabric} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-5 font-medium text-slate-900">{s.fabric}</td>
                  <td className="py-3.5 px-5 font-mono text-slate-700">{s.metersScrapped}m</td>
                  <td className="py-3.5 px-5 font-mono text-slate-600">{formatCurrency(s.unitLoss)}</td>
                  <td className="py-3.5 px-5 text-rose-600 font-medium">{s.reason}</td>
                  <td className="py-3.5 px-5 text-right font-mono font-medium text-rose-600">
                    -{formatCurrency(s.totalLoss)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Accounting Expense Vouchers Ledger ─────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-serif text-slate-900 tracking-tight">Financial Expense Vouchers</h2>
            <div className="text-xs font-medium text-slate-400 mt-0.5">Audited Manufacturing & Material Receipts</div>
          </div>
          <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-200">
            October 2026
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {expenseVouchers.map((v) => (
            <div key={v.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-xs text-slate-900">{v.id}</span>
                  <span className="text-[10px] font-medium uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {v.category}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">{v.date}</span>
                </div>
                <div className="text-xs font-medium text-slate-700">{v.description}</div>
              </div>

              <div className="text-right">
                <div className="font-mono font-medium text-sm text-slate-900">
                  {formatCurrency(v.amount)}
                </div>
                <span className="text-[10px] font-medium text-emerald-600">
                  {v.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
