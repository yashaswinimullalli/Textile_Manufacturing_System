'use client';

import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  TrendingUp, 
  IndianRupee, 
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/formatters';

// ─── Data Generation ─────────────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October'
];

const DEPARTMENTS = [
  {
    name: 'Spinning',
    employees: [
      { name: 'Ramesh Patel', role: 'Machine Operator', wage: 850 },
      { name: 'Suresh Kumar', role: 'Machine Operator', wage: 850 },
      { name: 'Amit Singh', role: 'Technician', wage: 1100 },
      { name: 'Vijay Sharma', role: 'Helper', wage: 600 },
      { name: 'Dinesh Yadav', role: 'Helper', wage: 600 },
      { name: 'Kisan Patil', role: 'Quality Checker', wage: 750 },
      { name: 'Pramod Desai', role: 'Supervisor', wage: 1400 },
    ]
  },
  {
    name: 'Weaving',
    employees: [
      { name: 'Rajesh Verma', role: 'Loom Operator', wage: 900 },
      { name: 'Sunil Das', role: 'Loom Operator', wage: 900 },
      { name: 'Manoj Tiwari', role: 'Loom Operator', wage: 900 },
      { name: 'Anil Gupta', role: 'Technician', wage: 1150 },
      { name: 'Santosh Kumar', role: 'Helper', wage: 600 },
      { name: 'Mukesh Singh', role: 'Helper', wage: 600 },
      { name: 'Pankaj Mishra', role: 'Quality Checker', wage: 750 },
      { name: 'Hari Om', role: 'Supervisor', wage: 1400 },
    ]
  },
  {
    name: 'Dyeing',
    employees: [
      { name: 'Arun Bhatia', role: 'Master Dyer', wage: 1600 },
      { name: 'Vikas Jain', role: 'Chemical Mixer', wage: 1000 },
      { name: 'Deepak Rao', role: 'Machine Operator', wage: 900 },
      { name: 'Sanjay Reddy', role: 'Machine Operator', wage: 900 },
      { name: 'Gopal Krishnan', role: 'Helper', wage: 650 },
      { name: 'Karthik S', role: 'Helper', wage: 650 },
      { name: 'Murali M', role: 'Washing Tech', wage: 800 },
    ]
  },
  {
    name: 'Quality Inspection',
    employees: [
      { name: 'Alex Kumar', role: 'Lead Inspector', wage: 1200 },
      { name: 'Priya Sharma', role: 'Inspector', wage: 950 },
      { name: 'Rohan Verma', role: 'Inspector', wage: 950 },
      { name: 'Neha Gupta', role: 'Inspector', wage: 950 },
      { name: 'Vikram Singh', role: 'Lab Analyst', wage: 1100 },
      { name: 'Meera Patel', role: 'Lab Analyst', wage: 1100 },
      { name: 'Kavita Iyer', role: 'Data Entry', wage: 700 },
    ]
  }
];

// Generate consistent random data for a specific date
const getDailyData = (year: number, monthIndex: number, day: number) => {
  // Use a simple seed based on date to keep it deterministic across renders
  let seed = year * 10000 + monthIndex * 100 + day;
  const pseudoRandom = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  return {
    revenue: 90000 + (pseudoRandom() * 60000),
    materials: 35000 + (pseudoRandom() * 15000),
    maintenance: pseudoRandom() > 0.8 ? 5000 + (pseudoRandom() * 10000) : 0,
  };
};

export default function OwnerDashboard() {
  const [currentMonthIdx, setCurrentMonthIdx] = useState(9); // 9 = October
  const currentYear = 2026;
  
  // Calculate total static wages per day
  const totalDailyWages = useMemo(() => {
    return DEPARTMENTS.reduce((total, dept) => {
      return total + dept.employees.reduce((sum, emp) => sum + emp.wage, 0);
    }, 0);
  }, []);

  const [selectedDate, setSelectedDate] = useState({
    year: currentYear,
    month: currentMonthIdx,
    day: 10
  });

  // Calendar logic
  const totalDaysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
  const daysInMonth = (currentYear === 2026 && currentMonthIdx === 9) ? 10 : totalDaysInMonth;
  const firstDayOfMonth = new Date(currentYear, currentMonthIdx, 1).getDay(); // 0 = Sunday
  
  const monthDays = useMemo(() => {
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const data = getDailyData(currentYear, currentMonthIdx, i);
      const netProfit = data.revenue - data.materials - totalDailyWages - data.maintenance;
      days.push({ day: i, ...data, netProfit });
    }
    return days;
  }, [currentYear, currentMonthIdx, totalDailyWages, daysInMonth]);

  const activeDayData = useMemo(() => {
    if (selectedDate.month !== currentMonthIdx || selectedDate.year !== currentYear) {
      return monthDays[0]; // fallback if month changes
    }
    return monthDays.find(d => d.day === selectedDate.day) || monthDays[0];
  }, [selectedDate, currentMonthIdx, currentYear, monthDays]);

  const monthlyTotals = useMemo(() => {
    return monthDays.reduce((acc, curr) => ({
      revenue: acc.revenue + curr.revenue,
      materials: acc.materials + curr.materials,
      maintenance: acc.maintenance + curr.maintenance,
      wages: acc.wages + totalDailyWages,
      profit: acc.profit + curr.netProfit,
    }), { revenue: 0, materials: 0, maintenance: 0, wages: 0, profit: 0 });
  }, [monthDays, totalDailyWages]);

  const changeMonth = (dir: number) => {
    let newIdx = currentMonthIdx + dir;
    if (newIdx < 0) newIdx = 0;
    if (newIdx > 9) newIdx = 9; // Cap at October
    setCurrentMonthIdx(newIdx);
    // Auto-select first day of new month
    setSelectedDate({ year: currentYear, month: newIdx, day: 1 });
  };

  return (
    <div className="max-w-6xl space-y-8 font-sans">
      
      {/* ─── Page Header ──────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-slate-900 tracking-tight">Owner Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1 font-sans">Financial overview, comprehensive calendar, and workforce management.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ─── LEFT: Full Calendar ────────────────────────────────────────────── */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-50 text-teal-700 rounded-lg">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-serif text-slate-800">Financial Calendar</h2>
                <p className="text-xs text-slate-500 font-sans">Track daily profits and expenses.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-1.5 border border-slate-200">
              <button 
                onClick={() => changeMonth(-1)} 
                disabled={currentMonthIdx === 0}
                className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700" />
              </button>
              <span className="font-medium text-slate-800 text-sm min-w-[100px] text-center">
                {MONTHS[currentMonthIdx]} {currentYear}
              </span>
              <button 
                onClick={() => changeMonth(1)} 
                disabled={currentMonthIdx === 9}
                className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-5 h-5 text-slate-700" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-slate-400 uppercase py-2">
                {day}
              </div>
            ))}
            
            {/* Empty slots for days before the 1st */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square opacity-0"></div>
            ))}

            {monthDays.map((data) => {
              const isSelected = selectedDate.year === currentYear && selectedDate.month === currentMonthIdx && selectedDate.day === data.day;
              const isProfit = data.netProfit >= 0;

              return (
                <button
                  key={data.day}
                  onClick={() => setSelectedDate({ year: currentYear, month: currentMonthIdx, day: data.day })}
                  className={`relative p-2 rounded-xl flex flex-col justify-between items-center border transition-all cursor-pointer h-20 ${
                    isSelected 
                      ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-105 z-10' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-teal-300'
                  }`}
                >
                  <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-700'}`}>{data.day}</span>
                  <div className="w-full text-center mt-auto">
                    <span className={`block text-[10px] font-mono font-medium leading-none ${
                      isSelected 
                        ? (isProfit ? 'text-emerald-400' : 'text-rose-400')
                        : (isProfit ? 'text-emerald-600' : 'text-rose-600')
                    }`}>
                      {isProfit ? '+' : '-'}₹{Math.abs(Math.round(data.netProfit / 1000))}k
                    </span>
                  </div>
                </button>
              );
            })}
            
            {/* Disabled future days */}
            {Array.from({ length: totalDaysInMonth - daysInMonth }).map((_, i) => (
              <div
                key={`future-${i}`}
                className="relative p-2 rounded-xl flex flex-col justify-center items-center border border-slate-100 bg-slate-50 opacity-40 cursor-not-allowed h-20"
              >
                <span className="text-sm font-medium text-slate-400">{daysInMonth + i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── RIGHT: Daily Financial Details ─────────────────────────────────── */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
              <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-serif text-slate-800">Daily Financial Report</h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {selectedDate.day} {MONTHS[selectedDate.month]} {selectedDate.year}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-sm font-medium text-slate-600">Total Revenue (Sales)</span>
                <span className="text-lg font-medium text-slate-900">{formatCurrency(activeDayData.revenue)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-sm font-medium text-slate-600">Raw Materials Cost</span>
                <span className="text-base font-medium text-rose-600">-{formatCurrency(activeDayData.materials)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-sm font-medium text-slate-600">Total Daily Wages</span>
                <span className="text-base font-medium text-rose-600">-{formatCurrency(totalDailyWages)}</span>
              </div>
              {activeDayData.maintenance > 0 && (
                <div className="flex justify-between items-center p-4 bg-rose-50 rounded-xl border border-rose-100">
                  <span className="text-sm font-medium text-rose-700">Maintenance & Repairs</span>
                  <span className="text-base font-medium text-rose-700">-{formatCurrency(activeDayData.maintenance)}</span>
                </div>
              )}
            </div>
          </div>

          <div className={`flex justify-between items-center p-5 rounded-xl border mt-6 ${
            activeDayData.netProfit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
          }`}>
            <span className={`text-sm font-medium uppercase tracking-wider ${activeDayData.netProfit >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>Net Daily Profit</span>
            <span className={`text-2xl font-serif ${activeDayData.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatCurrency(activeDayData.netProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Workforce Link ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-serif text-slate-800">Workforce & Departments</h2>
            <p className="text-sm text-slate-500 font-sans mt-0.5">Manage all factory employees and print daily wage distributions.</p>
          </div>
        </div>
        <Link 
          href="/owner/employees"
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-sm"
        >
          <span>View Employee Directory</span>
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      {/* ─── Monthly Summary ────────────────────────────────────────────────── */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <FileText className="w-48 h-48 text-slate-800" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-2xl font-serif text-slate-800">Monthly Summary</h2>
              <p className="text-sm text-slate-500 font-sans mt-0.5">Total aggregation for {MONTHS[currentMonthIdx]} {currentYear}</p>
            </div>
            <span className="px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 font-medium text-xs tracking-wider uppercase">
              Financial Overview
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-2">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Total Revenue</p>
              <p className="text-2xl font-serif text-slate-800 break-words">{formatCurrency(monthlyTotals.revenue)}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Total Materials</p>
              <p className="text-2xl font-serif text-slate-600 break-words">-{formatCurrency(monthlyTotals.materials)}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Total Wages Paid</p>
              <p className="text-2xl font-serif text-slate-600 break-words">-{formatCurrency(monthlyTotals.wages)}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Maintenance</p>
              <p className="text-2xl font-serif text-slate-600 break-words">-{formatCurrency(monthlyTotals.maintenance)}</p>
            </div>
            <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 flex flex-col justify-center shadow-sm">
              <p className="text-xs font-medium text-indigo-800 uppercase tracking-wider mb-2">Net Monthly Profit</p>
              <p className="text-2xl font-serif text-indigo-700 truncate">{formatCurrency(monthlyTotals.profit)}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
