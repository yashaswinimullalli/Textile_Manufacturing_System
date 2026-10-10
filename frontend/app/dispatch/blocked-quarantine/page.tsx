'use client';

import React from 'react';
import { 
  ShieldAlert, 
  XCircle, 
  AlertTriangle, 
  Lock, 
  Clock, 
  FileWarning, 
  RefreshCw,
  QrCode
} from 'lucide-react';
import { useFabricTrace } from '@/context/FabricTraceContext';

const blockedRollsList = [
  { rollCode: 'ROLL-1042', fabric: 'Raw Indigo Denim', meters: 180, status: 'REJECTED', reason: 'Tension Curl Flaw', rule: 'Zod Block: REJECTED_STATUS', attemptTime: '11:42 AM', scannedBy: 'Gate Scanner Bay 2' },
  { rollCode: 'ROLL-1028', fabric: 'Mulberry Silk Chiffon', meters: 90, status: 'REJECTED', reason: 'Oil Contamination', rule: 'Zod Block: REJECTED_STATUS', attemptTime: '10:15 AM', scannedBy: 'Gate Scanner Bay 1' },
  { rollCode: 'ROLL-008', fabric: 'Cotton Twill 240 GSM', meters: 120, status: 'REWORK_REQUIRED', reason: 'Weft Slack Detected', rule: 'Zod Block: NOT_APPROVED', attemptTime: '09:30 AM', scannedBy: 'Gate Scanner Bay 3' },
  { rollCode: 'ROLL-015', fabric: '100% Combed Cotton', meters: 180, status: 'REWORK_REQUIRED', reason: 'Selvedge Repair Active', rule: 'Zod Block: NOT_APPROVED', attemptTime: '09:05 AM', scannedBy: 'Gate Scanner Bay 1' },
  { rollCode: 'ROLL-029', fabric: 'Mulberry Silk Chiffon', meters: 90, status: 'NEEDS_INSPECTION', reason: 'Not Inspected on Floor', rule: 'Zod Block: UNINSPECTED_ROLL', attemptTime: '08:45 AM', scannedBy: 'Gate Scanner Bay 2' },
  { rollCode: 'ROLL-035', fabric: 'Pure Organic Linen', meters: 150, status: 'REWORK_REQUIRED', reason: 'Dye Bath Rework Due', rule: 'Zod Block: NOT_APPROVED', attemptTime: 'Yesterday', scannedBy: 'Gate Scanner Bay 3' },
];

export default function BlockedQuarantinePage() {
  const { fabricRolls } = useFabricTrace();

  // Combine with live rejected rolls
  const liveRejected = fabricRolls.filter(r => r.status === 'REJECTED' || r.status === 'REWORK');

  return (
    <div className="space-y-6 font-sans">
      
      {/* ─── 4 Concise 2-3 Word Summary Cards ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-rose-600">Quarantine Total</div>
          <div className="text-3xl font-black text-rose-600 mt-1">{blockedRollsList.length} Locked</div>
          <div className="text-[11px] font-bold text-rose-700 mt-1">Truck Shipping Blocked</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-amber-600">Gate Violations</div>
          <div className="text-3xl font-black text-amber-600 mt-1">6 Logged</div>
          <div className="text-[11px] font-bold text-amber-700 mt-1">Red-Light Intercepted</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-slate-400">Lockout State</div>
          <div className="text-3xl font-black text-slate-900 mt-1">Server Armed</div>
          <div className="text-[11px] font-bold text-emerald-600 mt-1">Zod Rules Active</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-blue-600">Zero-Defect Gate</div>
          <div className="text-3xl font-black text-blue-600 mt-1">100% Secure</div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">Zero Leaks</div>
        </div>

      </div>

      {/* ─── Blocked Rolls Audit Quarantine Table ───────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Quarantine Lockout Log</h2>
            <div className="text-xs font-bold text-slate-400 mt-0.5">Defective Rolls Strictly Barred From Vehicle Loading</div>
          </div>
          <span className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-full border border-rose-200">
            Automated Server Lockdown
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-5">Roll Barcode</th>
                <th className="py-3 px-5">Fabric Variety</th>
                <th className="py-3 px-5">Length</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Lock Reason</th>
                <th className="py-3 px-5">Enforced Rule</th>
                <th className="py-3 px-5 text-right">Attempt Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {blockedRollsList.map((roll) => (
                <tr key={roll.rollCode} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-5 font-mono font-black text-slate-900 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-rose-600" />
                    <span>{roll.rollCode}</span>
                  </td>
                  <td className="py-3.5 px-5 text-slate-700">{roll.fabric}</td>
                  <td className="py-3.5 px-5 font-mono text-slate-600">{roll.meters}m</td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      roll.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {roll.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-rose-700 font-bold">{roll.reason}</td>
                  <td className="py-3.5 px-5 font-mono text-[10px] text-slate-500">{roll.rule}</td>
                  <td className="py-3.5 px-5 text-right font-mono text-slate-500">{roll.attemptTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
