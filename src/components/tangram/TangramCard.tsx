import React from 'react';

export interface TangramCardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  actions?: React.ReactNode;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  hoverable?: boolean;
}

export const TangramCard: React.FC<TangramCardProps> = ({
  children,
  className = '',
  header,
  actions,
  title,
  subtitle,
  footer,
  hoverable = false,
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden ${
        hoverable ? 'hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)] hover:border-[#CBD5E1] transition-all duration-200' : ''
      } ${className}`}
    >
      {(header || title) && (
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#F1F5F9]">
          {header ? (
            header
          ) : (
            <div>
              {title && <h3 className="text-base font-bold text-[#0B1C30] tracking-tight">{title}</h3>}
              {subtitle && <p className="text-xs text-[#737686] mt-0.5">{subtitle}</p>}
            </div>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
      {footer && <div className="p-3 sm:p-4 bg-[#F8FAFC] border-t border-[#F1F5F9]">{footer}</div>}
    </div>
  );
};
