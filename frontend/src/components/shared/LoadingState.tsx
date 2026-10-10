import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subtext?: string;
}

export default function LoadingState({ message = 'Loading records...', subtext }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-white border border-slate-200/80 shadow-sm">
      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 text-blue-600">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">{message}</h3>
      {subtext && <p className="text-xs text-slate-500 mt-1 max-w-sm">{subtext}</p>}
    </div>
  );
}
