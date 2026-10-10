'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { QualityTrendsResponse } from '@/types/factory';
import { getFriendlyFlawName } from '@/lib/formatters';
import LoadingState from '@/components/shared/LoadingState';
import ErrorState from '@/components/shared/ErrorState';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TrendingUp,
  CheckCircle2,
  RefreshCw,
  XCircle,
  Info,
  BarChart3
} from 'lucide-react';

const DECISION_COLORS: Record<string, string> = {
  PASS: '#10b981',
  REWORK: '#f59e0b',
  REJECT: '#ef4444',
};

const PIE_COLORS = ['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

function CustomBarTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-900 rounded-xl px-3 py-2 text-xs shadow-xl border border-slate-700">
        <div className="font-bold text-slate-200 mb-1">{label}</div>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full" style={{ background: p.fill || p.color }} />
            <span className="text-slate-300">{p.name}: <strong className="text-white">{p.value}</strong></span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function QualityTrendsPage() {
  const [data, setData] = useState<QualityTrendsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getQualityTrends();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Could not load quality trends.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingState message="Loading quality trend data..." />;
  if (error) return <ErrorState title="Could Not Load Quality Trends" message={error} onRetry={loadData} />;
  if (!data) return null;

  const { summary, defect_categories, recent_trend_data } = data;

  // Prepare data for charts
  const defectBarData = defect_categories
    .filter(d => d.incident_count > 0)
    .map(d => ({
      name: getFriendlyFlawName(d.defect_type).replace('Fabric ', '').replace(' in Fabric', ''),
      incidents: d.incident_count,
      meters: d.affected_quantity,
    }));

  // Decision distribution for pie chart
  const decisionCounts = { PASS: 0, REWORK: 0, REJECT: 0 };
  recent_trend_data.forEach(r => {
    if (r.decision in decisionCounts) decisionCounts[r.decision as keyof typeof decisionCounts]++;
  });
  const pieData = Object.entries(decisionCounts)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: k, value: v, fill: DECISION_COLORS[k] }));

  // Trend data grouped by day
  const trendByDay: Record<string, { date: string; PASS: number; REWORK: number; REJECT: number }> = {};
  recent_trend_data.forEach(r => {
    const day = new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!trendByDay[day]) trendByDay[day] = { date: day, PASS: 0, REWORK: 0, REJECT: 0 };
    trendByDay[day][r.decision as 'PASS' | 'REWORK' | 'REJECT']++;
  });
  const trendChartData = Object.values(trendByDay).slice(-10);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-black text-slate-900">Quality Trends</h1>
          </div>
          <p className="text-sm text-slate-500">
            Pass/fail rates, defect categories, and quality performance over time.
          </p>
        </div>
        <button onClick={loadData} className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Caveat Note */}
      {data.caveat_note && (
        <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span className="font-medium">{data.caveat_note}</span>
        </div>
      )}

      {/* Rate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border-2 border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700">Pass Rate</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-4xl font-black text-emerald-600">{summary.pass_rate}</div>
          <div className="text-xs text-slate-600 font-bold mt-1">Rolls meeting quality standards</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Target: ≥85%</div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: summary.pass_rate }} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border-2 border-amber-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-700">Rework Rate</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-4xl font-black text-amber-600">{summary.rework_rate}</div>
          <div className="text-xs text-slate-600 font-bold mt-1">Rolls requiring washing or repair</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Can usually be recovered</div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: summary.rework_rate }} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border-2 border-rose-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-700">Scrap Rate</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-4xl font-black text-rose-600">{summary.reject_rate}</div>
          <div className="text-xs text-slate-600 font-bold mt-1">Permanently scrapped fabric</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Direct financial loss</div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full" style={{ width: summary.reject_rate }} />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="text-center">
          <div className="font-black text-2xl text-slate-900">{summary.total_inspection_events}</div>
          <div className="text-slate-500 font-medium mt-0.5">Total inspection events</div>
        </div>
        <div className="text-center">
          <div className="font-black text-2xl text-slate-900">{summary.unique_rolls_tested}</div>
          <div className="text-slate-500 font-medium mt-0.5">Unique rolls tested</div>
        </div>
        <div className="text-center">
          <div className="font-black text-2xl text-slate-900">{summary.total_affected_quantity}</div>
          <div className="text-slate-500 font-medium mt-0.5">Meters affected ({summary.unit})</div>
        </div>
        <div className="text-center">
          <div className="font-black text-2xl text-slate-900">{defect_categories.length}</div>
          <div className="text-slate-500 font-medium mt-0.5">Defect categories detected</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Defect Categories Bar Chart */}
        {defectBarData.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-black text-slate-900">Defect Incidents by Category</h2>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={defectBarData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="incidents" name="Incidents" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Decision Distribution Pie Chart */}
        {pieData.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-black text-slate-900 mb-4">Decision Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#94a3b8' }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomBarTooltip />} />
                <Legend
                  formatter={(value) => <span className="text-xs font-bold text-slate-700">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Trend Over Time Chart */}
      {trendChartData.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-black text-slate-900 mb-4">Inspection Decisions Over Time</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trendChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip content={<CustomBarTooltip />} />
              <Legend formatter={(value) => <span className="text-xs font-bold text-slate-700">{value}</span>} />
              <Bar dataKey="PASS" name="Pass" fill="#10b981" radius={[3, 3, 0, 0]} stackId="a" />
              <Bar dataKey="REWORK" name="Rework" fill="#f59e0b" radius={[0, 0, 0, 0]} stackId="a" />
              <Bar dataKey="REJECT" name="Reject" fill="#ef4444" radius={[3, 3, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Defect Detail Table */}
      {defect_categories.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-900">Defect Category Breakdown</h2>
            <p className="text-xs text-slate-500 mt-0.5">Sorted by frequency of occurrence</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 text-left">Defect Type</th>
                  <th className="py-3 px-4 text-right">Incidents</th>
                  <th className="py-3 px-4 text-right">Affected ({summary.unit})</th>
                  <th className="py-3 px-4">Frequency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {defect_categories.map((cat) => {
                  const maxCount = Math.max(...defect_categories.map(d => d.incident_count), 1);
                  const pct = (cat.incident_count / maxCount) * 100;
                  return (
                    <tr key={cat.defect_type} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{getFriendlyFlawName(cat.defect_type)}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">{cat.incident_count}</td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600">{cat.affected_quantity}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium w-8 text-right">{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
