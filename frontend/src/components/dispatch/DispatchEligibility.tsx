'use client';

import React from 'react';
import Link from 'next/link';
import { DispatchEligibility as DispatchEligibilityType, Roll } from '@/types/factory';
import { ShieldCheck, ShieldAlert, Truck, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';

interface DispatchEligibilityProps {
  eligibility: DispatchEligibilityType;
  roll: Roll;
}

export default function DispatchEligibility({ eligibility, roll }: DispatchEligibilityProps) {
  const { eligible, reason } = eligibility;

  return (
    <div className={`p-6 rounded-3xl border-2 transition-all shadow-md ${
      eligible
        ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
        : 'bg-rose-50 border-rose-400 text-rose-950'
    }`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start space-x-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
            eligible 
              ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-4 ring-emerald-300' 
              : 'bg-rose-600 text-white shadow-rose-600/30 ring-4 ring-rose-300'
          }`}>
            {eligible ? <CheckCircle2 className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                eligible ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}>
                {eligible ? 'TRUCK LOADING ALLOWED' : 'STOP: SHIPPING LOCKED'}
              </span>
              <span className="text-xs font-bold text-slate-500">
                Factory Safety Gate
              </span>
            </div>

            <h3 className="text-lg font-black mt-1">
              {eligible ? 'Roll Meets All Quality Standards' : 'This Roll Cannot Leave the Mill'}
            </h3>

            <p className="text-xs font-bold mt-1 text-slate-800 leading-relaxed max-w-xl">
              {reason}
            </p>

            <p className="text-[11px] text-slate-600 mt-1">
              {eligible 
                ? 'All quality standards are satisfied. Ready for shipping paperwork.'
                : 'Even if loaded by mistake, our server blocks the shipping slip automatically.'}
            </p>
          </div>
        </div>

        <div className="shrink-0 self-start md:self-center">
          <Link
            href="/dispatch"
            className={`inline-flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-black transition shadow-lg ${
              eligible
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 ring-2 ring-emerald-400/40'
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/25'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>{eligible ? 'Load onto Truck' : 'Test Shipping Gate'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
