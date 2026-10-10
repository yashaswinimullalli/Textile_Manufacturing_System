'use client';

import React, { useState } from 'react';
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useFabricTrace } from '@/context/FabricTraceContext';

interface ReinspectionRoll {
  rollCode: string;
  fabricType: string;
  originalDefect: string;
  repairCompleted: string;
  meters: number;
  priority: 'High' | 'Normal';
  technician: string;
  status: 'PENDING' | 'PASSED' | 'RE_REWORK';
}

const INITIAL_QUEUE: ReinspectionRoll[] = [
  { rollCode: 'ROLL-008', fabricType: 'Cotton Twill 240 GSM', originalDefect: 'Weft Tension Slack', repairCompleted: 'Re-Tensioned & Steamed', meters: 120, priority: 'High', technician: 'Kailash S', status: 'PENDING' },
  { rollCode: 'ROLL-015', fabricType: '100% Combed Cotton', originalDefect: 'Selvedge Curl', repairCompleted: 'Selvedge Heat-Set Finished', meters: 180, priority: 'High', technician: 'Suresh K', status: 'PENDING' },
  { rollCode: 'ROLL-022', fabricType: 'Raw Indigo Denim', originalDefect: 'Minor Oil Droplet', repairCompleted: 'Scouring Solvent Washed', meters: 200, priority: 'Normal', technician: 'Gopal N', status: 'PENDING' },
  { rollCode: 'ROLL-029', fabricType: 'Mulberry Silk Chiffon', originalDefect: 'Crease Mark in Weave', repairCompleted: 'Stenter Ironed & Calendered', meters: 90, priority: 'High', technician: 'Mahesh B', status: 'PENDING' },
  { rollCode: 'ROLL-035', fabricType: 'Pure Organic Linen', originalDefect: 'Shade Variance 3%', repairCompleted: 'Top-Bath Overdyed 10min', meters: 150, priority: 'Normal', technician: 'Ramesh P', status: 'PENDING' },
  { rollCode: 'ROLL-041', fabricType: 'Cotton Twill 240 GSM', originalDefect: 'Loose Warp Thread', repairCompleted: 'Hand-Mended & Trimmed', meters: 160, priority: 'Normal', technician: 'Deepak V', status: 'PENDING' },
  { rollCode: 'ROLL-047', fabricType: 'Raw Indigo Denim', originalDefect: 'Uneven Selvedge Width', repairCompleted: 'Clipped & Edge-Stitched', meters: 140, priority: 'High', technician: 'Kailash S', status: 'PENDING' },
  { rollCode: 'ROLL-050', fabricType: '100% Combed Cotton', originalDefect: 'Surface Dust Contamination', repairCompleted: 'Vacuum Scoured & Rolled', meters: 190, priority: 'Normal', technician: 'Prakash M', status: 'PENDING' },
];

export default function ReinspectionQueuePage() {
  const [queue, setQueue] = useState<ReinspectionRoll[]>(INITIAL_QUEUE);
  const { stampRoll } = useFabricTrace();

  const handleApprove = async (rollCode: string) => {
    setQueue(prev => prev.map(r => r.rollCode === rollCode ? { ...r, status: 'PASSED' } : r));
    await stampRoll(rollCode, 'PASS', [], 'Reinspection passed after floor repairs.');
  };

  const handleRejectAgain = async (rollCode: string) => {
    setQueue(prev => prev.map(r => r.rollCode === rollCode ? { ...r, status: 'RE_REWORK' } : r));
    await stampRoll(rollCode, 'REWORK', [], 'Secondary defect still visible. Sent back to wash.');
  };

  const pendingCount = queue.filter(r => r.status === 'PENDING').length;
  const passedCount = queue.filter(r => r.status === 'PASSED').length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* ─── 4 Concise 2-3 Word Summary Cards ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-slate-400">Queue Total</div>
          <div className="text-3xl font-black text-slate-900 mt-1">{queue.length} Rolls</div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">Repaired Batches</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-amber-600">Pending Check</div>
          <div className="text-3xl font-black text-amber-600 mt-1">{pendingCount} Rolls</div>
          <div className="text-[11px] font-bold text-amber-700 mt-1">Due This Shift</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-emerald-600">Re-Approved</div>
          <div className="text-3xl font-black text-emerald-600 mt-1">{passedCount} Stamped</div>
          <div className="text-[11px] font-bold text-emerald-700 mt-1">Ready for Dispatch</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-blue-600">Recovery Rate</div>
          <div className="text-3xl font-black text-blue-600 mt-1">87.5% Recovered</div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">Scrap Avoided</div>
        </div>

      </div>

      {/* ─── Reinspection Queue List ────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Repaired Fabric Queue</h2>
            <div className="text-xs font-bold text-slate-400 mt-0.5">Reworked Rolls Awaiting Final Release</div>
          </div>
          <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
            {pendingCount} Awaiting Inspection
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {queue.map((item) => {
            const isApproved = item.status === 'PASSED';
            const isReRework = item.status === 'RE_REWORK';

            return (
              <div 
                key={item.rollCode} 
                className={`p-6 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isApproved ? 'bg-emerald-50/40' : (isReRework ? 'bg-amber-50/40' : 'hover:bg-slate-50')
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-black text-base text-slate-900">{item.rollCode}</span>
                    <span className="text-xs font-bold text-slate-600">{item.fabricType}</span>
                    <span className="text-xs font-bold text-slate-400">• {item.meters}m</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      item.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.priority} Priority
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <span className="text-rose-700 font-bold">
                      Original Flaw: <span className="font-medium text-slate-700">{item.originalDefect}</span>
                    </span>
                    <span className="text-emerald-700 font-bold">
                      Repair Done: <span className="font-medium text-slate-700">{item.repairCompleted}</span>
                    </span>
                    <span className="text-slate-400 font-medium">
                      By {item.technician}
                    </span>
                  </div>
                </div>

                {/* Decision Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {item.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => handleApprove(item.rollCode)}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Pass & Release</span>
                      </button>

                      <button
                        onClick={() => handleRejectAgain(item.rollCode)}
                        className="px-3.5 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-black transition active:scale-95 cursor-pointer"
                      >
                        <span>Re-Wash</span>
                      </button>
                    </>
                  ) : isApproved ? (
                    <div className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Approved • Good to Ship</span>
                    </div>
                  ) : (
                    <div className="px-4 py-2 rounded-xl bg-amber-100 text-amber-800 text-xs font-black flex items-center gap-1.5">
                      <RefreshCw className="w-4 h-4 text-amber-600" />
                      <span>Returned to Repair</span>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
