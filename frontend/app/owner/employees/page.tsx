'use client';

import React from 'react';
import { 
  Users,
  Briefcase,
  Printer,
  Pencil
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

const EMPLOYEES = [
  { name: 'Ramesh Patel', role: 'Machine Operator', wage: 850 },
  { name: 'Amit Singh', role: 'Technician', wage: 1100 },
  { name: 'Pramod Desai', role: 'Supervisor', wage: 1400 },
  { name: 'Rajesh Verma', role: 'Loom Operator', wage: 900 },
  { name: 'Anil Gupta', role: 'Technician', wage: 1150 },
  { name: 'Arun Bhatia', role: 'Master Dyer', wage: 1600 },
  { name: 'Alex Kumar', role: 'Lead Inspector', wage: 1200 },
  { name: 'Meera Patel', role: 'Lab Analyst', wage: 1100 },
  { name: 'Ravi Teja', role: 'IoT Analyst', wage: 1300 },
  { name: 'Aisha Singh', role: 'Lead Designer', wage: 1800 },
];

export default function EmployeeDirectory() {
  const handlePrint = () => {
    window.print();
  };

  const totalWage = EMPLOYEES.reduce((acc, emp) => acc + emp.wage, 0);

  return (
    <div className="max-w-7xl font-sans print:p-0 text-slate-800">
      
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="mb-10 print:hidden flex flex-col md:flex-row md:items-end justify-between gap-6 mt-2">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-slate-100 text-slate-700 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-serif text-slate-900 tracking-tight">Workforce Roster</h1>
            <p className="text-sm text-slate-500 mt-1 font-sans">Essential employee records and daily wages.</p>
          </div>
        </div>

        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all shadow-sm font-sans"
        >
          <Printer className="w-4 h-4" />
          <span>Print Details</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:rounded-none overflow-hidden">
        
        {/* Print Only Header */}
        <div className="hidden print:block p-8 border-b border-slate-200">
          <h1 className="text-3xl font-serif text-slate-900">FabricTrace Workforce Roster</h1>
          <p className="text-slate-500 mt-1 font-sans">Generated on: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Total Info Header */}
        <div className="bg-slate-50 p-6 sm:p-8 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6 print:bg-transparent print:border-b-2 print:border-slate-800">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white border border-slate-200 text-slate-700 rounded-xl print:hidden shadow-sm">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-serif text-slate-900">All Employees</h2>
              <p className="text-sm text-slate-500 mt-1 font-sans">{EMPLOYEES.length} Active Employees enrolled</p>
            </div>
          </div>
          <div className="text-left sm:text-right bg-white sm:bg-transparent p-4 sm:p-0 rounded-xl border border-slate-200 sm:border-none">
            <span className="block text-xs font-medium text-slate-400 uppercase tracking-widest font-sans mb-1">Total Daily Wage</span>
            <span className="text-2xl font-serif text-slate-800">{formatCurrency(totalWage)}</span>
          </div>
        </div>

        {/* Interactive Grid (Screen Only) */}
        <div className="print:hidden p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50/50">
          {EMPLOYEES.map((emp, i) => (
            <div 
              key={i} 
              className="relative bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:-translate-y-1 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 group flex flex-col justify-between"
            >
              <button className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition opacity-0 group-hover:opacity-100" title="Edit Employee">
                <Pencil className="w-4 h-4" />
              </button>

              <div>
                <div className="flex flex-col items-center text-center gap-4 mb-5">
                  <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center font-serif text-2xl border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors shrink-0">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-slate-800">{emp.name}</h3>
                    <p className="text-sm text-slate-500 font-medium">{emp.role}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider font-sans">Wage</span>
                <span className="text-lg font-serif text-indigo-700 font-medium">
                  {formatCurrency(emp.wage)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Print Table (Print Only) */}
        <div className="hidden print:block overflow-x-auto">
          <table className="w-full text-left font-sans">
            <thead className="bg-white border-b border-slate-200 text-slate-400">
              <tr>
                <th className="py-5 px-6 font-medium uppercase tracking-wider text-xs">Employee Name</th>
                <th className="py-5 px-6 font-medium uppercase tracking-wider text-xs">Role</th>
                <th className="py-5 px-6 font-medium uppercase tracking-wider text-xs text-right">Daily Wage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {EMPLOYEES.map((emp, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-5 px-6 font-serif text-base text-slate-800">{emp.name}</td>
                  <td className="py-5 px-6 font-medium text-slate-500 text-sm">{emp.role}</td>
                  <td className="py-5 px-6 align-middle text-right">
                    <span className="text-base font-serif text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 inline-block text-center min-w-[80px]">
                      {formatCurrency(emp.wage)}
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
