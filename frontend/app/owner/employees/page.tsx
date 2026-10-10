'use client';

import React, { useState } from 'react';
import { 
  Users,
  Briefcase,
  Printer,
  Building,
  Phone,
  MapPin
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/formatters';

const DEPARTMENTS = [
  {
    name: 'Spinning',
    employees: [
      { name: 'Ramesh Patel', role: 'Machine Operator', wage: 850, phone: '+91 98765 43210', city: 'Surat' },
      { name: 'Suresh Kumar', role: 'Machine Operator', wage: 850, phone: '+91 98765 43211', city: 'Surat' },
      { name: 'Amit Singh', role: 'Technician', wage: 1100, phone: '+91 98765 43212', city: 'Ahmedabad' },
      { name: 'Vijay Sharma', role: 'Helper', wage: 600, phone: '+91 98765 43213', city: 'Navsari' },
      { name: 'Pramod Desai', role: 'Supervisor', wage: 1400, phone: '+91 98765 43214', city: 'Surat' },
    ]
  },
  {
    name: 'Weaving',
    employees: [
      { name: 'Rajesh Verma', role: 'Loom Operator', wage: 900, phone: '+91 98765 43215', city: 'Surat' },
      { name: 'Sunil Das', role: 'Loom Operator', wage: 900, phone: '+91 98765 43216', city: 'Surat' },
      { name: 'Anil Gupta', role: 'Technician', wage: 1150, phone: '+91 98765 43217', city: 'Bharuch' },
      { name: 'Hari Om', role: 'Supervisor', wage: 1400, phone: '+91 98765 43218', city: 'Surat' },
    ]
  },
  {
    name: 'Dyeing',
    employees: [
      { name: 'Arun Bhatia', role: 'Master Dyer', wage: 1600, phone: '+91 98765 43219', city: 'Vapi' },
      { name: 'Vikas Jain', role: 'Chemical Mixer', wage: 1000, phone: '+91 98765 43220', city: 'Surat' },
      { name: 'Deepak Rao', role: 'Machine Operator', wage: 900, phone: '+91 98765 43221', city: 'Surat' },
      { name: 'Murali M', role: 'Washing Tech', wage: 800, phone: '+91 98765 43222', city: 'Navsari' },
    ]
  },
  {
    name: 'Quality Inspection',
    employees: [
      { name: 'Alex Kumar', role: 'Lead Inspector', wage: 1200, phone: '+91 98765 43223', city: 'Ahmedabad' },
      { name: 'Priya Sharma', role: 'Inspector', wage: 950, phone: '+91 98765 43224', city: 'Surat' },
      { name: 'Meera Patel', role: 'Lab Analyst', wage: 1100, phone: '+91 98765 43225', city: 'Surat' },
    ]
  },
  {
    name: 'Machine Monitoring',
    employees: [
      { name: 'Ravi Teja', role: 'IoT Analyst', wage: 1300, phone: '+91 98765 43226', city: 'Surat' },
      { name: 'Karthik N', role: 'Systems Tech', wage: 1100, phone: '+91 98765 43227', city: 'Pune' },
      { name: 'Sneha Joshi', role: 'Control Room Op', wage: 950, phone: '+91 98765 43228', city: 'Surat' },
    ]
  },
  {
    name: 'Logistics & Delivery',
    employees: [
      { name: 'Bhavin Shah', role: 'Fleet Manager', wage: 1400, phone: '+91 98765 43229', city: 'Surat' },
      { name: 'Rahim Khan', role: 'Driver', wage: 800, phone: '+91 98765 43230', city: 'Bharuch' },
      { name: 'Mohan Lal', role: 'Driver', wage: 800, phone: '+91 98765 43231', city: 'Vapi' },
      { name: 'Jagdish C', role: 'Loader', wage: 600, phone: '+91 98765 43232', city: 'Surat' },
    ]
  },
  {
    name: 'Designers',
    employees: [
      { name: 'Aisha Singh', role: 'Lead Designer', wage: 1800, phone: '+91 98765 43233', city: 'Mumbai' },
      { name: 'Pooja Reddy', role: 'Textile Artist', wage: 1400, phone: '+91 98765 43234', city: 'Surat' },
      { name: 'Rohan Gupta', role: 'CAD Specialist', wage: 1200, phone: '+91 98765 43235', city: 'Surat' },
    ]
  },
  {
    name: 'Facility & Cleaners',
    employees: [
      { name: 'Kanti Bhai', role: 'Facility Head', wage: 900, phone: '+91 98765 43236', city: 'Surat' },
      { name: 'Raju Pandit', role: 'Cleaner', wage: 500, phone: '+91 98765 43237', city: 'Navsari' },
      { name: 'Sita Devi', role: 'Cleaner', wage: 500, phone: '+91 98765 43238', city: 'Surat' },
    ]
  }
];

export default function EmployeeDirectory() {
  const [activeDeptIndex, setActiveDeptIndex] = useState<number>(0);

  const handlePrint = () => {
    window.print();
  };

  const activeDept = DEPARTMENTS[activeDeptIndex];
  const deptTotal = activeDept.employees.reduce((acc, emp) => acc + emp.wage, 0);

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
            <p className="text-sm text-slate-500 mt-1 font-sans">Detailed employee records, contact info, and salaries.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* ─── Left Sidebar Navigation ────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-2 print:hidden">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4 px-2 font-sans">Departments</h2>
          {DEPARTMENTS.map((dept, idx) => (
            <button
              key={dept.name}
              onClick={() => setActiveDeptIndex(idx)}
              className={`w-full text-left px-4 py-3.5 rounded-xl text-base transition-all flex items-center justify-between group ${
                activeDeptIndex === idx
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <Building className={`w-4 h-4 ${activeDeptIndex === idx ? 'opacity-100 text-slate-300' : 'opacity-50 group-hover:text-slate-800'}`} />
                <span className="font-serif">{dept.name}</span>
              </div>
              <span className={`text-xs font-sans px-2 py-0.5 rounded-full ${
                activeDeptIndex === idx ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-400'
              }`}>
                {dept.employees.length}
              </span>
            </button>
          ))}
        </div>

        {/* ─── Right Content Area ─────────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:rounded-none overflow-hidden">
            
            {/* Print Only Header */}
            <div className="hidden print:block p-8 border-b border-slate-200">
              <h1 className="text-3xl font-serif text-slate-900">FabricTrace Workforce Roster</h1>
              <p className="text-slate-500 mt-1 font-sans">Generated on: {new Date().toLocaleDateString()}</p>
            </div>

            {/* Department Info Header */}
            <div className="bg-slate-50 p-6 sm:p-8 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6 print:bg-transparent print:border-b-2 print:border-slate-800">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white border border-slate-200 text-slate-700 rounded-xl print:hidden shadow-sm">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-serif text-slate-900">{activeDept.name} Department</h2>
                  <p className="text-sm text-slate-500 mt-1 font-sans">{activeDept.employees.length} Active Employees enrolled</p>
                </div>
              </div>
              <div className="text-left sm:text-right bg-white sm:bg-transparent p-4 sm:p-0 rounded-xl border border-slate-200 sm:border-none">
                <span className="block text-xs font-medium text-slate-400 uppercase tracking-widest font-sans mb-1">Dept Daily Wage</span>
                <span className="text-2xl font-serif text-slate-800">{formatCurrency(deptTotal)}</span>
              </div>
            </div>

            {/* Interactive Grid (Screen Only) */}
            <div className="print:hidden p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">
              {activeDept.employees.map((emp, i) => (
                <div 
                  key={i} 
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:-translate-y-1 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start gap-4 mb-5">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center font-serif text-lg border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors shrink-0">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-serif text-lg text-slate-800">{emp.name}</h3>
                        <p className="text-sm text-slate-500 font-medium">{emp.role}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">{emp.phone}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">{emp.city}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider font-sans">Daily Wage</span>
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
                    <th className="py-5 px-6 font-medium uppercase tracking-wider text-xs">Employee Details</th>
                    <th className="py-5 px-6 font-medium uppercase tracking-wider text-xs">Contact & Location</th>
                    <th className="py-5 px-6 font-medium uppercase tracking-wider text-xs text-right">Daily Wage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeDept.employees.map((emp, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-serif text-base text-slate-800">{emp.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5 font-medium">{emp.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6 align-middle">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="w-4 h-4 text-slate-400" />
                            {emp.phone}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            {emp.city}
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6 align-middle text-right">
                        <span className="text-base font-serif text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
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
      </div>
    </div>
  );
}
