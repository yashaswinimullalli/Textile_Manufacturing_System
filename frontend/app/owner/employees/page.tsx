'use client';

import React, { useState } from 'react';
import { 
  Users,
  Briefcase,
  Printer,
  ChevronLeft,
  Building
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/formatters';

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

export default function EmployeeDirectory() {
  const [activeDeptIndex, setActiveDeptIndex] = useState<number | 'ALL'>('ALL');

  const handlePrint = () => {
    window.print();
  };

  const displayedDepartments = activeDeptIndex === 'ALL' 
    ? DEPARTMENTS 
    : [DEPARTMENTS[activeDeptIndex]];

  return (
    <div className="max-w-6xl font-sans print:p-0">
      
      {/* ─── Non-Printable Header & Controls ─────────────────────────────────── */}
      <div className="mb-8 print:hidden flex flex-col md:flex-row md:items-end justify-between gap-6 mt-2">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Employee Directory</h1>
              <p className="text-sm text-slate-500 mt-1">Detailed view of workforce salaries and departments.</p>
            </div>
          </div>
        </div>

        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Print Directory</span>
        </button>
      </div>

      {/* ─── Non-Printable Filter ────────────────────────────────────────────── */}
      <div className="mb-8 print:hidden bg-white p-2 rounded-xl border border-slate-200 shadow-sm inline-flex flex-wrap gap-2">
        <button
          onClick={() => setActiveDeptIndex('ALL')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeDeptIndex === 'ALL'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Departments
        </button>
        {DEPARTMENTS.map((dept, idx) => (
          <button
            key={dept.name}
            onClick={() => setActiveDeptIndex(idx)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeDeptIndex === idx
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building className="w-4 h-4 opacity-50" />
            {dept.name}
          </button>
        ))}
      </div>

      {/* ─── Printable Content ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:rounded-none overflow-hidden">
        
        {/* Print Only Header */}
        <div className="hidden print:block p-8 border-b border-slate-200">
          <h1 className="text-2xl font-black text-slate-900">FabricTrace Employee Directory</h1>
          <p className="text-slate-500 mt-1">Generated on: {new Date().toLocaleDateString()}</p>
        </div>

        {displayedDepartments.map((dept, idx) => {
          const deptTotal = dept.employees.reduce((acc, emp) => acc + emp.wage, 0);

          return (
            <div key={dept.name} className={`${idx !== 0 ? 'border-t border-slate-200 print:break-before-page' : ''}`}>
              <div className="bg-slate-50 p-6 border-b border-slate-200 flex items-center justify-between print:bg-transparent print:border-b-2 print:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg print:hidden">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{dept.name} Department</h2>
                    <p className="text-sm text-slate-500">{dept.employees.length} Active Employees</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Dept Daily Wage</span>
                  <span className="text-xl font-black text-indigo-700">{formatCurrency(deptTotal)}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="py-4 px-6 font-bold uppercase tracking-wider text-xs">Employee Name</th>
                      <th className="py-4 px-6 font-bold uppercase tracking-wider text-xs">Role</th>
                      <th className="py-4 px-6 font-bold uppercase tracking-wider text-xs text-right">Daily Wage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dept.employees.map((emp, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors print:hover:bg-white">
                        <td className="py-4 px-6 font-semibold text-slate-800 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs print:hidden border border-slate-200">
                            {emp.name.charAt(0)}
                          </div>
                          {emp.name}
                        </td>
                        <td className="py-4 px-6 text-slate-600 font-medium">{emp.role}</td>
                        <td className="py-4 px-6 text-slate-800 font-mono font-medium text-right">
                          {formatCurrency(emp.wage)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
