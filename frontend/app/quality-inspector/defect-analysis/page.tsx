'use client';

import React from 'react';
import { 
  AlertTriangle, 
  BarChart2, 
  Layers, 
  Activity, 
  TrendingDown, 
  CheckCircle2, 
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { useFabricTrace } from '@/context/FabricTraceContext';

const defectDistribution = [
  { name: 'Hole / Tear', count: 10, pct: 42, color: 'bg-rose-500', meters: 150 },
  { name: 'Uneven Weave', count: 8, pct: 33, color: 'bg-amber-500', meters: 120 },
  { name: 'Oil / Grease Stain', count: 4, pct: 17, color: 'bg-indigo-500', meters: 60 },
  { name: 'Color Variation', count: 2, pct: 8, color: 'bg-teal-500', meters: 30 },
];

const loomPerformance = [
  { loomId: 'LOOM-01', operator: 'Ramesh P', shift: 'Morning A', rollsChecked: 14, flawsFound: 2, status: 'Optimal' },
  { loomId: 'LOOM-02', operator: 'Suresh K', shift: 'Morning A', rollsChecked: 12, flawsFound: 1, status: 'Optimal' },
  { loomId: 'LOOM-03', operator: 'Mahesh B', shift: 'Evening B', rollsChecked: 10, flawsFound: 7, status: 'Attention Needed' },
  { loomId: 'LOOM-04', operator: 'Deepak V', shift: 'Morning A', rollsChecked: 16, flawsFound: 3, status: 'Optimal' },
  { loomId: 'LOOM-05', operator: 'Prakash M', shift: 'Night C', rollsChecked: 8, flawsFound: 5, status: 'Check Calibration' },
];

const fabricFlawRates = [
  { type: 'Raw Indigo Denim', inspected: '2,400m', scrapped: '180m', defectRate: '7.5%', risk: 'High' },
  { type: 'Cotton Twill 240 GSM', inspected: '4,200m', scrapped: '90m', defectRate: '2.1%', risk: 'Low' },
  { type: 'Mulberry Silk Chiffon', inspected: '800m', scrapped: '45m', defectRate: '5.6%', risk: 'Medium' },
  { type: '100% Combed Cotton', inspected: '3,100m', scrapped: '60m', defectRate: '1.9%', risk: 'Low' },
  { type: 'Pure Organic Linen', inspected: '1,500m', scrapped: '75m', defectRate: '5.0%', risk: 'Medium' },
];

export default function DefectAnalysisPage() {
  const { fabricRolls } = useFabricTrace();

  return (
    <div className="space-y-6 font-sans">
      
      {/* ─── 4 Concise 2-3 Word Summary Cards ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-slate-400">Total Flaws</div>
          <div className="text-3xl font-black text-slate-900 mt-1">24 Found</div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">October Logged</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-rose-600">Top Flaw</div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">Hole / Tear</div>
          <div className="text-[11px] font-bold text-rose-700 mt-1">42% Frequency</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-amber-600">Affected Yardage</div>
          <div className="text-3xl font-black text-amber-600 mt-1">360 Metres</div>
          <div className="text-[11px] font-bold text-amber-700 mt-1">Quarantine Hold</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-blue-600">Overall Rate</div>
          <div className="text-3xl font-black text-blue-600 mt-1">2.4% Defect</div>
          <div className="text-[11px] font-bold text-emerald-600 mt-1">Under Benchmark</div>
        </div>

      </div>

      {/* ─── Detailed Analysis Grids ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Defect Category Breakdown */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Defect Type Breakdown</h2>
              <div className="text-xs font-bold text-slate-400 mt-0.5">By Frequency Percentage</div>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
              4 Categories
            </span>
          </div>

          <div className="space-y-4">
            {defectDistribution.map((item) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-800">{item.name}</span>
                  <span className="text-slate-500 font-mono">{item.count} flaws • {item.meters}m ({item.pct}%)</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${item.pct}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600">Weaving Tension Flaws:</span>
            <span className="font-bold text-slate-900">Highest In Evening Shift</span>
          </div>
        </div>

        {/* Right: Fabric Type Vulnerability */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Fabric Vulnerability</h2>
              <div className="text-xs font-bold text-slate-400 mt-0.5">Scrap Loss By Quality Grade</div>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
              5 Varieties
            </span>
          </div>

          <div className="space-y-3">
            {fabricFlawRates.map((f) => (
              <div key={f.type} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-900">{f.type}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">{f.inspected} Inspected • {f.scrapped} Scrapped</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-black text-slate-900">{f.defectRate}</div>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                    f.risk === 'High' ? 'bg-rose-100 text-rose-700' : (f.risk === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')
                  }`}>
                    {f.risk} Risk
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ─── Loom Machine Correlation Table ─────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Loom Machine Correlation</h2>
            <div className="text-xs font-bold text-slate-400 mt-0.5">Flaws Grouped By Weaving Terminal</div>
          </div>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
            5 Looms Tracked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-5">Machine ID</th>
                <th className="py-3 px-5">Floor Operator</th>
                <th className="py-3 px-5">Shift</th>
                <th className="py-3 px-5">Rolls Checked</th>
                <th className="py-3 px-5">Flaws Found</th>
                <th className="py-3 px-5 text-right">Machine Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loomPerformance.map((l) => (
                <tr key={l.loomId} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-5 font-mono font-black text-slate-900">{l.loomId}</td>
                  <td className="py-3.5 px-5 text-slate-700">{l.operator}</td>
                  <td className="py-3.5 px-5 text-slate-500">{l.shift}</td>
                  <td className="py-3.5 px-5 font-mono font-bold text-slate-700">{l.rollsChecked}</td>
                  <td className="py-3.5 px-5 font-mono font-bold text-rose-600">{l.flawsFound}</td>
                  <td className="py-3.5 px-5 text-right">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      l.status === 'Optimal' ? 'bg-emerald-100 text-emerald-800' : (l.status === 'Attention Needed' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800')
                    }`}>
                      {l.status}
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
