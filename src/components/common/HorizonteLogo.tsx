import React from 'react';

export interface HorizonteLogoProps {
  variant?: 'full' | 'icon';
  theme?: 'light' | 'dark';
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const HorizonteLogo: React.FC<HorizonteLogoProps> = ({
  variant = 'full',
  theme = 'light',
  className = '',
  size = 'md',
}) => {
  const sizeMap = {
    xs: variant === 'icon' ? 'h-6 w-6' : 'h-7',
    sm: variant === 'icon' ? 'h-8 w-8' : 'h-9',
    md: variant === 'icon' ? 'h-10 w-10' : 'h-11',
    lg: variant === 'icon' ? 'h-12 w-12' : 'h-14',
    xl: variant === 'icon' ? 'h-16 w-16' : 'h-20',
  };

  const isDark = theme === 'dark';
  const textPrimary = isDark ? '#FFFFFF' : '#1C2969';
  const textAccent = '#F29419'; // Golden solar amber of Horizonte

  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 100 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeMap[size]} ${className} select-none`}
        aria-label="Horizonte Logística"
      >
        {/* Left slanted stem of H (Steel/Horizon Blue) */}
        <path
          d="M34 10 L44 10 L35 56 L25 56 Z"
          fill="#4A82C5"
          className="transition-colors"
        />

        {/* Right slanted stem of H (Deep Royal Navy) */}
        <path
          d="M51 10 L61 10 L52 56 L42 56 Z"
          fill={isDark ? '#5B7BE8' : '#26378A'}
          className="transition-colors"
        />

        {/* Dynamic Speed Arcs crossing the H */}
        {/* Arc 1 (Top - Solar Amber / Golden Orange) */}
        <path
          d="M4 38 Q 40 18 90 42"
          stroke="#F39818"
          strokeWidth="5.5"
          strokeLinecap="round"
        />

        {/* Arc 2 (Middle - Cerulean Blue) */}
        <path
          d="M2 49 Q 38 29 88 53"
          stroke="#4A82C5"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Arc 3 (Bottom - Navy / Slate) */}
        <path
          d="M3 59 Q 38 39 88 63"
          stroke={isDark ? '#8BA3E8' : '#1E2D72'}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none ${sizeMap[size]} ${className}`}>
      {/* Icon Symbol */}
      <svg
        viewBox="0 0 105 85"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full aspect-105/85 shrink-0"
        aria-hidden="true"
      >
        {/* Left slanted stem of H (Steel Blue) */}
        <path
          d="M36 8 L47 8 L37 58 L26 58 Z"
          fill="#4A82C5"
        />

        {/* Right slanted stem of H (Deep Royal Navy) */}
        <path
          d="M55 8 L66 8 L56 58 L45 58 Z"
          fill={isDark ? '#607FE8' : '#26378A'}
        />

        {/* Dynamic Speed Arcs */}
        {/* Top Arc - Golden Orange */}
        <path
          d="M5 40 Q 42 18 96 44"
          stroke="#F39818"
          strokeWidth="5.5"
          strokeLinecap="round"
        />

        {/* Middle Arc - Cerulean Blue */}
        <path
          d="M3 51 Q 40 30 95 55"
          stroke="#4A82C5"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Bottom Arc - Deep Navy */}
        <path
          d="M4 61 Q 40 40 94 65"
          stroke={isDark ? '#8EA7EB' : '#1E2D72'}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>

      {/* Typography Lockup */}
      <div className="flex flex-col justify-center leading-none">
        <span
          className="font-extrabold tracking-[0.14em] uppercase font-sans text-sm sm:text-base leading-tight"
          style={{ color: textPrimary }}
        >
          HORIZONTE
        </span>
        <span
          className="font-bold tracking-wide text-xs sm:text-sm -mt-0.5"
          style={{ color: textAccent }}
        >
          Logística
        </span>
      </div>
    </div>
  );
};
export default HorizonteLogo;
