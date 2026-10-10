import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', pulse = false }) => {
  const norm = status.toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';
  let dotColor = 'bg-slate-400';

  if (norm === 'running' || norm === 'resumed') {
    colorClasses = 'bg-teal-50 text-teal-800 border-teal-300';
    dotColor = 'bg-teal-500';
  } else if (norm === 'idle' || norm === 'planned' || norm === 'on hold') {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-300';
    dotColor = 'bg-amber-500';
  } else if (norm === 'stopped' || norm === 'breakdown reported' || norm === 'depleted') {
    colorClasses = 'bg-rose-50 text-rose-800 border-rose-300';
    dotColor = 'bg-rose-500';
  } else if (norm === 'maintenance') {
    colorClasses = 'bg-purple-50 text-purple-800 border-purple-300';
    dotColor = 'bg-purple-500';
  } else if (norm === 'in progress' || norm === 'cotton') {
    colorClasses = 'bg-sky-50 text-sky-800 border-sky-300';
    dotColor = 'bg-sky-500';
  } else if (norm === 'completed' || norm === 'in stock') {
    colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    dotColor = 'bg-emerald-500';
  } else if (norm === 'low stock') {
    colorClasses = 'bg-orange-50 text-orange-800 border-orange-300 font-semibold';
    dotColor = 'bg-orange-500';
  } else if (norm === 'simulator') {
    colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    dotColor = 'bg-indigo-500';
  } else if (norm === 'operator report') {
    colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
    dotColor = 'bg-slate-400';
  } else if (norm === 'receipt') {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-500';
  } else if (norm === 'consumption') {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
    dotColor = 'bg-blue-500';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs tracking-wide';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${colorClasses} ${sizeClasses} font-medium`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor} ${pulse ? 'animate-ping' : ''}`} />
      <span>{status}</span>
    </span>
  );
};
