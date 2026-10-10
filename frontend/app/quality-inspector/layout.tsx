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
          <Link href="/" className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition flex items-center gap-1.5 text-sm font-medium cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                Quality Inspector
              </span>
              <span className="text-xs text-slate-400">Morning A · Station 1</span>
            </div>
            <h1 className="text-lg font-serif text-slate-900 mt-0.5">Inspection Desk</h1>
          </div>
        </div>

        {/* Inspector badge */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-800 leading-none">Alex Kumar</p>
            <p className="text-[10px] text-teal-600 mt-0.5">Inspector · Active</p>
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
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
