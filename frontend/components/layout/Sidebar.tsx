'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Boxes,
  ClipboardList,
  Cpu,
  Factory,
  Package,
  Layers,
  ShieldCheck,
  Building2,
  PlusCircle,
} from 'lucide-react';


export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const isLinkActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 min-h-screen flex flex-col border-r border-slate-800">
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
          <p className="text-[11px] text-slate-400">Textile Operations Hub</p>
        </div>
      </div>

      {/* Clean, Non-Redundant Navigation */}
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {/* Module A: Storekeeper (Single Unified Workstation) */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-teal-400">
            <span>Storekeeper Module</span>
            <Package className="h-3.5 w-3.5 text-teal-500" />
          </div>
          <nav className="space-y-1">
            <Link
              href="/storekeeper/inventory"
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === '/storekeeper/inventory'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <Boxes className="h-4 w-4" />
              <span>Yarn Stock & Barcodes</span>
            </Link>
            <Link
              href="/storekeeper/quality-check"
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === '/storekeeper/quality-check' || pathname === '/quality/inspections'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="flex items-center justify-between flex-1">
                <span>Incoming Quality Check</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1 rounded font-semibold">QC</span>
              </span>
            </Link>
            <Link
              href="/storekeeper/receive-yarn"
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === '/storekeeper/receive-yarn'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <PlusCircle className="h-4 w-4" />
              <span>Receive Raw Yarn</span>
            </Link>
          </nav>
        </div>

        {/* Module B: Production Supervisor */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-sky-400">
            <span>Production Supervisor</span>
            <Layers className="h-3.5 w-3.5 text-sky-500" />
          </div>
          <nav className="space-y-1">
            <Link
              href="/production/orders"
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isLinkActive('/production/orders')
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <ClipboardList className="h-4 w-4" />
              <span>Production Orders</span>
            </Link>
            <Link
              href="/production/machines"
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isLinkActive('/production/machines')
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <Cpu className="h-4 w-4" />
              <span>Machines & Output</span>
            </Link>
          </nav>

        </div>

        {/* Plant Overview Stubs */}
        <div className="pt-2 border-t border-slate-800">
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Management Modules
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between px-3 py-2 rounded text-slate-400 bg-slate-800/30">
              <span className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-amber-500/70" />
                <span>Owner Overview</span>
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Alerts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plant Info Footer */}
      <div className="p-3 border-t border-slate-800 text-xs text-slate-400 bg-slate-950/60">
        <div className="flex items-center justify-between font-mono text-[11px]">
          <span>Plant: Surat Unit 02</span>
          <span className="text-teal-400">Shift A</span>
        </div>
      </div>
    </aside>
  );
};
