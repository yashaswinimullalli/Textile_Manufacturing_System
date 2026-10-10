'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Minus, 
  IndianRupee, 
  AlertTriangle, 
  AlertCircle, 
  ArrowRight, 
  Check, 
  Printer 
} from 'lucide-react';
import { useFabricTrace } from '@/context/FabricTraceContext';
import { formatCurrency } from '@/lib/formatters';

export default function OwnerUnifiedScreen() {
  const { 
    selectedDate, 
    currentReceipt, 
    availableDates, 
    setSelectedDate, 
    interventions,
    resolveIntervention 
  } = useFabricTrace();

  // Calendar days grid mapping (October 2026, 15 days)
  const calendarDays = Array.from({ length: 15 }, (_, i) => {
    const d = i + 1;
    const dateStr = `2026-10-${String(d).padStart(2, '0')}`;
    const daySummary = availableDates.find(ad => ad.date === dateStr);
    return {
      dayNum: d,
      dateStr,
      netProfit: daySummary ? daySummary.net_profit : (45000 + d * 3000)
    };
  });

  return (
    <div className="font-sans select-none space-y-8">
      
      {/* ─── Zero-Click Grid: Left Side (The Money) | Right Side (The Action Feed) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ─── LEFT SIDE (THE MONEY - 5 COLS) ─────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* 1. FINANCIAL CALENDAR */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm space-y-6">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Financial Calendar
                  </h2>
                  <p className="text-xs text-slate-500 font-bold">
                    Tap a date to update the receipt below.
                  </p>
                </div>
              </div>
              <span className="text-xs font-black uppercase px-3 py-1 bg-slate-900 text-white rounded-full">
                October 2026
              </span>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-black uppercase text-slate-400">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Offset for Oct 2026 start */}
              <div className="aspect-square opacity-0"></div>
              <div className="aspect-square opacity-0"></div>
              <div className="aspect-square opacity-0"></div>
              <div className="aspect-square opacity-0"></div>

              {calendarDays.map((cDay) => {
                const isSelected = selectedDate === cDay.dateStr;
                return (
                  <button
                    key={cDay.dateStr}
                    onClick={() => setSelectedDate(cDay.dateStr)}
                    className={`aspect-square p-1 rounded-2xl flex flex-col items-center justify-center border-2 transition cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-xl scale-105"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-200"
                    }`}
                  >
                    <span className="text-sm font-black">
                      {cDay.dayNum}
                    </span>
                    <span className={`text-[10px] font-mono font-bold ${
                      isSelected ? "text-emerald-300" : "text-emerald-600"
                    }`}>
                      +₹{Math.round(cDay.netProfit / 1000)}k
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 text-xs font-bold text-slate-500 flex justify-between">
              <span>Active Date: <strong className="text-slate-900 font-mono">{selectedDate}</strong></span>
              <span className="text-emerald-600 font-black">15 Days Available</span>
            </div>

          </div>

          {/* 2. THE STORE RECEIPT (Looks like physical grocery receipt) */}
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full bg-[#FAF9F5] border-2 border-stone-300 p-8 pt-10 shadow-2xl font-mono text-stone-900 overflow-hidden"
            style={{
              clipPath: "polygon(0% 0%, 100% 0%, 100% calc(100% - 14px), 98% 100%, 96% calc(100% - 14px), 94% 100%, 92% calc(100% - 14px), 90% 100%, 88% calc(100% - 14px), 86% 100%, 84% calc(100% - 14px), 82% 100%, 80% calc(100% - 14px), 78% 100%, 76% calc(100% - 14px), 74% 100%, 72% calc(100% - 14px), 70% 100%, 68% calc(100% - 14px), 66% 100%, 64% calc(100% - 14px), 62% 100%, 60% calc(100% - 14px), 58% 100%, 56% calc(100% - 14px), 54% 100%, 52% calc(100% - 14px), 50% 100%, 48% calc(100% - 14px), 46% 100%, 44% calc(100% - 14px), 42% 100%, 40% calc(100% - 14px), 38% 100%, 36% calc(100% - 14px), 34% 100%, 32% calc(100% - 14px), 30% 100%, 28% calc(100% - 14px), 26% 100%, 24% calc(100% - 14px), 22% 100%, 20% calc(100% - 14px), 18% 100%, 16% calc(100% - 14px), 14% 100%, 12% calc(100% - 14px), 10% 100%, 8% calc(100% - 14px), 6% 100%, 4% calc(100% - 14px), 2% 100%, 0% calc(100% - 14px))"
            }}
          >
            {/* Header */}
            <div className="text-center space-y-1 pb-4 border-b-2 border-dashed border-stone-400">
              <p className="text-xs font-black tracking-widest text-stone-500 uppercase">
                *** STORE RECEIPT ***
              </p>
              <h3 className="text-2xl font-black text-stone-900 tracking-tight">
                FABRICTRACE MILLS
              </h3>
              <p className="text-xs text-stone-600">
                DATE: {selectedDate}
              </p>
            </div>

            {/* Simple Math Breakdown */}
            <div className="py-6 space-y-4">
              
              {/* [Plus Icon] Money In (Buyers): +$X */}
              <div className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <div className="p-1 rounded bg-emerald-100 text-emerald-700">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span>Money In (Buyers):</span>
                </div>
                <span className="font-black text-emerald-700 text-lg">
                  +{formatCurrency(currentReceipt?.buyer_payments || 162000)}
                </span>
              </div>

              {/* [Minus Icon] Money Out (Yarn + Wages): -$Y */}
              <div className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2 text-rose-800 font-bold">
                  <div className="p-1 rounded bg-rose-100 text-rose-700">
                    <Minus className="w-4 h-4" />
                  </div>
                  <span>Money Out (Yarn + Wages):</span>
                </div>
                <span className="font-black text-rose-700 text-lg">
                  -{formatCurrency(currentReceipt?.operating_costs || 91000)}
                </span>
              </div>

              {/* [Minus Icon] Lost to Bad Rolls: -$Z */}
              <div className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2 text-rose-800 font-bold">
                  <div className="p-1 rounded bg-rose-100 text-rose-700">
                    <Minus className="w-4 h-4" />
                  </div>
                  <span>Lost to Bad Rolls:</span>
                </div>
                <span className="font-black text-rose-700 text-lg">
                  -{formatCurrency(currentReceipt?.scrap_losses || 0)}
                </span>
              </div>

              {/* Dashed line separator */}
              <div className="pt-2 border-b-2 border-dashed border-stone-500"></div>

              {/* [IndianRupee Icon] Today's Profit: $Total */}
              <div className="pt-2 pb-2 flex items-center justify-between bg-stone-200/70 p-4 rounded-2xl border border-stone-300">
                <div className="flex items-center gap-2 font-black text-stone-900 text-base">
                  <IndianRupee className="w-5 h-5 text-emerald-700" />
                  <span>Today&apos;s Profit:</span>
                </div>
                <span className={`font-black text-2xl ${
                  (currentReceipt?.net_profit || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {formatCurrency(currentReceipt?.net_profit || 71000)}
                </span>
              </div>

            </div>

            {/* Print Button & Barcode */}
            <div className="pt-4 border-t-2 border-dashed border-stone-400 text-center space-y-4 pb-4">
              <button
                onClick={() => window.print()}
                className="w-full py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Print Physical Receipt</span>
              </button>

              <div className="font-mono text-xs tracking-widest text-stone-400 select-none">
                ||| |||| | ||||| || |||||| ||||| ||||
              </div>
            </div>

          </motion.div>

        </div>

        {/* ─── RIGHT SIDE (THE ACTION FEED - 7 COLS) ─────────────────────────── */}
        <div className="lg:col-span-7 space-y-6">
          
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping"></span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Emergency Action Feed
              </h2>
            </div>
            <p className="text-sm text-slate-500 font-bold mt-1">
              Live factory emergencies. Fix each problem with one tap.
            </p>
          </div>

          {/* Vertical list of large cards with huge gaps (gap-8) */}
          <div className="flex flex-col gap-8">
            {interventions.map((card) => {
              const isActioned = Boolean(card.actioned);

              return (
                <div
                  key={card.id}
                  className={`bg-white rounded-3xl p-8 border-4 transition-all shadow-lg flex flex-col space-y-6 ${
                    isActioned 
                      ? "border-emerald-300 bg-emerald-50/30 opacity-75"
                      : "border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {/* Card Header & Badge */}
                  <div className="flex items-center justify-between">
                    <span className="px-4 py-1.5 rounded-full bg-slate-900 text-white font-mono text-sm font-black">
                      {card.rollId}
                    </span>
                    <span className={`text-xs font-black uppercase px-3 py-1 rounded-full ${
                      card.status === "REJECTED" 
                        ? "bg-rose-100 text-rose-700 border border-rose-300"
                        : "bg-amber-100 text-amber-800 border border-amber-300"
                    }`}>
                      {card.status}
                    </span>
                  </div>

                  {/* 1. [AlertTriangle] WHAT HAPPENED */}
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                        WHAT HAPPENED
                      </span>
                      <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                        {card.whatHappened}
                      </p>
                    </div>
                  </div>

                  {/* 2. [AlertCircle] WHY IT MATTERS */}
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-rose-100 text-rose-700 shrink-0 mt-0.5">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-rose-500 block">
                        WHY IT MATTERS
                      </span>
                      <p className="text-xl sm:text-2xl font-black text-rose-700 tracking-tight mt-0.5">
                        {card.whyItMatters}
                      </p>
                    </div>
                  </div>

                  {/* 3. [ArrowRight] FIX IT NOW Buttons */}
                  <div className="pt-4 border-t-2 border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                      <ArrowRight className="w-5 h-5 text-slate-900" />
                      <span className="text-sm font-black uppercase tracking-wider text-slate-900">
                        FIX IT NOW
                      </span>
                    </div>

                    {isActioned ? (
                      <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-base flex items-center gap-2">
                        <Check className="w-6 h-6 text-emerald-600 stroke-[3]" />
                        <span>Action Completed: {card.actioned}</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          onClick={() => resolveIntervention(card.id, card.actions[0])}
                          className="w-full py-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-base sm:text-lg font-black tracking-wide shadow-md transition cursor-pointer"
                        >
                          {card.actions[0]}
                        </button>
                        <button
                          onClick={() => resolveIntervention(card.id, card.actions[1])}
                          className="w-full py-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-base sm:text-lg font-black tracking-wide shadow-md transition cursor-pointer"
                        >
                          {card.actions[1]}
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
}
