'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  AlertCircle, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  ShieldAlert,
  IndianRupee,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useFabricTrace } from '@/context/FabricTraceContext';

export default function OwnerInterventionFeedPage() {
  const { interventions, resolveIntervention, refreshData } = useFabricTrace();

  const totalAtRisk = interventions.reduce((sum, item) => {
    // extract rupee from whyItMatters if present or default
    return sum + (item.status === 'REJECTED' ? 48000 : 15000);
  }, 0);

  const pendingCount = interventions.filter(i => !i.actioned).length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* ─── 4 Concise 2-3 Word Summary Cards ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium uppercase text-slate-400">Total Escalations</div>
          <div className="text-3xl font-medium text-slate-900 mt-1">{interventions.length} Items</div>
          <div className="text-[11px] font-medium text-slate-500 mt-1">Floor Escalated</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm">
          <div className="text-[11px] font-medium uppercase text-rose-600">Pending Actions</div>
          <div className="text-3xl font-medium text-rose-600 mt-1">{pendingCount} Decisions</div>
          <div className="text-[11px] font-medium text-rose-700 mt-1">Immediate Need</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm">
          <div className="text-[11px] font-medium uppercase text-amber-600">Capital At Risk</div>
          <div className="text-2xl sm:text-3xl font-medium text-amber-600 mt-1">₹{totalAtRisk.toLocaleString('en-IN')}</div>
          <div className="text-[11px] font-medium text-amber-700 mt-1">Raw Materials</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm">
          <div className="text-[11px] font-medium uppercase text-blue-600">Sync Status</div>
          <div className="text-3xl font-medium text-blue-600 mt-1">Live Linked</div>
          <div className="text-[11px] font-medium text-emerald-600 mt-1">Inspector Pushed</div>
        </div>

      </div>

      {/* ─── Floor Intervention Feed Cards ──────────────────────────────────── */}
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-xl font-medium text-slate-900 tracking-tight">Active Floor Escalations</h2>
            <div className="text-xs font-medium text-slate-400 mt-0.5">Management Actions Required Before Dispatch</div>
          </div>
          <button
            onClick={() => refreshData()}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-6">
          <AnimatePresence initial={false}>
            {interventions.map((alert) => {
              const isActioned = !!alert.actioned;
              const chosenAction = alert.actioned;

              return (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, y: -20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className={`bg-white rounded-3xl p-6 sm:p-8 border-2 transition-all shadow-md ${
                    isActioned 
                      ? "border-emerald-300 bg-emerald-50/20" 
                      : alert.status === "REJECTED"
                      ? "border-rose-300 hover:border-rose-400 ring-2 ring-rose-500/10"
                      : "border-amber-300 hover:border-amber-400 ring-2 ring-amber-500/10"
                  }`}
                >
                  <div className="space-y-5">
                    
                    {/* 1. WHAT HAPPENED */}
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-2xl shrink-0 ${
                        alert.status === "REJECTED" 
                          ? "bg-rose-100 text-rose-700" 
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                          WHAT HAPPENED
                        </span>
                        <h3 className="text-lg sm:text-xl font-medium text-slate-900 tracking-tight">
                          {alert.whatHappened}
                        </h3>
                      </div>
                    </div>

                    {/* 2. WHY IT MATTERS (Bold Red Business Impact) */}
                    <div className="flex items-start gap-3.5 pl-1 bg-rose-50/60 p-3.5 rounded-2xl border border-rose-200/80">
                      <div className="p-2 rounded-xl bg-rose-100 text-rose-600 shrink-0 mt-0.5">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-rose-600 block">
                          WHY IT MATTERS
                        </span>
                        <p className="text-xs sm:text-sm font-medium text-rose-800 leading-relaxed">
                          {alert.whyItMatters}
                        </p>
                      </div>
                    </div>

                    {/* 3. WHO SHOULD ACT */}
                    <div className="flex items-center gap-3 pl-2 py-1">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="text-xs font-medium text-slate-600">
                        <span className="font-medium text-slate-800">WHO SHOULD ACT:</span> {alert.whoShouldAct}
                      </div>
                    </div>

                    {/* 4. NEXT ACTION (Two Prominent, Well-Spaced Buttons) */}
                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-medium uppercase tracking-wider text-slate-700">
                            NEXT ACTION
                          </span>
                        </div>

                        {isActioned ? (
                          <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-100 text-emerald-900 text-xs font-medium">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Action Executed: {chosenAction}</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                            <button
                              onClick={() => resolveIntervention(alert.id, alert.actions[0])}
                              className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium tracking-wide shadow-md transition active:scale-95 cursor-pointer"
                            >
                              {alert.actions[0]}
                            </button>

                            <button
                              onClick={() => resolveIntervention(alert.id, alert.actions[1])}
                              className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium tracking-wide border border-slate-200 transition active:scale-95 cursor-pointer"
                            >
                              {alert.actions[1]}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
