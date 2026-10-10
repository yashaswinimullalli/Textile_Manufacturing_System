'use client';

import React, { useState } from 'react';
import { CheckCircle2, RefreshCw } from 'lucide-react';

export default function ReinspectionQueuePage() {
  const [queue, setQueue] = useState([
    { id: 'ROLL-008', type: 'Cotton Twill', issue: 'Weft Tension Slack', fixed: 'Re-Tensioned', status: 'pending' },
    { id: 'ROLL-015', type: 'Combed Cotton', issue: 'Selvedge Curl', fixed: 'Heat-Set Finished', status: 'pending' },
  ]);

  const approve = (id: string) => {
    setQueue(q => q.map(r => r.id === id ? { ...r, status: 'approved' } : r));
  };

  return (
    <div className="max-w-4xl space-y-6 font-sans">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Reinspection Queue</h2>
        <p className="text-sm text-slate-500 mt-1">Check rolls that have returned from the rework stations.</p>
      </div>

      <div className="space-y-3">
        {queue.map((item) => (
          <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-semibold text-slate-800">{item.id}</span>
                <span className="text-sm text-slate-500">{item.type}</span>
              </div>
              <div className="text-sm">
                <span className="text-red-600 font-medium">Issue: </span> <span className="text-slate-600 mr-4">{item.issue}</span>
                <span className="text-teal-600 font-medium">Repair: </span> <span className="text-slate-600">{item.fixed}</span>
              </div>
            </div>
            
            <div>
              {item.status === 'pending' ? (
                <button 
                  onClick={() => approve(item.id)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Pass Roll
                </button>
              ) : (
                <span className="px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Approved
                </span>
              )}
            </div>
          </div>
        ))}
        {queue.length === 0 && <p className="text-sm text-slate-500">No rolls pending reinspection.</p>}
      </div>
    </div>
  );
}
