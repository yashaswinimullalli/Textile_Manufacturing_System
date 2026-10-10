'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Lock, ArrowRight, ShieldAlert } from 'lucide-react';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { user, isOwner, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-slate-400 text-sm">
        Verifying owner authorization...
      </div>
    );
  }

  // Strict Protection: Employees cannot see Owner modules
  if (!isOwner) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8 font-sans">
        <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 sm:p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/70 flex items-center justify-center mx-auto mb-6 shadow-xs">
            <Lock className="w-8 h-8" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
            Owner Module Restricted
          </span>

          <h1 className="text-3xl font-serif text-slate-900 tracking-tight mt-4">
            Owner Authorization Required
          </h1>

          <p className="text-sm text-slate-600 max-w-md mx-auto mt-3 leading-relaxed">
            This module is restricted exclusively to authenticated Mill Owners. Employees are not permitted to access Owner executive modules, financial data, or employee records.
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 max-w-sm mx-auto text-left">
            <p className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">Session Status</p>
            <p className="mt-1">
              {user ? (
                <span>Authenticated as <strong className="text-slate-900 font-bold">{user.name} ({user.category})</strong></span>
              ) : (
                <span className="text-amber-700 font-medium">Unauthenticated (Sign-in required)</span>
              )}
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login?role=owner&redirect=/owner"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition"
            >
              <span>Sign In as Owner</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/storekeeper/inventory"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm flex items-center justify-center gap-2 transition"
            >
              <span>Go to Employee Workspace</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-8 select-none">
      <div className="max-w-7xl mx-auto mb-4">
      </div>

      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
}
