'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  QrCode,
  FileText,
  ShieldAlert,
  CheckCircle2,
  Truck,
  User,
  ShieldCheck
} from 'lucide-react';

const dispatchFeatures = [
  {
    href: '/dispatch',
    label: 'Gate Scanner',
    summary: 'Red-Light Lock',
    icon: QrCode,
    exact: true
  },
  {
    href: '/dispatch/shipping-manifest',
    label: 'Shipping Manifest',
    summary: 'Truck Loads',
    icon: FileText,
    exact: false
  },
  {
    href: '/dispatch/blocked-quarantine',
    label: 'Blocked Quarantine',
    summary: 'Locked Rolls',
    icon: ShieldAlert,
    exact: false
  },
  {
    href: '/dispatch/dispatch-history',
    label: 'Dispatch History',
    summary: 'Gate Passes',
    icon: CheckCircle2,
    exact: false
  }
];

export default function DispatchLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isFeatureActive = (href: string, exact: boolean) => {
    return exact ? pathname === href : pathname.startsWith(href);
  };

  return (
    <div className="space-y-6">
      
      {/* ─── Compact Dispatch Terminal Header ───────────────────────────────── */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-400/30 text-xs font-black uppercase">
              Shipping Terminal 4
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold">
              Zod Rules Armed
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Dispatch Officer Gate
          </h1>
        </div>

        {/* Dispatch Officer Profile Badge: 2-3 Word Summaries */}
        <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-800 border border-slate-700 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-amber-600/30 text-amber-400 flex items-center justify-center font-black">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-100">Vikram Rao</div>
            <div className="text-[11px] font-bold text-amber-400">Dispatch Officer</div>
            <div className="text-[10px] text-emerald-400 font-semibold">Zero-Defect Enforced</div>
          </div>
        </div>
      </div>

      {/* ─── 4 Clear Feature Buttons ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {dispatchFeatures.map((feature) => {
          const active = isFeatureActive(feature.href, feature.exact);
          const Icon = feature.icon;

          return (
            <Link
              key={feature.href}
              href={feature.href}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col justify-between group cursor-pointer ${
                active
                  ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/25 scale-[1.02]'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-amber-300 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  active ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {feature.summary}
                </span>
              </div>

              <div>
                <div className={`text-sm sm:text-base font-black tracking-tight ${active ? 'text-white' : 'text-slate-900 group-hover:text-amber-600'}`}>
                  {feature.label}
                </div>
                <div className={`text-[11px] font-bold mt-0.5 ${active ? 'text-amber-100' : 'text-slate-400'}`}>
                  Click to View
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ─── Active Feature Content ─────────────────────────────────────────── */}
      <div>
        {children}
      </div>

    </div>
  );
}
