import React from 'react';

export interface TangramTabItem {
  id: string;
  label: string;
  count?: number | string;
  icon?: React.ReactNode;
}

export interface TangramSegmentedControlProps {
  items: TangramTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export const TangramSegmentedControl: React.FC<TangramSegmentedControlProps> = ({
  items,
  activeId,
  onChange,
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'h-8 text-xs px-2.5',
    md: 'h-9 text-xs sm:text-sm px-3.5',
  };

  return (
    <div className={`inline-flex items-center p-1 bg-[#EFF4FF] rounded-lg shadow-inner gap-1 ${className}`}>
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`flex items-center gap-1.5 font-semibold rounded-md transition-all duration-150 select-none cursor-pointer ${
              sizeStyles[size]
            } ${
              isActive
                ? 'bg-white text-[#004AC6] shadow-sm'
                : 'text-[#434655] hover:text-[#0B1C30] hover:bg-white/50'
            }`}
          >
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-[#EFF4FF] text-[#004AC6]' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
