'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  QrCode,
  FileText,
  ShieldAlert,
  CheckCircle2,
  User,
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
    <div className="space-y-6 font-sans">
      
      {/* ─── Minimalist Header ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium tracking-wide uppercase">
              Shipping Terminal 4
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-slate-900 tracking-tight">
            Dispatch Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage shipments, view manifest, and secure gate passes.</p>
        </div>

        {/* Dispatch Officer Profile */}
        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 shrink-0">
          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-800">Vikram Rao</div>
            <div className="text-xs text-slate-500">Dispatch Officer</div>
          </div>
        </div>
      </div>

      {/* ─── Minimal Feature Navigation ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {dispatchFeatures.map((feature) => {
          const active = isFeatureActive(feature.href, feature.exact);
          const Icon = feature.icon;

          return (
            <Link
              key={feature.href}
              href={feature.href}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between group cursor-pointer ${
                active
                  ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                  : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-lg flex items-center justify-center ${
                  active ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-50 text-slate-500 group-hover:bg-slate-100 group-hover:text-slate-700 transition-colors'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div>
                <div className={`text-base font-serif tracking-tight ${active ? 'text-indigo-900' : 'text-slate-800'}`}>
                  {feature.label}
                </div>
                <div className={`text-xs mt-1 ${active ? 'text-indigo-600/70' : 'text-slate-400'}`}>
                  {feature.summary}
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
