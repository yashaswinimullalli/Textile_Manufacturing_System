'use client';

import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  TrendingUp, 
  IndianRupee, 
  Users,
  FileText
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

const DAYS = Array.from({ length: 15 }, (_, i) => ({
  date: `2026-10-${String(i + 1).padStart(2, '0')}`,
  day: i + 1,
  revenue: 120000 + (Math.random() * 40000),
  wages: 35000 + (Math.random() * 5000),
  materials: 45000 + (Math.random() * 10000),
}));

export default function OwnerDashboard() {
  const [selectedDate, setSelectedDate] = useState(DAYS[0].date);
  
  const activeDay = DAYS.find(d => d.date === selectedDate) || DAYS[0];
  const netProfit = activeDay.revenue - activeDay.wages - activeDay.materials;

  const monthlyTotals = DAYS.reduce((acc, curr) => ({
    revenue: acc.revenue + curr.revenue,
    wages: acc.wages + curr.wages,
    materials: acc.materials + curr.materials,
  }), { revenue: 0, wages: 0, materials: 0 });

  const monthlyProfit = monthlyTotals.revenue - monthlyTotals.wages - monthlyTotals.materials;

  return (
    <div className="max-w-6xl space-y-8 font-sans">
      
      {/* ─── Page Header ──────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Owner Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Financial overview, worker wages, and monthly summary.</p>
      </div>

      {/* ─── Financial Calendar ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-teal-50 text-teal-700 rounded-lg">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">October 2026 Calendar</h2>
            <p className="text-xs text-slate-500">Select a date to view daily financials.</p>
          </div>
        </div>

        <div className="grid grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-2 sm:gap-3">
          {DAYS.map((day) => {
            const isSelected = day.date === selectedDate;
            return (
              <button
                key={day.date}
                onClick={() => setSelectedDate(day.date)}
                className={`aspect-square p-2 rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-teal-600 border-teal-600 text-white shadow-md scale-105' 
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <span className="text-sm font-semibold">{day.day}</span>
                <span className={`text-[10px] mt-1 font-medium ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>Oct</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Daily Financial Analysis & Worker Wages ──────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Daily Financials */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Daily Financial Analysis</h2>
              <p className="text-xs text-slate-500 font-mono">{selectedDate}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-sm font-medium text-slate-600">Total Revenue (Sales)</span>
              <span className="text-lg font-bold text-slate-900">{formatCurrency(activeDay.revenue)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-sm font-medium text-slate-600">Raw Materials Cost</span>
              <span className="text-lg font-bold text-red-600">-{formatCurrency(activeDay.materials)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-teal-50 rounded-xl border border-teal-100 mt-2">
              <span className="text-sm font-bold text-teal-900">Net Profit</span>
              <span className="text-xl font-bold text-teal-700">{formatCurrency(netProfit)}</span>
            </div>
          </div>
        </div>

        {/* Worker Wages */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Worker Wages (Daily)</h2>
              <p className="text-xs text-slate-500 font-mono">{selectedDate}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-sm font-medium text-slate-600">Spinning & Weaving Team (14)</span>
              <span className="text-base font-semibold text-slate-800">{formatCurrency(activeDay.wages * 0.45)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-sm font-medium text-slate-600">Dyeing & Processing Team (8)</span>
              <span className="text-base font-semibold text-slate-800">{formatCurrency(activeDay.wages * 0.35)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-sm font-medium text-slate-600">Quality Inspectors (4)</span>
              <span className="text-base font-semibold text-slate-800">{formatCurrency(activeDay.wages * 0.20)}</span>
            </div>
            <div className="flex justify-between items-center p-4 border-t border-slate-200 pt-5 mt-2">
              <span className="text-sm font-bold text-slate-700">Total Wages Paid out</span>
              <span className="text-lg font-bold text-red-600">-{formatCurrency(activeDay.wages)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ─── Monthly Summary ────────────────────────────────────────────────── */}
      <div className="bg-slate-900 rounded-2xl shadow-lg p-6 sm:p-8 text-white">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
          <div className="p-2.5 bg-slate-800 text-teal-400 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Monthly Summary</h2>
            <p className="text-xs text-slate-400">Total aggregation for October 2026 (15 Days)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm font-medium text-slate-400 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(monthlyTotals.revenue)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400 mb-1">Total Raw Materials</p>
            <p className="text-2xl font-bold text-rose-400">-{formatCurrency(monthlyTotals.materials)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400 mb-1">Total Wages Paid</p>
            <p className="text-2xl font-bold text-rose-400">-{formatCurrency(monthlyTotals.wages)}</p>
          </div>
          <div className="pl-0 sm:pl-6 sm:border-l border-slate-700">
            <p className="text-sm font-medium text-slate-400 mb-1">Net Monthly Profit</p>
            <p className="text-3xl font-bold text-teal-400">{formatCurrency(monthlyProfit)}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
