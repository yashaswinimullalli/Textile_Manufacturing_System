'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  XCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Layers,
  ArrowRight,
} from 'lucide-react';

// ─── Stage summary data ────────────────────────────────────────────────────────
const stageSummary = [
  { id: 'spinning', label: 'Spinning', passed: 38, rework: 4, rejected: 1, pending: 7 },
  { id: 'weaving', label: 'Weaving', passed: 32, rework: 8, rejected: 2, pending: 8 },
  { id: 'dyeing', label: 'Dyeing', passed: 29, rework: 6, rejected: 3, pending: 12 },
  { id: 'final', label: 'Final Inspection', passed: 24, rework: 5, rejected: 2, pending: 19 },
];

// ─── Action wall items (only real, grounded issues) ──────────────────────────
type ActionStatus = 'open' | 'in_progress' | 'resolved';
interface ActionItem {
  id: string;
  stage: string;
  roll: string;
  what: string;
  where: string;
  why: string;
  next: string;
  status: ActionStatus;
  severity: 'high' | 'medium' | 'low';
  qiRoute: string;
}

const ACTIONS: ActionItem[] = [
  {
    id: 'ACT-001',
    stage: 'Weaving',
    roll: 'YRN-019 / YRN-022 / YRN-040',
    what: 'Rework required — Uneven Weave & Reed Mark defects recorded at Weaving stage.',
    where: 'Weaving Stage · LOOM-03 · Evening B Shift',
    why: '3 rolls with weaving defects cannot proceed to Dyeing. Customer order ORD-2026-019 (Sabyasachi) is time-sensitive.',
    next: 'Reinspect after loom recalibration. Supervisor must clear LOOM-03 before next batch.',
    status: 'open',
    severity: 'high',
    qiRoute: '/quality-inspector/reinspection-queue',
  },
  {
    id: 'ACT-002',
    stage: 'Dyeing',
    roll: 'YRN-002 / YRN-028',
    what: 'Wrong Colour vs. Spec defect — recorded colour does not match customer approved shade card.',
    where: 'Dyeing Stage · Dye Vat 2',
    why: 'Levi\'s India (ORD-2026-002) and DNMX (ORD-2026-028) both specify exact Indigo / Light Denim shades. Shade deviation will cause customer rejection.',
    next: 'Hold rolls. Re-dye with corrected bath. Re-inspect Dyeing stage after rework.',
    status: 'open',
    severity: 'high',
    qiRoute: '/quality-inspector',
  },
  {
    id: 'ACT-003',
    stage: 'Final Inspection',
    roll: 'YRN-013 / YRN-019 / YRN-034',
    what: 'Final inspection blocking dispatch — Dyeing stage not yet passed for these rolls.',
    where: 'Final Inspection gate · 3 rolls blocked',
    why: 'Rolls cannot be marked dispatch-ready while an upstream stage (Dyeing) has not passed. Delivery to Kalyan Silks and Taneira is at risk.',
    next: 'Complete and pass Dyeing stage inspection first, then re-open Final Inspection.',
    status: 'open',
    severity: 'high',
    qiRoute: '/quality-inspector',
  },
  {
    id: 'ACT-004',
    stage: 'Spinning',
    roll: 'YRN-009 / YRN-036',
    what: 'Neps & Knots defect recorded — affects downstream weaving quality.',
    where: 'Spinning Stage · Ring Frame Unit 4',
    why: 'Yarn consistency issue in 2 bamboo and terry cotton rolls may cause broken threads at Weaving. Better to rework now than after weaving.',
    next: 'Re-spin or manually clean nep-heavy sections. Re-inspect Spinning stage.',
    status: 'in_progress',
    severity: 'medium',
    qiRoute: '/quality-inspector',
  },
  {
    id: 'ACT-005',
    stage: 'Weaving',
    roll: 'YRN-015 / YRN-024 / YRN-033',
    what: '3 rolls pending Weaving inspection — check overdue by more than 4 hours.',
    where: 'Weaving Stage · Station 2 queue',
    why: 'Flannel, Seersucker, and Madras Check rolls are waiting. Blackberrys and Arrow orders have tight dispatch windows.',
    next: 'Assign inspector to Station 2 to clear pending Weaving checks this shift.',
    status: 'open',
    severity: 'medium',
    qiRoute: '/quality-inspector',
  },
  {
    id: 'ACT-006',
    stage: 'Dyeing',
    roll: 'YRN-039',
    what: 'Crease / Rope Mark defect — recurring on same dye batch for Chanderi Silk Cotton.',
    where: 'Dyeing Stage · Jigger Dye Machine',
    why: 'Same crease defect appeared in previous batch on same machine. Equipment may need maintenance.',
    next: 'Log maintenance ticket for Jigger machine. Re-inspect YRN-039 after machine check.',
    status: 'in_progress',
    severity: 'low',
    qiRoute: '/quality-inspector/reinspection-queue',
  },
];

const severityLabel = { high: 'High', medium: 'Medium', low: 'Low' };
const severityBg = {
  high: 'bg-red-50 border-red-200',
  medium: 'bg-amber-50 border-amber-200',
  low: 'bg-slate-50 border-slate-200',
};
const severityDot = { high: 'bg-red-500', medium: 'bg-amber-400', low: 'bg-slate-400' };
const statusColors: Record<ActionStatus, string> = {
  open: 'bg-red-50 text-red-700 border-red-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};
const statusIcons: Record<ActionStatus, React.ReactNode> = {
  open: <XCircle className="w-3 h-3" />,
  in_progress: <RefreshCw className="w-3 h-3" />,
  resolved: <CheckCircle2 className="w-3 h-3" />,
};

export default function OwnerQualityPage() {
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress'>('all');

  const filtered = ACTIONS.filter((a) => filter === 'all' || a.status === filter);
  const openCount = ACTIONS.filter((a) => a.status === 'open').length;
  const inProgressCount = ACTIONS.filter((a) => a.status === 'in_progress').length;

  return (
    <div className="space-y-6 font-sans">

      {/* ─── Stage Overview Cards ──────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-teal-600" />
          <h2 className="text-sm font-semibold text-slate-700">Stage Quality Overview</h2>
          <span className="text-xs text-slate-400">— counts from this session</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stageSummary.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 mb-3">{s.label}</p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-700"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Passed</span>
                  <span className="font-semibold text-slate-800">{s.passed}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-amber-700"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Rework</span>
                  <span className="font-semibold text-slate-800">{s.rework}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-red-700"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Rejected</span>
                  <span className="font-semibold text-slate-800">{s.rejected}</span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-1.5 mt-1.5">
                  <span className="flex items-center gap-1.5 text-slate-500"><Clock className="w-3 h-3" />Pending</span>
                  <span className="font-semibold text-slate-800">{s.pending}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Quality Action Wall ────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-700">Quality Action Wall</h2>
            <span className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">{openCount} open</span>
            {inProgressCount > 0 && (
              <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">{inProgressCount} in progress</span>
            )}
          </div>
          <div className="flex gap-1.5">
            {(['all', 'open', 'in_progress'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${filter === f ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}
              >
                {f === 'all' ? 'All' : f === 'open' ? 'Open' : 'In Progress'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className={`rounded-xl border p-4 ${severityBg[item.severity]}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${severityDot[item.severity]}`} />
                  <div className="min-w-0">
                    {/* Row 1: Stage + Roll + Status */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-full">{item.stage}</span>
                      <span className="text-xs font-mono text-slate-500">{item.roll}</span>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium border px-2 py-0.5 rounded-full ${statusColors[item.status]}`}>
                        {statusIcons[item.status]}
                        {item.status === 'open' ? 'Open' : item.status === 'in_progress' ? 'In Progress' : 'Resolved'}
                      </span>
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${item.severity === 'high' ? 'bg-red-100 text-red-700' : item.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                        {severityLabel[item.severity]}
                      </span>
                    </div>

                    {/* What */}
                    <p className="text-sm font-medium text-slate-800 leading-snug">{item.what}</p>

                    {/* Where */}
                    <p className="text-xs text-slate-500 mt-1">
                      <span className="font-medium text-slate-600">Where:</span> {item.where}
                    </p>

                    {/* Why */}
                    <p className="text-xs text-slate-500 mt-0.5">
                      <span className="font-medium text-slate-600">Impact:</span> {item.why}
                    </p>

                    {/* Next action */}
                    <div className="flex items-start gap-1.5 mt-2">
                      <ArrowRight className="w-3.5 h-3.5 text-teal-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-teal-700 font-medium">{item.next}</p>
                    </div>
                  </div>
                </div>

                {/* Link to QI record */}
                <Link
                  href={item.qiRoute}
                  className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-teal-700 bg-white border border-teal-200 hover:bg-teal-50 px-3 py-2 rounded-lg transition cursor-pointer whitespace-nowrap"
                >
                  View Record
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">No items in this filter</p>
              <p className="text-xs text-slate-400 mt-1">All open issues may have been resolved.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
