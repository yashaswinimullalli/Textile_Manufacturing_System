'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  BarChart2,
  RefreshCw,
  TrendingUp,
  User,
  Activity
} from 'lucide-react';

const features = [
  {
    href: '/quality-inspector',
    label: 'Fabric Checking',
    summary: 'Roll Stamping',
    icon: ShieldCheck,
    exact: true
  },
  {
    href: '/quality-inspector/defect-analysis',
    label: 'Defect Analysis',
    summary: 'Flaw Metrics',
    icon: BarChart2,
    exact: false
  },
  {
    href: '/quality-inspector/reinspection-queue',
    label: 'Reinspection Queue',
    summary: 'Rework Rolls',
    icon: RefreshCw,
    exact: false
  },
  {
    href: '/quality-inspector/shift-performance',
    label: 'Shift Performance',
    summary: 'Hourly Output',
    icon: TrendingUp,
    exact: false
  }
];

export default function QualityInspectorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isFeatureActive = (href: string, exact: boolean) => {
    return exact ? pathname === href : pathname.startsWith(href);
  };

  return (
    <div className="space-y-6">
      
      {/* ─── Compact Station Header ─────────────────────────────────────────── */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-400/30 text-xs font-black uppercase">
              Station Terminal 1
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold">
              Shift: Morning A
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Quality Inspector Desk
          </h1>
        </div>

        {/* Inspector Profile Badge: 2-3 Word Summaries */}
        <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-800 border border-slate-700 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center font-black">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-100">Alex Kumar</div>
            <div className="text-[11px] font-bold text-blue-400">Inspector Active</div>
            <div className="text-[10px] text-slate-400">Online • Auto-Sync</div>
          </div>
        </div>
      </div>

      {/* ─── 4 Clear Feature Buttons ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {features.map((feature) => {
          const active = isFeatureActive(feature.href, feature.exact);
          const Icon = feature.icon;

          return (
            <Link
              key={feature.href}
              href={feature.href}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col justify-between group cursor-pointer ${
                active
                  ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/25 scale-[1.02]'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-300 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  active ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors'
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
                <div className={`text-sm sm:text-base font-black tracking-tight ${active ? 'text-white' : 'text-slate-900 group-hover:text-blue-600'}`}>
                  {feature.label}
                </div>
                <div className={`text-[11px] font-bold mt-0.5 ${active ? 'text-blue-100' : 'text-slate-400'}`}>
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
