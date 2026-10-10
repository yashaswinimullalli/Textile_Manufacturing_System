'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Layers, ShieldCheck } from 'lucide-react';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-8 select-none">
      
      {/* ─── Very Subtle Back Link ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Hub</span>
        </Link>
      </div>

      {/* ─── Main Content ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto">
        {children}
      </div>

    </div>
  );
}
