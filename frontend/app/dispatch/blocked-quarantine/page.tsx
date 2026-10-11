'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  XCircle, 
  AlertTriangle, 
  Lock, 
  Clock, 
  FileWarning, 
  RefreshCw, 
  QrCode,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { useFabricTrace } from '@/context/FabricTraceContext';

export default function BlockedQuarantinePage() {
  const { fabricRolls } = useFabricTrace();

  // Dynamically derive quarantined rolls from live database
  const quarantinedRolls = React.useMemo(() => {
    return fabricRolls
      .filter((r) => r.status === 'REJECTED' || r.status === 'REWORK' || r.status === 'PENDING')
      .map((r) => ({
        rollCode: r.roll_code || r.rollId,
        fabric: r.fabricType,
        meters: Math.round(r.produced_quantity || 180),
        status: r.status,
        reason: r.status === 'REJECTED'
          ? 'Failed Quality Criteria'
          : (r.status === 'REWORK' ? 'Rework Action Required' : 'Inspection Pending on Floor'),
        rule: r.status === 'REJECTED'
          ? 'Safety Block: REJECTED_STATUS'
          : (r.status === 'REWORK' ? 'Safety Block: NOT_APPROVED' : 'Safety Block: UNINSPECTED_ROLL'),
        attemptTime: 'Real-time Gate Lock',
      }));
  }, [fabricRolls]);

  const rejectedCount = quarantinedRolls.filter(r => r.status === 'REJECTED').length;
  const reworkCount = quarantinedRolls.filter(r => r.status === 'REWORK').length;
  const pendingCount = quarantinedRolls.filter(r => r.status === 'PENDING').length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* ─── 4 Concise Summary Cards ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-rose-600">Quarantine Total</div>
          <div className="text-3xl font-black text-rose-600 mt-1">{quarantinedRolls.length} Locked</div>
          <div className="text-[11px] font-bold text-rose-700 mt-1">Vehicle Loading Barred</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-amber-600">Defective / Rework</div>
          <div className="text-3xl font-black text-amber-600 mt-1">{rejectedCount + reworkCount} Rolls</div>
          <div className="text-[11px] font-bold text-amber-700 mt-1">{rejectedCount} Rejected · {reworkCount} Rework</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-slate-400">Lockout State</div>
          <div className="text-3xl font-black text-slate-900 mt-1">Database Armed</div>
          <div className="text-[11px] font-bold text-emerald-600 mt-1">PostgreSQL Safety Gate</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-blue-600">Zero-Defect Gate</div>
          <div className="text-3xl font-black text-blue-600 mt-1">100% Enforced</div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">Only Approved Clear</div>
        </div>

      </div>

      {/* ─── Blocked Rolls Audit Quarantine Table ───────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Quarantine Lockout Log (Live Database)</h2>
            <div className="text-xs font-bold text-slate-400 mt-0.5">Non-Approved Rolls Strictly Barred From Dock Loading</div>
          </div>
          <Link
            href="/quality-inspector"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 flex items-center gap-1.5 transition"
          >
            <span>Open Quality Inspector</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {quarantinedRolls.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
              <p className="text-base font-bold text-slate-800">No Rolls in Quarantine</p>
              <p className="text-xs text-slate-400 mt-1">
                All fabric rolls in the database have either been approved for dispatch or no defects are logged.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-5">Roll Barcode</th>
                  <th className="py-3 px-5">Fabric Variety</th>
                  <th className="py-3 px-5">Length</th>
                  <th className="py-3 px-5">QC Status</th>
                  <th className="py-3 px-5">Lock Reason</th>
                  <th className="py-3 px-5">Enforced Rule</th>
                  <th className="py-3 px-5 text-right">Gate Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {quarantinedRolls.map((roll) => (
                  <tr key={roll.rollCode} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-5 font-mono font-black text-slate-900 flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-rose-600" />
                      <span>{roll.rollCode}</span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-700">{roll.fabric}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-600">{roll.meters}m</td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        roll.status === 'REJECTED' 
                          ? 'bg-rose-100 text-rose-800' 
                          : (roll.status === 'REWORK' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700')
                      }`}>
                        {roll.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600">{roll.reason}</td>
                    <td className="py-3.5 px-5 font-mono text-[10px] text-rose-600 font-bold">{roll.rule}</td>
                    <td className="py-3.5 px-5 text-right">
                      <span className="px-2 py-1 rounded bg-rose-50 text-rose-700 text-[10px] font-black border border-rose-200">
                        BARRED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
