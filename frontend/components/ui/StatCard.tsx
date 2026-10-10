import React, { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  badge?: ReactNode;
  variant?: 'default' | 'teal' | 'danger' | 'warning';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  variant = 'default',
}) => {
  let borderLeft = 'border-l-4 border-l-slate-300';
  let iconBg = 'bg-slate-100 text-slate-700';

  if (variant === 'teal') {
    borderLeft = 'border-l-4 border-l-teal-600';
    iconBg = 'bg-teal-50 text-teal-700';
  } else if (variant === 'danger') {
    borderLeft = 'border-l-4 border-l-rose-500';
    iconBg = 'bg-rose-50 text-rose-700';
  } else if (variant === 'warning') {
    borderLeft = 'border-l-4 border-l-amber-500';
    iconBg = 'bg-amber-50 text-amber-700';
  }

  return (
    <div className={`bg-white rounded-lg border border-slate-200 p-4 shadow-sm ${borderLeft} transition-shadow hover:shadow`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        <div className={`p-2 rounded-md ${iconBg}`}>{icon}</div>
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
        {badge && <div>{badge}</div>}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
};
