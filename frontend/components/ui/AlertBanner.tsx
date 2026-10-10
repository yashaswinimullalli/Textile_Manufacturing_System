import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

interface AlertBannerProps {
  type?: 'warning' | 'error' | 'info' | 'success';
  title?: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type = 'warning',
  title,
  message,
  actionText,
  onAction,
  className = '',
}) => {
  const configs = {
    warning: {
      bg: 'bg-amber-50 border-amber-300 text-amber-900',
      icon: <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />,
      btn: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    error: {
      bg: 'bg-rose-50 border-rose-300 text-rose-900',
      icon: <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />,
      btn: 'bg-rose-600 hover:bg-rose-700 text-white',
    },
    info: {
      bg: 'bg-sky-50 border-sky-300 text-sky-900',
      icon: <Info className="h-5 w-5 text-sky-600 flex-shrink-0" />,
      btn: 'bg-sky-600 hover:bg-sky-700 text-white',
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-300 text-emerald-900',
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />,
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
  };

  const config = configs[type];

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-3.5 shadow-sm ${config.bg} ${className}`}>
      {config.icon}
      <div className="flex-1 text-sm">
        {title && <p className="font-semibold text-sm leading-tight">{title}</p>}
        <p className={`${title ? 'mt-0.5' : ''} text-xs md:text-sm`}>{message}</p>
      </div>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className={`text-xs px-3 py-1.5 rounded-md font-medium shadow-sm transition-colors ${config.btn}`}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
