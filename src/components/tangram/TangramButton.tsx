import React from 'react';

export interface TangramButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

export const TangramButton: React.FC<TangramButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const sizeStyles = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-9 px-3.5 text-sm gap-2",
    lg: "h-11 px-5 text-base gap-2.5",
  };

  const variantStyles = {
    primary: "bg-[#1E2D72] hover:bg-[#162256] active:bg-[#10183F] text-white shadow-xs focus:ring-[#1E2D72]",
    secondary: "bg-[#EFF6FF] hover:bg-[#DBEAFE] active:bg-[#BFDBFE] text-[#1E2D72] font-semibold focus:ring-[#1E2D72] border border-[#BFDBFE]",
    accent: "bg-[#F39818] hover:bg-[#DE860E] active:bg-[#C9750A] text-white font-bold shadow-xs focus:ring-[#F39818]",
    outline: "bg-white hover:bg-slate-50 active:bg-slate-100 text-[#0F172A] border border-[#CBD5E1] shadow-xs focus:ring-[#1E2D72]",
    ghost: "bg-transparent hover:bg-slate-100 active:bg-slate-200 text-[#475569] hover:text-[#1E2D72] focus:ring-slate-400",
    danger: "bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] font-semibold focus:ring-red-400",
    success: "bg-[#006C49] hover:bg-[#00583B] text-white shadow-xs focus:ring-emerald-500",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-0.5 mr-1.5 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  );
};
