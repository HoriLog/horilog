import React from 'react';

export interface TangramMetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  trend?: {
    text: string;
    type: 'positive' | 'negative' | 'neutral';
    icon?: React.ReactNode;
  };
  secondaryText?: string;
  progressBar?: {
    percentage: number;
    color?: string;
    secondaryPercentage?: number;
    secondaryColor?: string;
  };
  chip?: {
    text: string;
    variant: 'warning' | 'success' | 'danger' | 'info';
  };
  className?: string;
  onClick?: () => void;
}

export const TangramMetricCard: React.FC<TangramMetricCardProps> = ({
  label,
  value,
  icon,
  iconBgColor = 'bg-[#EFF4FF]',
  iconColor = 'text-[#004AC6]',
  trend,
  secondaryText,
  progressBar,
  chip,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`flex flex-col justify-between p-5 bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-[#CBD5E1]' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] font-semibold text-[#737686] uppercase tracking-wider truncate">
            {label}
          </span>
          <span className="text-2xl sm:text-[32px] sm:leading-9.5 font-bold text-[#0B1C30] tracking-tight mt-1 font-mono tabular-nums">
            {value}
          </span>
        </div>
        <div className={`p-2.5 rounded-lg flex items-center justify-center shrink-0 ${iconBgColor} ${iconColor}`}>
          {icon}
        </div>
      </div>

      <div className="mt-4 pt-1 flex flex-col gap-1.5">
        {(trend || secondaryText || chip) && (
          <div className="flex items-center justify-between text-xs gap-2">
            {trend && (
              <span
                className={`font-semibold flex items-center gap-1 ${
                  trend.type === 'positive'
                    ? 'text-[#006C49]'
                    : trend.type === 'negative'
                    ? 'text-[#BA1A1A]'
                    : 'text-[#737686]'
                }`}
              >
                {trend.icon}
                {trend.text}
              </span>
            )}
            {chip && (
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                  chip.variant === 'warning'
                    ? 'bg-[#FFDDB8] text-[#653E00]'
                    : chip.variant === 'success'
                    ? 'bg-[#D1FAE5] text-[#065F46]'
                    : 'bg-[#FEE2E2] text-[#991B1B]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {chip.text}
              </span>
            )}
            {secondaryText && (
              <span className="text-[#737686] font-mono text-[11px] tabular-nums ml-auto text-right">
                {secondaryText}
              </span>
            )}
          </div>
        )}

        {progressBar && (
          <div className="w-full bg-[#EFF4FF] rounded-full h-1.5 overflow-hidden flex mt-1">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${progressBar.color || 'bg-[#006C49]'}`}
              style={{ width: `${Math.min(100, Math.max(0, progressBar.percentage))}%` }}
            />
            {progressBar.secondaryPercentage && (
              <div
                className={`h-1.5 ${progressBar.secondaryColor || 'bg-[#CBDBF5]'}`}
                style={{ width: `${Math.min(100, Math.max(0, progressBar.secondaryPercentage))}%` }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
