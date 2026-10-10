'use client';

import React from 'react';
import { BarChart2, CheckCircle2 } from 'lucide-react';

const defects = [
  { name: 'Hole / Tear', count: 10, pct: 42, color: 'bg-red-400' },
  { name: 'Uneven Weave', count: 8, pct: 33, color: 'bg-amber-400' },
  { name: 'Oil / Grease Stain', count: 4, pct: 17, color: 'bg-slate-400' },
  { name: 'Color Variation', count: 2, pct: 8, color: 'bg-teal-400' },
];

export default function DefectAnalysisPage() {
  return (
    <div className="max-w-4xl space-y-6 font-sans">
      <div className="mb-6">
        <h2 className="text-xl font-serif tracking-tight text-slate-800">Defect Analysis</h2>
        <p className="text-sm text-slate-500 mt-1">Overview of common flaws found during inspection.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-center">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Flaws</p>
          <p className="text-3xl font-serif tracking-tight text-slate-800">24</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-center">
          <p className="text-sm font-medium text-slate-500 mb-1">Top Issue</p>
          <p className="text-lg font-serif text-red-600 mt-2">Holes / Tears</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-center">
          <p className="text-sm font-medium text-slate-500 mb-1">Affected Yardage</p>
          <p className="text-3xl font-serif tracking-tight text-amber-600">360m</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-center">
          <p className="text-sm font-medium text-slate-500 mb-1">Overall Rate</p>
          <p className="text-3xl font-serif tracking-tight text-teal-600">2.4%</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-medium text-slate-800 mb-4">Flaw Breakdown</h3>
        <div className="space-y-5">
          {defects.map((d) => (
            <div key={d.name}>
              <div className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                <span>{d.name}</span>
                <span className="text-slate-500">{d.count} rolls ({d.pct}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className={`h-2 rounded-full ${d.color}`} style={{ width: `${d.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
