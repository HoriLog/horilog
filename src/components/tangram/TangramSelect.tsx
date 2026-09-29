import React from 'react';

export interface TangramSelectOption {
  value: string;
  label: string;
}

export interface TangramSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: TangramSelectOption[];
  icon?: React.ReactNode;
}

export const TangramSelect: React.FC<TangramSelectProps> = ({
  label,
  helperText,
  error,
  options,
  icon,
  className = '',
  id,
  ...props
}) => {
  const generatedId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full flex flex-col gap-1 text-left">
      {label && (
        <label htmlFor={generatedId} className="text-xs font-semibold text-[#434655] tracking-tight">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3 text-[#737686] flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <select
          id={generatedId}
          className={`w-full h-9 bg-white text-[#0B1C30] text-sm rounded-lg border appearance-none pr-8 cursor-pointer ${
            error
              ? 'border-[#BA1A1A] focus:border-[#BA1A1A] focus:ring-1 focus:ring-[#BA1A1A]'
              : 'border-[#CBD5E1] hover:border-[#94A3B8] focus:border-[#004AC6] focus:ring-1 focus:ring-[#004AC6]'
          } ${icon ? 'pl-9' : 'pl-3'} transition-colors focus:outline-none ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 pointer-events-none text-[#737686]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error ? (
        <span className="text-xs text-[#BA1A1A] font-medium">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-[#737686]">{helperText}</span>
      ) : null}
    </div>
  );
};
