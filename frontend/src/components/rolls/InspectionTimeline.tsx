'use client';

import React from 'react';
import { Inspection } from '@/types/factory';
import { formatDate, getDecisionBadgeClass, getFriendlyFlawName } from '@/lib/formatters';
import { 
  CheckCircle2, 
  RefreshCw, 
  XCircle, 
  Clock, 
  User, 
  AlertTriangle,
  FileText,
  ShieldCheck,
  History
} from 'lucide-react';

interface InspectionTimelineProps {
  inspections: Inspection[];
}

export default function InspectionTimeline({ inspections }: InspectionTimelineProps) {
  if (!inspections || inspections.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-sm">
        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">This Roll Has Not Been Inspected Yet</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          No quality checks have been conducted on this roll. A quality inspector must inspect the fabric before it can be shipped.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Quality Check History ({inspections.length} {inspections.length === 1 ? 'Check' : 'Checks'} Logged)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full chronological story of inspections for this fabric roll
          </p>
        </div>
        <div className="text-xs font-bold text-slate-700 bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-200">
          History is Never Erased
        </div>
      </div>

      {/* Explanatory callout for non-technical users */}
      {inspections.length > 1 && (
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs flex items-start space-x-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold block">Why do I see multiple checks?</span>
            This roll had a flaw on an earlier check, was repaired on the floor, and re-inspected. The latest <strong>PASS</strong> approval allows the roll to ship, while keeping the full historical truth for our records.
          </div>
        </div>
      )}

      {/* Visual Timeline Steps */}
      <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {inspections.map((insp, index) => {
          const isLatest = index === inspections.length - 1;
          const isPass = insp.decision === 'PASS';
          const isRework = insp.decision === 'REWORK';
          const isReject = insp.decision === 'REJECT';

          return (
            <div key={insp.id} className="relative">
              {/* Timeline marker */}
              <div className={`absolute -left-[33px] top-2 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center shadow-md ${
                isPass ? 'bg-emerald-600 text-white' : isRework ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white'
              }`}>
                {isPass && <CheckCircle2 className="w-4 h-4" />}
                {isRework && <RefreshCw className="w-4 h-4" />}
                {isReject && <XCircle className="w-4 h-4" />}
              </div>

              {/* Card */}
              <div className={`p-6 rounded-3xl border-2 transition-all ${
                isLatest 
                  ? 'bg-slate-50 border-slate-300 ring-2 ring-blue-500/10 shadow-sm' 
                  : 'bg-white border-slate-200 opacity-80'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
                  <div className="flex items-center space-x-2.5">
                    <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide ${getDecisionBadgeClass(insp.decision)}`}>
                      {insp.decision === 'PASS' ? 'PASS' : insp.decision === 'REWORK' ? 'REWORK' : 'REJECT'}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-700">
                      Slip #{insp.id}
                    </span>
                    {isLatest && (
                      <span className="text-[10px] uppercase font-black text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                        Current Status
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center space-x-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(insp.created_at)}</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">Inspection Finding / Flaw:</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {getFriendlyFlawName(insp.defect_type)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">Flawed Fabric Length:</span>
                    <span className={`font-black text-sm mt-0.5 block ${
                      insp.affected_quantity > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
                      {insp.affected_quantity > 0 ? `${insp.affected_quantity} ${insp.unit} damaged` : '0 meters (Clean Fabric)'}
                    </span>
                  </div>
                </div>

                {insp.notes && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-800 flex items-start space-x-2.5">
                    <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-700 block text-[11px] mb-0.5">Inspector Notes:</span>
                      <p className="leading-relaxed font-medium">"{insp.notes}"</p>
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Inspector: <strong className="text-slate-800">{insp.inspector_name}</strong></span>
                  </div>
                  {insp.prior_inspection_id && (
                    <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                      Follow-up check after repair of slip #{insp.prior_inspection_id}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
