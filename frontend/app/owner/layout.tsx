'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Layers, ShieldCheck } from 'lucide-react';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6 sm:p-10 space-y-8 select-none">
      
      {/* ─── Top Minimalist Header ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm flex items-center justify-between gap-4">
        
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold text-sm">Home</span>
          </Link>

          <div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-wider">
                Owner UI
              </span>
              <span className="text-xs font-bold text-slate-500">
                Zero-Click Unified Screen
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Owner / Accounts
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Live Floor Sync Active</span>
        </div>

      </div>

      {/* ─── Main Content ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto">
        {children}
      </div>

    </div>
  );
}
