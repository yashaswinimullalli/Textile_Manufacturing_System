'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  Building2,
  Package,
  Layers,
  Truck,
  ClipboardList,
  Cpu,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isLinkActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 min-h-screen flex flex-col border-r border-slate-800 font-sans">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <Link href="/" className="font-black text-xl tracking-wider text-white hover:text-teal-400 transition-colors">
          VASTRA
        </Link>
      </div>

      {/* Main Navigation Modules */}
      <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        <div className="px-3 mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Core Modules
        </div>

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

        {/* Quality Inspector of Raw Material */}
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

        {/* Production Supervisor Section */}
        <div className="space-y-1">
          <div className="px-3 pt-2 pb-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-sky-400">
            <span className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-sky-400" />
              <span>Production Supervisor</span>
            </span>
          </div>
          <div className="space-y-1 pl-1">
            <Link
              href="/production/orders"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/production/orders' || pathname.startsWith('/production/orders')
                  ? 'bg-teal-600 text-white font-semibold shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ClipboardList className={`h-4 w-4 ${pathname.startsWith('/production/orders') ? 'text-white' : 'text-sky-400'}`} />
              <span>Production Orders</span>
            </Link>

            <Link
              href="/production/machines"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith('/production/machines') || pathname.startsWith('/production/machine-events')
                  ? 'bg-teal-600 text-white font-semibold shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Cpu className={`h-4 w-4 ${pathname.startsWith('/production/machines') || pathname.startsWith('/production/machine-events') ? 'text-white' : 'text-teal-400'}`} />
              <span>Machine Floor</span>
            </Link>
          </div>
        </div>

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

        {/* Owner Module Link (Visible to Owner, hidden from Employees) */}
        {user?.category !== 'employee' && (
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
        )}

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

      {/* User Session & Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between gap-2 px-1 py-1">
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-slate-200 truncate">
              {user ? user.name : 'Vastra Operator'}
            </span>
            <span className="text-[10px] text-teal-400 font-mono uppercase tracking-wide">
              {user ? (user.category === 'owner' ? 'Owner Access' : 'Employee Access') : 'Demo Mode'}
            </span>
          </div>
          {user ? (
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-slate-800 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <Link
              href="/login"
              className="text-[11px] font-semibold text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 transition"
            >
              Sign In
            </Link>
          )}
        </div>
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
