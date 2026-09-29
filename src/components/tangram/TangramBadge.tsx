import React from 'react';

export interface TangramBadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  size?: 'sm' | 'md';
  hasDot?: boolean;
  dotPulse?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export const TangramBadge: React.FC<TangramBadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  hasDot = true,
  dotPulse = false,
  className = '',
  icon,
}) => {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] leading-tight font-semibold",
    md: "px-2.5 py-0.5 text-[11px] leading-tight font-semibold",
  };

  const variantStyles = {
    success: "bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]",
    warning: "bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]",
    danger: "bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]",
    info: "bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]",
    neutral: "bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]",
    purple: "bg-[#FAF5FF] text-[#6B21A8] border border-[#E9D5FF]",
  };

  const dotColors = {
    success: "bg-[#10B981]",
    warning: "bg-[#F59E0B]",
    danger: "bg-[#EF4444]",
    info: "bg-[#2563EB]",
    neutral: "bg-[#64748B]",
    purple: "bg-[#A855F7]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {hasDot && (
        <span className="relative flex h-1.5 w-1.5 items-center justify-center shrink-0">
          {dotPulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors[variant]}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColors[variant]}`} />
        </span>
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="whitespace-nowrap">{children}</span>
    </span>
  );
};
