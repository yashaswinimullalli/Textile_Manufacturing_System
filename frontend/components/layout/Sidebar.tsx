'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Factory,
  ShieldCheck,
  Building2,
  Package,
  Layers,
  Truck,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const isLinkActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 min-h-screen flex flex-col border-r border-slate-800 font-sans">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold shadow-md">
          <Factory className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-wide text-white">FabricTrace</span>
            <span className="text-[10px] bg-teal-950 text-teal-400 border border-teal-800 px-1.5 py-0.2 rounded font-semibold uppercase">
              MVP
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Modules */}
      <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        <div className="px-3 mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Core Modules
        </div>

        <Link
          href="/storekeeper/inventory"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            isLinkActive('/storekeeper')
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Package className={`h-5 w-5 ${isLinkActive('/storekeeper') ? 'text-white' : 'text-teal-400'}`} />
          <span>Storekeeper</span>
        </Link>

        <Link
          href="/production/orders"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            isLinkActive('/production')
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Layers className={`h-5 w-5 ${isLinkActive('/production') ? 'text-white' : 'text-sky-400'}`} />
          <span>Production Supervisor</span>
        </Link>

        <Link
          href="/quality-inspector"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            isLinkActive('/quality-inspector')
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <ShieldCheck className={`h-5 w-5 ${isLinkActive('/quality-inspector') ? 'text-white' : 'text-emerald-400'}`} />
          <span>Quality Inspector</span>
        </Link>

        <Link
          href="/owner"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            isLinkActive('/owner')
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Building2 className={`h-5 w-5 ${isLinkActive('/owner') ? 'text-white' : 'text-amber-400'}`} />
          <span>Owner / Accounts</span>
        </Link>

        <Link
          href="/dispatch"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            isLinkActive('/dispatch')
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Truck className={`h-5 w-5 ${isLinkActive('/dispatch') ? 'text-white' : 'text-indigo-400'}`} />
          <span>Dispatch Hub</span>
        </Link>
      </div>

      {/* Plant Info Footer */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-400 bg-slate-950/60">
        <div className="flex items-center justify-between font-mono text-[11px]">
          <span>Plant: Surat Unit 02</span>
          <span className="text-teal-400">Shift A</span>
        </div>
      </div>
    </aside>
  );
};
