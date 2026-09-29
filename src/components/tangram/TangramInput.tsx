import React from 'react';

export interface TangramInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClear?: () => void;
}

export const TangramInput = React.forwardRef<HTMLInputElement, TangramInputProps>(({
  label,
  helperText,
  hint,
  error,
  leftIcon,
  rightIcon,
  onClear,
  className = '',
  value,
  id,
  ...props
}, ref) => {
  const finalHelper = error || hint || helperText;
  const generatedId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full flex flex-col gap-1 text-left">
      {label && (
        <label htmlFor={generatedId} className="text-xs font-semibold text-[#434655] tracking-tight">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3 text-[#737686] flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={generatedId}
          ref={ref}
          value={value}
          className={`w-full h-9 bg-white text-[#0B1C30] placeholder-[#737686] text-sm rounded-lg border ${
            error
              ? 'border-[#BA1A1A] focus:border-[#BA1A1A] focus:ring-1 focus:ring-[#BA1A1A]'
              : 'border-[#CBD5E1] hover:border-[#94A3B8] focus:border-[#004AC6] focus:ring-1 focus:ring-[#004AC6]'
          } ${leftIcon ? 'pl-9' : 'pl-3'} ${rightIcon || onClear ? 'pr-9' : 'pr-3'} transition-colors focus:outline-none ${className}`}
          {...props}
        />
        {onClear && value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 text-[#737686] hover:text-[#0B1C30] transition-colors p-0.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {!onClear && rightIcon && (
          <div className="absolute right-3 text-[#737686] flex items-center pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>
      {error ? (
        <span className="text-xs text-[#BA1A1A] font-medium">{error}</span>
      ) : finalHelper ? (
        <span className="text-xs text-[#737686]">{finalHelper}</span>
      ) : null}
    </div>
  );
});

TangramInput.displayName = 'TangramInput';
