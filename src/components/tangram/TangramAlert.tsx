import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export interface TangramAlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  action?: React.ReactNode;
  className?: string;
}

export const TangramAlert: React.FC<TangramAlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  action,
  className = '',
}) => {
  const styles = {
    info: {
      bg: 'bg-[#EFF6FF]',
      border: 'border-[#BFDBFE]',
      text: 'text-[#1E40AF]',
      icon: <Info className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />,
    },
    success: {
      bg: 'bg-[#ECFDF5]',
      border: 'border-[#A7F3D0]',
      text: 'text-[#065F46]',
      icon: <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />,
    },
    warning: {
      bg: 'bg-[#FFFBEB]',
      border: 'border-[#FDE68A]',
      text: 'text-[#92400E]',
      icon: <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />,
    },
    error: {
      bg: 'bg-[#FEF2F2]',
      border: 'border-[#FECACA]',
      text: 'text-[#991B1B]',
      icon: <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />,
    },
  };

  const current = styles[variant];

  return (
    <div
      className={`flex items-start gap-3 p-3.5 rounded-lg border ${current.bg} ${current.border} ${className}`}
    >
      {current.icon}
      <div className="flex-1 text-xs sm:text-sm">
        {title && <h4 className={`font-semibold mb-0.5 ${current.text}`}>{title}</h4>}
        <div className={current.text}>{children}</div>
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
