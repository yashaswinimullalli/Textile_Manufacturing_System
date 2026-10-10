'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { DemoRole } from '@/types/factory';
import { DEMO_ACTORS } from '@/lib/permissions';
import { Layers, ShieldCheck, BarChart3, Truck, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';

const ROLES: { role: DemoRole; label: string; title: string; description: string; color: string; icon: React.ElementType }[] = [
  {
    role: 'QUALITY_INSPECTOR',
    label: 'Alex Kumar',
    title: 'Quality Inspector',
    description: 'Scan rolls, enter defects, record Pass / Rework / Reject decisions on the factory floor.',
    color: 'blue',
    icon: ShieldCheck
  },
  {
    role: 'OWNER',
    label: 'Sarah Chen',
    title: 'Mill Owner / Accounts Manager',
    description: 'Monitor order progress, review alerts, track costs and quality performance metrics.',
    color: 'purple',
    icon: BarChart3
  },
  {
    role: 'DISPATCH_OFFICER',
    label: 'Rajesh V',
    title: 'Dispatch & Logistics Officer',
    description: 'Execute shipping dispatch through the server-side quality safety gate.',
    color: 'amber',
    icon: Truck
  }
];

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<DemoRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      setError('Please select a role to continue.');
      return;
    }

    setIsLoading(true);
    setError('');

    // Demo: any password accepted
    await new Promise(r => setTimeout(r, 600));

    api.setRole(selectedRole);
    if (selectedRole === 'QUALITY_INSPECTOR') {
      router.push('/quality-inspector');
    } else if (selectedRole === 'OWNER') {
      router.push('/owner');
    } else {
      router.push('/dispatch');
    }
    setIsLoading(false);
  };

  const colorClasses: Record<string, { border: string; bg: string; text: string; ring: string; btn: string }> = {
    blue: { border: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-400/20', btn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30' },
    purple: { border: 'border-purple-400', bg: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-purple-400/20', btn: 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30' },
    amber: { border: 'border-amber-400', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-400/20', btn: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30' }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-teal-400 flex items-center justify-center shadow-xl shadow-indigo-500/30">
              <Layers className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <div className="text-2xl font-black tracking-tight text-white">FABRICTRACE</div>
              <div className="text-xs text-slate-400 font-medium">Textile Quality & Shipping Management</div>
            </div>
          </div>
          <h1 className="text-xl font-bold text-slate-200">Sign In to Your Station</h1>
          <p className="text-sm text-slate-400 mt-1">Select your role to access the right tools</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Role Selection */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-wider text-slate-400">Select Your Role</label>
            {ROLES.map(({ role, label, title, description, color, icon: Icon }) => {
              const c = colorClasses[color];
              const isSelected = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-start space-x-4 ${
                    isSelected
                      ? `${c.border} ${c.bg} ring-4 ${c.ring}`
                      : 'border-slate-700 bg-slate-800/60 hover:border-slate-600 hover:bg-slate-800'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? `${c.bg} ${c.text}` : 'bg-slate-700 text-slate-300'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black ${isSelected ? 'text-slate-900' : 'text-slate-100'}`}>{label}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isSelected ? `${c.text} ${c.bg}` : 'text-slate-400 bg-slate-700'}`}>{title}</span>
                    </div>
                    <p className={`text-xs mt-0.5 ${isSelected ? 'text-slate-600' : 'text-slate-400'}`}>{description}</p>
                  </div>
                  {isSelected && (
                    <div className={`w-5 h-5 rounded-full ${c.btn.split(' ')[0]} flex items-center justify-center shrink-0 mt-1`}>
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-3.5">
                <Lock className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter any password (demo mode)"
                className="w-full pl-10 pr-10 py-3 bg-slate-800 border border-slate-600 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-400 font-bold bg-rose-950/50 border border-rose-800 rounded-xl px-3 py-2">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !selectedRole}
            className={`w-full py-3.5 rounded-2xl text-sm font-black text-white flex items-center justify-center space-x-2 transition shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
              selectedRole
                ? colorClasses[ROLES.find(r => r.role === selectedRole)?.color || 'blue'].btn
                : 'bg-slate-700'
            }`}
          >
            {isLoading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Enter {selectedRole ? ROLES.find(r => r.role === selectedRole)?.title + ' Station' : 'Station'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6 flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Demo mode — all data is sample textile factory data. No real credentials required.</span>
        </p>
      </div>
    </div>
  );
}
