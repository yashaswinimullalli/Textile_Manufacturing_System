'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { formatDate, getFriendlyFlawName } from '@/lib/formatters';
import { RefreshCw, ArrowRight, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import LoadingState from '../shared/LoadingState';

interface ReinspectionQueueProps {
  basePath?: string;
}

export default function ReinspectionQueue({ basePath = '/rolls' }: ReinspectionQueueProps) {
  const [queue, setQueue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      setIsLoading(true);
      const res = await api.getReinspectionQueue();
      setQueue(res.queue || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading rolls waiting for re-check..." />;
  }

  if (queue.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
        <h3 className="text-base font-medium text-slate-900">Reinspection Queue is Clear</h3>
        <p className="text-xs text-slate-500 mt-1">No fabric rolls are currently awaiting post-repair quality evaluation.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-medium">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-slate-900">Rolls Returned for Re-check</h2>
            <p className="text-xs text-slate-500">Fabric rolls washed or repaired on the floor that require a second inspector check</p>
          </div>
        </div>
        <span className="px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-medium border border-amber-300 self-start">
          {queue.length} Rolls Waiting
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {queue.map(({ roll, order, latest_inspection }) => (
          <div key={roll.id} className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 rounded-2xl p-3 transition">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2.5">
                <span className="font-mono font-medium text-base text-slate-900">{roll.roll_code}</span>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-medium uppercase bg-amber-100 text-amber-900">
                  ON HOLD FOR REWORK
                </span>
                <span className="text-xs text-slate-600 font-medium">• {roll.fabric_type}</span>
              </div>
              <div className="text-xs text-slate-600 font-medium">
                Customer: <strong className="text-slate-900">{order?.customer_reference || 'Standard'}</strong> ({order?.order_code || roll.order_id}) • 
                Length: <strong className="text-slate-900">{roll.produced_quantity} {roll.unit}</strong>
              </div>
              {latest_inspection && (
                <div className="text-xs text-rose-700 flex items-center space-x-1.5 font-medium bg-rose-50 p-2 rounded-xl border border-rose-200">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Prior Flaw: {getFriendlyFlawName(latest_inspection.defect_type)} ({latest_inspection.affected_quantity}m damaged) — "{latest_inspection.notes}"</span>
                </div>
              )}
            </div>

            <Link
              href={`${basePath === '/rolls' ? '' : basePath}/rolls/${roll.roll_code}/inspect`}
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-md shadow-blue-600/25 transition shrink-0 self-start sm:self-center"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Check Fabric Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
