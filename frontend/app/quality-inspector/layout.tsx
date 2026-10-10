'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, BarChart2, RefreshCw, TrendingUp, User, ArrowLeft } from 'lucide-react';

const features = [
  { href: '/quality-inspector', label: 'Stage Inspection', summary: 'Inspect Stages', icon: ShieldCheck, exact: true },
  { href: '/quality-inspector/defect-analysis', label: 'Defect Analysis', summary: 'Flaw Metrics', icon: BarChart2, exact: false },
  { href: '/quality-inspector/reinspection-queue', label: 'Reinspection Queue', summary: 'Rework Rolls', icon: RefreshCw, exact: false },
  { href: '/quality-inspector/shift-performance', label: 'Shift Performance', summary: 'Hourly Output', icon: TrendingUp, exact: false },
];

export default function QualityInspectorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string, exact: boolean) => exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-3xl font-serif text-slate-900 tracking-tight">Inspection Desk</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-slate-500">Morning A · Station 1</span>
            </div>
          </div>
        </div>

        {/* Inspector badge */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm shrink-0">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800 leading-none">Alex Kumar</p>
            <p className="text-xs text-teal-600 mt-1">Inspector · Active</p>
          </div>
        </div>
      </div>

      {/* ─── 4 Feature Nav Buttons ───────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="flex gap-2 flex-wrap">
          {features.map((f) => {
            const active = isActive(f.href, f.exact);
            const Icon = f.icon;
            return (
              <Link
                key={f.href}
                href={f.href}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  active
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {f.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ─── Page Content ────────────────────────────────────────────────── */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
