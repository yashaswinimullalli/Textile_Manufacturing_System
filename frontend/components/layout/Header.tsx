'use client';

import React from 'react';
import { Clock, ShieldAlert, Cpu } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
}) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-end sticky top-0 z-20">
      {title && (
        <div className="mr-auto">
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Status pill: Shift Info */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-xs text-slate-600 font-medium">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>Shift A: 06:00 - 14:00 IST</span>
        </div>

        {/* Live system state */}
        <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-full text-xs text-teal-800 font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
          </span>
          <span className="hidden sm:inline">Backend REST:</span> Active
        </div>

        {/* Quick Plant Badge */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
          <Cpu className="h-4 w-4 text-slate-500" />
          <span>5 Looms Online</span>
        </div>
      </div>
    </header>
  );
};
