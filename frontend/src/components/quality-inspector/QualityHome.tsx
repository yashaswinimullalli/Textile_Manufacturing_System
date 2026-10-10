'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { QualitySummaryResponse } from '@/types/factory';
import { formatDate, getDecisionBadgeClass, getFriendlyFlawName } from '@/lib/formatters';
import BarcodeScanner from './BarcodeScanner';
import RollLookup from './RollLookup';
import ReinspectionQueue from './ReinspectionQueue';
import LoadingState from '../shared/LoadingState';
import { 
  QrCode, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export default function QualityHome() {
  const router = useRouter();
  const [summary, setSummary] = useState<QualitySummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'scan' | 'lookup' | 'queue'>('scan');

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setIsLoading(true);
      const data = await api.getQualitySummary();
      setSummary(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanRoll = (rollCode: string) => {
    router.push(`/rolls/${encodeURIComponent(rollCode)}`);
  };

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Floor Quality Terminal • Station 1</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Quality Inspection Gate
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Scan fabric rolls, mark flaws (oil, tears, wrong shades), record your binding <strong>Pass / Rework / Reject</strong> decision, and stop bad cloth from ever reaching the customer.
          </p>

          {/* Primary & Secondary Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-black transition shadow-lg cursor-pointer ${
                activeTab === 'scan'
                  ? 'bg-teal-400 text-slate-950 shadow-teal-400/20 ring-2 ring-teal-300'
                  : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>1. Scan Roll Label</span>
            </button>
            <button
              onClick={() => setActiveTab('lookup')}
              className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-black transition shadow-lg cursor-pointer ${
                activeTab === 'lookup'
                  ? 'bg-blue-600 text-white shadow-blue-600/20 ring-2 ring-blue-400'
                  : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>2. Type Roll Number</span>
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-black transition shadow-lg cursor-pointer ${
                activeTab === 'queue'
                  ? 'bg-amber-600 text-white shadow-amber-600/20 ring-2 ring-amber-400'
                  : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>3. Re-check Repaired Rolls</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Clear Counters with Plain English Subtitles */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">Needs Inspection</span>
              <span className="text-2xl font-black text-slate-900">{summary.counts.needs_inspection}</span>
              <span className="text-[10px] text-slate-500 block font-medium">New rolls waiting for first check</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 block">Needs Re-check</span>
              <span className="text-2xl font-black text-amber-600">{summary.counts.rework_due}</span>
              <span className="text-[10px] text-slate-500 block font-medium">Repaired cloth waiting second check</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-700 block">Scrapped (Reject)</span>
              <span className="text-2xl font-black text-rose-600">{summary.counts.recently_rejected}</span>
              <span className="text-[10px] text-slate-500 block font-medium">Permanently blocked from trucks</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 block">Checked Today</span>
              <span className="text-2xl font-black text-emerald-600">{summary.counts.inspected_today}</span>
              <span className="text-[10px] text-slate-500 block font-medium">Rolls tested during this shift</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Inspection Actions (Tab View) */}
      <div>
        {activeTab === 'scan' && (
          <div className="space-y-6">
            <BarcodeScanner onScan={handleScanRoll} />
            <RollLookup onSearch={handleScanRoll} />
          </div>
        )}

        {activeTab === 'lookup' && (
          <div className="space-y-6">
            <RollLookup onSearch={handleScanRoll} />
            <BarcodeScanner onScan={handleScanRoll} />
          </div>
        )}

        {activeTab === 'queue' && (
          <ReinspectionQueue />
        )}
      </div>

      {/* Recent Inspection Activity Table */}
      {summary && summary.recent_activity.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-1">
            <div>
              <h2 className="text-base font-black text-slate-900">Recent Quality Checks on Mill Floor</h2>
              <p className="text-xs text-slate-500">Live records from inspector slips (Click any row to open fabric passport)</p>
            </div>
            <span className="text-xs text-slate-400">Showing last 10 entries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Roll Code</th>
                  <th className="py-3 px-4">Decision</th>
                  <th className="py-3 px-4">Flaw Detected</th>
                  <th className="py-3 px-4">Damaged Length</th>
                  <th className="py-3 px-4">Inspector</th>
                  <th className="py-3 px-4">Time Checked</th>
                  <th className="py-3 px-4 text-right">View Roll</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.recent_activity.map((act) => (
                  <tr
                    key={act.inspection_id}
                    onClick={() => router.push(`/rolls/${act.roll_code}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition group"
                  >
                    <td className="py-3.5 px-4 font-mono font-black text-slate-900 group-hover:text-blue-600">
                      {act.roll_code}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide ${getDecisionBadgeClass(act.decision)}`}>
                        {act.decision}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-bold">
                      {getFriendlyFlawName(act.defect_type)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">
                      {act.affected_quantity > 0 ? `${act.affected_quantity} ${act.unit}` : '0 meters'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {act.inspector}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {formatDate(act.timestamp)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 inline transition-transform group-hover:translate-x-1" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
