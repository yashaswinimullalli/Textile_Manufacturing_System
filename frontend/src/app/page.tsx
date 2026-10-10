'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Briefcase, Layers } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-between p-6 sm:p-12 font-sans select-none">
      
      {/* Simple Clean Logo at the Top */}
      <div className="pt-4 flex items-center space-x-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
          <Layers className="w-7 h-7" />
        </div>
        <span className="font-black text-3xl tracking-tight text-slate-900">
          FABRICTRACE
        </span>
      </div>

      {/* Exactly TWO Giant, Wide Buttons in the Dead Center */}
      <div className="w-full max-w-4xl flex flex-col gap-8 my-auto">
        
        {/* Button 1: Quality & Dispatch (Light Gray, Giant Tap Target) */}
        <Link 
          href="/quality-inspector" 
          className="w-full bg-slate-100 hover:bg-slate-200 active:scale-[0.99] text-slate-900 border-4 border-slate-300 p-8 sm:p-12 rounded-3xl shadow-xl transition-all flex items-center justify-center space-x-6 cursor-pointer"
        >
          <Search className="w-12 h-12 sm:w-16 sm:h-16 text-slate-700 shrink-0" />
          <span className="text-3xl sm:text-5xl font-black tracking-tight">
            Quality & Dispatch
          </span>
        </Link>

        {/* Button 2: Owner / Accounts (Dark Blue, Giant Tap Target) */}
        <Link 
          href="/owner" 
          className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white border-4 border-slate-900 p-8 sm:p-12 rounded-3xl shadow-2xl transition-all flex items-center justify-center space-x-6 cursor-pointer"
        >
          <Briefcase className="w-12 h-12 sm:w-16 sm:h-16 text-white shrink-0" />
          <span className="text-3xl sm:text-5xl font-black tracking-tight">
            Owner / Accounts
          </span>
        </Link>

      </div>

      {/* Empty Balanced Bottom Anchor */}
      <div className="pb-4 text-xs font-bold text-slate-300 tracking-wider">
        TEXTILE MANUFACTURING PLATFORM
      </div>

    </div>
  );
}
