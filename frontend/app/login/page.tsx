'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Shield,
  Building2,
  Boxes,
  Factory,
  ShieldCheck,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

const ROLE_METADATA: Record<string, { title: string; badge: string; color: string; href: string; icon: React.ElementType }> = {
  'storekeeper': {
    title: 'Inventory Manager',
    badge: 'Inventory & Stock',
    color: 'teal',
    href: '/storekeeper/inventory',
    icon: Boxes,
  },
  'production-supervisor': {
    title: 'Production Supervisor',
    badge: 'Manufacturing & Looms',
    color: 'sky',
    href: '/production/orders',
    icon: Factory,
  },
  'quality-inspector': {
    title: 'Quality Inspector',
    badge: 'Defects & Inspection',
    color: 'emerald',
    href: '/quality-inspector',
    icon: ShieldCheck,
  },
  'owner': {
    title: 'Owner',
    badge: 'Executive & Accounts',
    color: 'slate',
    href: '/owner',
    icon: Building2,
  },
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedRole = searchParams.get('role') || '';
  const redirectTarget = searchParams.get('redirect') || '';

  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const activeRoleMeta = ROLE_METADATA[selectedRole] || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    // Simulate standard brief auth response
    await new Promise((r) => setTimeout(r, 350));

    const result = login(username, password, selectedRole);

    if (!result.success) {
      setErrorMessage(result.error || 'Authentication failed. Please check your credentials.');
      setIsLoading(false);
      return;
    }

    // Determine target route based on target or selected role
    if (redirectTarget) {
      router.push(redirectTarget);
      return;
    }

    if (activeRoleMeta) {
      router.push(activeRoleMeta.href);
      return;
    }

    // Fallbacks
    if (username.toLowerCase().includes('owner')) {
      router.push('/owner');
    } else {
      router.push('/storekeeper/inventory');
    }
  };

  const handleAutofill = (type: 'owner' | 'employee') => {
    if (type === 'owner') {
      setUsername('owner@vastra.com');
      setPassword('owner123');
    } else {
      setUsername('employee@vastra.com');
      setPassword('employee123');
    }
    setErrorMessage('');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Target Workspace Banner (if selected from homepage card) */}
      {activeRoleMeta && (
        <div className="mb-6 p-4 rounded-2xl bg-white/90 border border-slate-200/90 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <activeRoleMeta.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Target Workspace</p>
              <p className="text-sm font-bold text-slate-800">{activeRoleMeta.title}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {activeRoleMeta.badge}
          </span>
        </div>
      )}

      {/* Main Login Card */}
      <div className="bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-3xl p-7 sm:p-9 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sign In</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Access your authorized Vastra terminal
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username / Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Username or Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="username-field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. owner@vastra.com or employee@vastra.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                required
              />
              <button
                type="button"
                id="toggle-password-visibility"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="login-submit-button"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span>Verifying credentials...</span>
            ) : (
              <>
                <span>Enter Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Quick-Fill Helper */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
            Demo Credentials (UI Mock Authentication)
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleAutofill('owner')}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-left transition group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800">Owner</span>
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <p className="text-[11px] text-slate-500 truncate">owner@vastra.com</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">owner123</p>
            </button>

            <button
              type="button"
              onClick={() => handleAutofill('employee')}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-left transition group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800">Employee</span>
                <Shield className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <p className="text-[11px] text-slate-500 truncate">employee@vastra.com</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">employee123</p>
            </button>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900 leading-relaxed">
            <span className="font-bold">Two Access Categories:</span>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-800 text-[10.5px]">
              <li><strong className="font-semibold">Owner:</strong> Full access to all modules + Employee records &amp; wages.</li>
              <li><strong className="font-semibold">Employee:</strong> Access to operational modules; restricted from employee wages.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#FAF8F5] text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Background Graphic Grid Texture matching homepage */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #0F172A 1px, transparent 1px),
              linear-gradient(to bottom, #0F172A 1px, transparent 1px)
            `,
            backgroundSize: '36px 36px',
          }}
        />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="absolute -top-20 -right-28 w-[28rem] h-[28rem] rounded-full bg-sky-200/25 blur-3xl" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 min-h-screen flex flex-col justify-between p-6 sm:p-10 max-w-4xl mx-auto">
        {/* Top Header & Back Button */}
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            id="back-to-homepage-button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-white text-xs font-bold shadow-2xs transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Homepage</span>
          </Link>

          <div className="text-right">
            <span className="text-sm font-black tracking-tight text-slate-900">VASTRA</span>
            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              Textile ERP
            </span>
          </div>
        </header>

        {/* Center Content with Suspense for useSearchParams */}
        <main className="my-auto py-8">
          <Suspense
            fallback={
              <div className="p-8 text-center text-sm font-semibold text-slate-400">
                Loading login station...
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </main>

        {/* Footer */}
        <footer className="pt-6 text-center text-xs font-bold text-slate-400 tracking-wider uppercase border-t border-slate-200/60">
          <span>VASTRA TEXTILE ENTERPRISE ERP • SECURITY GATEWAY</span>
        </footer>
      </div>
    </div>
  );
}
