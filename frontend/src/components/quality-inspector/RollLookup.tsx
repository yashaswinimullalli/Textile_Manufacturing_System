'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, Hash } from 'lucide-react';

interface RollLookupProps {
  onSearch?: (code: string) => void;
  isLoading?: boolean;
}

export default function RollLookup({ onSearch, isLoading = false }: RollLookupProps) {
  const router = useRouter();
  const [rollId, setRollId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = rollId.trim().toUpperCase();
    if (!cleanId) {
      setError('Please type a roll number (e.g. ROLL-008).');
      return;
    }
    setError(null);
    if (onSearch) {
      onSearch(cleanId);
    } else {
      router.push(`/rolls/${encodeURIComponent(cleanId)}`);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <Hash className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900">Type Roll Number Manually</h3>
          <p className="text-xs text-slate-500">If barcode scanner is unavailable or roll tag is torn</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={rollId}
            onChange={(e) => {
              setRollId(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Type roll number (e.g. ROLL-008, ROLL-009)"
            className="w-full pl-11 pr-32 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-mono font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-2 top-2 bottom-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center space-x-1.5 shadow-md shadow-blue-600/25 transition cursor-pointer disabled:opacity-50"
          >
            <span>{isLoading ? 'Checking...' : 'Check Roll'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {error && (
          <p className="mt-2 text-xs text-rose-600 font-bold">{error}</p>
        )}
      </form>

      {/* Suggested Quick Links */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-slate-500">Quick test rolls:</span>
        {[
          { id: 'ROLL-008', label: 'ROLL-008 (Needs wash)' },
          { id: 'ROLL-009', label: 'ROLL-009 (Uninspected)' },
          { id: 'ROLL-010', label: 'ROLL-010 (Scrapped)' },
          { id: 'ROLL-001', label: 'ROLL-001 (Approved)' }
        ].map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setRollId(item.id);
              if (onSearch) onSearch(item.id);
              else router.push(`/rolls/${item.id}`);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-xs transition cursor-pointer border border-slate-200"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
