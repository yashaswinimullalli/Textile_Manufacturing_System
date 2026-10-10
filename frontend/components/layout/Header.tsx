'use client';

import React from 'react';
import { Clock } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
}) => {
  if (!title && !subtitle) {
    return null;
  }

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-end sticky top-0 z-20">
      {title && (
        <div className="mr-auto">
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Simplified Status */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-xs text-slate-600 font-medium">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>Shift A: 06:00 - 14:00 IST</span>
        </div>
      </div>
    </header>
  );
};
