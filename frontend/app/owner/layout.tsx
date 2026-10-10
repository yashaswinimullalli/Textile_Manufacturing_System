'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Layers, ShieldCheck } from 'lucide-react';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6 sm:p-10 space-y-8 select-none">
      
      {/* ─── Top Minimalist Header ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        <Link
          href="/"
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-semibold text-sm">Back</span>
        </Link>
      </div>

      {/* ─── Main Content ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto">
        {children}
      </div>

    </div>
  );
}
