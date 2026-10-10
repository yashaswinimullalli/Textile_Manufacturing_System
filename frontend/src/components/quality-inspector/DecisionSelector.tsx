'use client';

import React from 'react';
import { DecisionType } from '@/types/factory';
import { CheckCircle2, RefreshCw, XCircle, ShieldCheck, AlertTriangle, Ban } from 'lucide-react';

interface DecisionSelectorProps {
  value: DecisionType;
  onChange: (decision: DecisionType) => void;
  disabled?: boolean;
}

export default function DecisionSelector({ value, onChange, disabled = false }: DecisionSelectorProps) {
  const options: {
    type: DecisionType;
    label: string;
    sublabel: string;
    actionImpact: string;
    badgeText: string;
    icon: React.ElementType;
    selectedStyle: string;
    unselectedStyle: string;
    accentColor: string;
  }[] = [
    {
      type: 'PASS',
      label: 'PASS — Fabric is Good',
      sublabel: 'Meets quality standards. No serious defects.',
      actionImpact: 'Safe to ship to the customer.',
      badgeText: 'Shipping Allowed',
      icon: CheckCircle2,
      selectedStyle: 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-600/30 ring-4 ring-emerald-400/40',
      unselectedStyle: 'bg-white text-slate-800 border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/50',
      accentColor: 'emerald'
    },
    {
      type: 'REWORK',
      label: 'REWORK — Needs Wash / Fix',
      sublabel: 'Can be saved by scouring oil, washing, or re-trimming.',
      actionImpact: 'Locked! Must be checked again after repair.',
      badgeText: 'Locked Until Repaired',
      icon: RefreshCw,
      selectedStyle: 'bg-amber-600 text-white border-amber-600 shadow-xl shadow-amber-600/30 ring-4 ring-amber-400/40',
      unselectedStyle: 'bg-white text-slate-800 border-slate-300 hover:border-amber-400 hover:bg-amber-50/50',
      accentColor: 'amber'
    },
    {
      type: 'REJECT',
      label: 'REJECT — Scrap Fabric',
      sublabel: 'Permanent structural flaw (big tear or ruined cloth).',
      actionImpact: 'Permanently blocked from loading onto any truck.',
      badgeText: 'Permanently Blocked',
      icon: XCircle,
      selectedStyle: 'bg-rose-600 text-white border-rose-600 shadow-xl shadow-rose-600/30 ring-4 ring-rose-400/40',
      unselectedStyle: 'bg-white text-slate-800 border-slate-300 hover:border-rose-400 hover:bg-rose-50/50',
      accentColor: 'rose'
    }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <label className="block text-sm font-medium text-slate-900 tracking-tight">
            Step 1: What is your quality decision? <span className="text-rose-500">*</span>
          </label>
          <p className="text-xs text-slate-500">
            Choose what should happen to this fabric roll
          </p>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          Required Choice
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map(opt => {
          const isSelected = value === opt.type;
          const Icon = opt.icon;
          return (
            <button
              key={opt.type}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.type)}
              className={`p-5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                isSelected ? opt.selectedStyle : opt.unselectedStyle
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-base font-medium tracking-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {opt.label}
                  </span>
                  <Icon className={`w-6 h-6 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                </div>
                <p className={`text-xs leading-relaxed font-medium ${isSelected ? 'text-white/90' : 'text-slate-600'}`}>
                  {opt.sublabel}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-current/20">
                <div className={`text-[11px] font-medium px-2.5 py-1 rounded-lg inline-block ${
                  isSelected ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {opt.badgeText}
                </div>
                <div className={`text-[10px] mt-1 font-medium ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                  {opt.actionImpact}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
