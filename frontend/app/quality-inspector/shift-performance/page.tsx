'use client';

import React from 'react';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  User, 
  Award,
  Zap
} from 'lucide-react';

const hourlyOutput = [
  { time: '08:00 - 09:00', rolls: 6, pass: 6, rework: 0, reject: 0 },
  { time: '09:00 - 10:00', rolls: 7, pass: 6, rework: 1, reject: 0 },
  { time: '10:00 - 11:00', rolls: 8, pass: 7, rework: 1, reject: 0 },
  { time: '11:00 - 12:00', rolls: 6, pass: 5, rework: 0, reject: 1 },
  { time: '12:00 - 13:00', rolls: 4, pass: 4, rework: 0, reject: 0 }, // lunch
  { time: '13:00 - 14:00', rolls: 7, pass: 6, rework: 1, reject: 0 },
  { time: '14:00 - 15:00', rolls: 6, pass: 6, rework: 0, reject: 0 },
  { time: '15:00 - 16:00', rolls: 4, pass: 4, rework: 0, reject: 0 },
];

const teamInspectors = [
  { name: 'Alex Kumar', station: 'Terminal 1', inspected: 48, passPct: '91.7%', avgTime: '9.2 min', grade: 'Grade A' },
  { name: 'Priya Sharma', station: 'Terminal 2', inspected: 44, passPct: '93.2%', avgTime: '9.8 min', grade: 'Grade A' },
  { name: 'Rohan Verma', station: 'Terminal 3', inspected: 39, passPct: '89.5%', avgTime: '11.1 min', grade: 'Grade B' },
  { name: 'Kavita Nair', station: 'Terminal 4', inspected: 46, passPct: '94.0%', avgTime: '9.5 min', grade: 'Grade A' },
];

export default function ShiftPerformancePage() {
  return (
    <div className="space-y-6 font-sans">
      
      {/* ─── 4 Concise 2-3 Word Summary Cards ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-slate-400">Total Checked</div>
          <div className="text-3xl font-black text-slate-900 mt-1">48 Rolls</div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">This Shift</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-blue-600">Inspection Pace</div>
          <div className="text-3xl font-black text-blue-600 mt-1">6.2 Rolls/Hr</div>
          <div className="text-[11px] font-bold text-blue-700 mt-1">Above Target</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-emerald-600">First-Pass Rate</div>
          <div className="text-3xl font-black text-emerald-600 mt-1">91.7% Passed</div>
          <div className="text-[11px] font-bold text-emerald-700 mt-1">Target Met</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-purple-600">Station Accuracy</div>
          <div className="text-3xl font-black text-purple-600 mt-1">99.4% Accurate</div>
          <div className="text-[11px] font-bold text-purple-700 mt-1">Zero Escaped</div>
        </div>

      </div>

      {/* ─── Hourly Inspection Production Bar Chart ─────────────────────────── */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Hourly Inspection Volume</h2>
            <div className="text-xs font-bold text-slate-400 mt-0.5">Rolls Examined Across Shift Hours</div>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
            08:00 to 16:00
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 items-end pt-4 h-48 border-b border-slate-100 pb-2">
          {hourlyOutput.map((h) => {
            const heightPct = Math.round((h.rolls / 8) * 100);

            return (
              <div key={h.time} className="flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[11px] font-mono font-black text-slate-900">{h.rolls}</span>
                <div 
                  className="w-full max-w-[40px] bg-blue-600 rounded-t-xl transition-all"
                  style={{ height: `${heightPct}%` }}
                ></div>
                <span className="text-[9px] font-bold text-slate-400 text-center leading-tight">
                  {h.time.split(' - ')[0]}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold pt-1">
          <span>Peak Inspection Window: <strong>10:00 - 11:00 (8 rolls)</strong></span>
          <span className="text-emerald-600 font-bold">Shift Target: 40 Rolls (Completed +8)</span>
        </div>
      </div>

      {/* ─── Floor Inspector Performance Roster ─────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Inspector Station Log</h2>
            <div className="text-xs font-bold text-slate-400 mt-0.5">Team Performance Metrics</div>
          </div>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
            4 Floor Stations
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-5">Inspector Name</th>
                <th className="py-3 px-5">Workstation</th>
                <th className="py-3 px-5">Rolls Examined</th>
                <th className="py-3 px-5">First-Pass Rate</th>
                <th className="py-3 px-5">Avg Time / Roll</th>
                <th className="py-3 px-5 text-right">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {teamInspectors.map((ti) => (
                <tr key={ti.name} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-5 font-bold text-slate-900">{ti.name}</td>
                  <td className="py-3.5 px-5 text-slate-600 font-mono">{ti.station}</td>
                  <td className="py-3.5 px-5 font-mono font-black text-slate-800">{ti.inspected}</td>
                  <td className="py-3.5 px-5 font-mono font-bold text-emerald-600">{ti.passPct}</td>
                  <td className="py-3.5 px-5 text-slate-500">{ti.avgTime}</td>
                  <td className="py-3.5 px-5 text-right">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
                      {ti.grade}
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
