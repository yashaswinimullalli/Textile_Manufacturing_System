'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Package,
  Factory,
  ShieldCheck,
  Building2,
  Truck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  const isLinkActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 min-h-screen flex flex-col border-r border-slate-800 font-sans select-none shrink-0">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <Link href="/" className="font-black text-xl tracking-wider text-white hover:text-teal-400 transition-colors">
          VASTRA
        </Link>
      </div>

      {/* Main Navigation - Non-Scrollable */}
      <div className="flex-1 py-6 px-3 space-y-2 overflow-hidden">
        <div className="px-3 mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Core Modules
        </div>

        {/* 1. Inventory Manager */}
        <Link
          href="/storekeeper/inventory"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            pathname === '/storekeeper' || pathname.startsWith('/storekeeper/inventory')
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Package className={`h-5 w-5 ${pathname === '/storekeeper' || pathname.startsWith('/storekeeper/inventory') ? 'text-white' : 'text-teal-400'}`} />
          <span>Inventory Manager</span>
        </Link>

        {/* 2. Quality Inspector - Raw Material (Yarn) */}
        <Link
          href="/storekeeper/quality-check"
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            pathname === '/storekeeper/quality-check' || pathname.startsWith('/quality/inspections')
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <ShieldCheck className={`h-5 w-5 shrink-0 ${pathname === '/storekeeper/quality-check' || pathname.startsWith('/quality/inspections') ? 'text-white' : 'text-emerald-400'}`} />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold leading-tight">Quality Inspector</span>
            <span className={`text-[11px] leading-tight ${
              pathname === '/storekeeper/quality-check' || pathname.startsWith('/quality/inspections')
                ? 'text-teal-100'
                : 'text-slate-400'
            }`}>
              Raw Material (Yarn)
            </span>
          </div>
        </Link>

        {/* 3. Production Supervisor */}
        <Link
          href="/production/orders"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            pathname.startsWith('/production')
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Factory className={`h-5 w-5 ${pathname.startsWith('/production') ? 'text-white' : 'text-sky-400'}`} />
          <span>Production Supervisor</span>
        </Link>

        {/* 4. Quality Inspector (Floor) */}
        <Link
          href="/quality-inspector"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            pathname === '/quality-inspector'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <ShieldCheck className={`h-5 w-5 ${pathname === '/quality-inspector' ? 'text-white' : 'text-emerald-400'}`} />
          <span>Quality Inspector</span>
        </Link>

        {/* 5. Owner / Accounts (Visible to Owner, hidden from Employees) */}
        {user?.category !== 'employee' && (
          <Link
            href="/owner"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith('/owner')
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Building2 className={`h-5 w-5 ${pathname.startsWith('/owner') ? 'text-white' : 'text-amber-400'}`} />
            <span>Owner / Accounts</span>
          </Link>
        )}

        {/* 6. Dispatch Hub */}
        <Link
          href="/dispatch"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            pathname.startsWith('/dispatch')
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Truck className={`h-5 w-5 ${pathname.startsWith('/dispatch') ? 'text-white' : 'text-indigo-400'}`} />
          <span>Dispatch Hub</span>
        </Link>
      </div>
    </aside>
  );
};
