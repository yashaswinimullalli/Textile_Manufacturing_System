'use client';

import React from 'react';

const shiftData = [
  { name: 'Alex Kumar', rolls: 48, passRate: '91.7%', time: '9.2 min' },
  { name: 'Priya Sharma', rolls: 44, passRate: '93.2%', time: '9.8 min' },
  { name: 'Rohan Verma', rolls: 39, passRate: '89.5%', time: '11.1 min' },
];

export default function ShiftPerformancePage() {
  return (
    <div className="max-w-4xl space-y-6 font-sans">
      <div className="mb-6">
        <h2 className="text-xl font-medium text-slate-800">Shift Performance</h2>
        <p className="text-sm text-slate-500 mt-1">Inspector productivity and accuracy metrics for the current shift.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
            <tr>
              <th className="py-3 px-6 font-medium">Inspector Name</th>
              <th className="py-3 px-6 font-medium">Rolls Checked</th>
              <th className="py-3 px-6 font-medium">Pass Rate</th>
              <th className="py-3 px-6 font-medium">Avg Time/Roll</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shiftData.map((s) => (
              <tr key={s.name} className="hover:bg-slate-50">
                <td className="py-4 px-6 font-medium text-slate-800">{s.name}</td>
                <td className="py-4 px-6 text-slate-600">{s.rolls}</td>
                <td className="py-4 px-6 text-teal-600 font-medium">{s.passRate}</td>
                <td className="py-4 px-6 text-slate-600">{s.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
