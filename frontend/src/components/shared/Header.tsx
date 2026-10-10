'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useRole } from '@/hooks';
import { 
  Layers, 
  ChevronDown, 
  ShieldCheck, 
  Briefcase,
  Truck,
  Activity
} from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { role, switchRole, actor } = useRole();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const handleRoleSelect = (targetRole: 'QUALITY_INSPECTOR' | 'OWNER' | 'DISPATCH_OFFICER', targetPath: string) => {
    switchRole(targetRole);
    setShowRoleMenu(false);
    router.push(targetPath);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white shadow-lg backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Live System Status */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-teal-400 flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-black text-xl tracking-tight text-white block leading-none">
                  FABRICTRACE
                </span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase mt-0.5 block">
                  Rule-Based ERP
                </span>
              </div>
            </Link>

            {/* Live Mill System Indicator */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>LIVE MILL SYSTEM</span>
            </div>
          </div>

          {/* Quick Direct Role Navigation & Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Quick Links for Large Screens */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                href="/quality-inspector"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  pathname.includes('quality') 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Inspector</span>
              </Link>

              <Link
                href="/owner"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  pathname.includes('owner') 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Owner</span>
              </Link>

              <Link
                href="/dispatch"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  pathname.includes('dispatch') 
                    ? 'bg-amber-600 text-white shadow-sm' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Dispatch</span>
              </Link>
            </nav>

            {/* Switch Role Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-white transition shadow-sm cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-teal-400" />
                <span>Switch Role</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-700/70 text-xs font-bold text-slate-400">
                    Select Working Role
                  </div>

                  <div className="p-1 space-y-1">
                    <button
                      onClick={() => handleRoleSelect('QUALITY_INSPECTOR', '/quality-inspector')}
                      className={`w-full text-left p-3 rounded-xl text-xs flex items-center space-x-3 transition cursor-pointer ${
                        pathname.includes('quality') ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-700/60'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-blue-400" />
                      <div>
                        <div className="font-bold">Quality Inspector</div>
                        <div className="text-[10px] text-slate-400">Barcode Scan & Defect Stamping</div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleRoleSelect('OWNER', '/owner')}
                      className={`w-full text-left p-3 rounded-xl text-xs flex items-center space-x-3 transition cursor-pointer ${
                        pathname.includes('owner') ? 'bg-purple-600 text-white' : 'text-slate-200 hover:bg-slate-700/60'
                      }`}
                    >
                      <Briefcase className="w-4 h-4 text-purple-400" />
                      <div>
                        <div className="font-bold">Owner / Accounts</div>
                        <div className="text-[10px] text-slate-400">Calendar, Receipt & Escalations</div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleRoleSelect('DISPATCH_OFFICER', '/dispatch')}
                      className={`w-full text-left p-3 rounded-xl text-xs flex items-center space-x-3 transition cursor-pointer ${
                        pathname.includes('dispatch') ? 'bg-amber-600 text-white' : 'text-slate-200 hover:bg-slate-700/60'
                      }`}
                    >
                      <Truck className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="font-bold">Dispatch Officer</div>
                        <div className="text-[10px] text-slate-400">Zero-Defect Red-Light Gate</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
