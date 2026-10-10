'use client';

import React from 'react';
import { QualityTrendsResponse } from '@/types/factory';
import { getFriendlyFlawName } from '@/lib/formatters';
import { 
  TrendingUp, 
  CheckCircle2, 
  RefreshCw, 
  XCircle, 
  Info,
  HelpCircle
} from 'lucide-react';

interface QualityTrendChartsProps {
  data: QualityTrendsResponse;
}

export default function QualityTrendCharts({ data }: QualityTrendChartsProps) {
  const { summary, defect_categories, caveat_note } = data;

  const maxDefectCount = Math.max(...defect_categories.map(d => d.incident_count), 1);

  return (
    <div className="space-y-6">
      {/* 3 Large Rate Cards - Simple & Easy to Understand */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Pass Rate */}
        <div className="bg-white p-6 rounded-3xl border-2 border-emerald-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
              Pass Rate (Good Fabric)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-4xl font-black text-emerald-600 tracking-tight">
            {summary.pass_rate}
          </div>
          <p className="mt-1 text-xs font-bold text-slate-700">
            Rolls that met quality standards on first check
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Target: 85% or higher
          </p>
          <div className="w-full bg-slate-100 h-2.5 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: summary.pass_rate }}></div>
          </div>
        </div>

        {/* Rework Rate */}
        <div className="bg-white p-6 rounded-3xl border-2 border-amber-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-800">
              Rework Rate (Needs Repair)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-4xl font-black text-amber-600 tracking-tight">
            {summary.rework_rate}
          </div>
          <p className="mt-1 text-xs font-bold text-slate-700">
            Rolls sent for chemical washing or spot cleaning
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Can usually be saved and shipped later
          </p>
          <div className="w-full bg-slate-100 h-2.5 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: summary.rework_rate }}></div>
          </div>
        </div>

        {/* Reject Rate */}
        <div className="bg-white p-6 rounded-3xl border-2 border-rose-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-rose-800">
              Scrap Rate (Damaged Cloth)
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-4xl font-black text-rose-600 tracking-tight">
            {summary.reject_rate}
          </div>
          <p className="mt-1 text-xs font-bold text-slate-700">
            Permanent fabric scrap that cannot be sold
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Direct financial loss for the mill
          </p>
          <div className="w-full bg-slate-100 h-2.5 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full" style={{ width: summary.reject_rate }}></div>
          </div>
        </div>
      </div>

      {/* Defect Categories Breakdown Bar Chart */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Top Fabric Flaws Detected in the Mill
            </h2>
            <p className="text-xs text-slate-500">
              Which flaws happen most often, and how many meters were damaged?
            </p>
          </div>
          <div className="text-right text-xs">
            <span className="text-slate-500 block font-medium">Total Damaged Cloth:</span>
            <span className="font-black text-rose-600 text-base">{summary.total_affected_quantity} {summary.unit}</span>
          </div>
        </div>

        {defect_categories.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6 font-medium">No defects logged in current dataset.</p>
        ) : (
          <div className="space-y-5">
            {defect_categories.map((cat) => {
              const widthPct = Math.min(100, (cat.incident_count / maxDefectCount) * 100);

              return (
                <div key={cat.defect_type} className="space-y-1.5 p-3 rounded-2xl bg-slate-50/60 border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-900 font-black text-sm">
                      {getFriendlyFlawName(cat.defect_type)}
                    </span>
                    <div className="space-x-3 text-slate-600">
                      <span>Occurred: <strong className="text-slate-900">{cat.incident_count} times</strong></span>
                      <span>Meters Damaged: <strong className="text-rose-600">{cat.affected_quantity} {cat.unit}</strong></span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 h-3.5 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${widthPct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Friendly explanation callout */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold block text-sm mb-0.5">How these rates are calculated:</span>
            <p className="text-slate-700 font-medium">
              We count every inspection event in the mill ({summary.total_inspection_events} checks on {summary.unique_rolls_tested} distinct rolls). If a roll has oil spots and gets washed, both the initial check and the re-check are counted so you can see the real repair effort in the factory.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
