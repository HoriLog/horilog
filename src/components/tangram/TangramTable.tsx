import React from 'react';

export interface TangramTableProps {
  children: React.ReactNode;
  className?: string;
}

export const TangramTable: React.FC<TangramTableProps> = ({ children, className = '' }) => {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full text-left border-collapse">{children}</table>
    </div>
  );
};

export const TangramThead: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <thead className={`bg-[#EFF4FF] text-[#434655] font-semibold text-[11px] uppercase tracking-wider ${className}`}>
      {children}
    </thead>
  );
};

export const TangramTh: React.FC<{
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}> = ({ children, className = '', align = 'left' }) => {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th className={`py-2.5 px-4 font-semibold ${alignClass} ${className}`}>
      {children}
    </th>
  );
};

export const TangramTbody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <tbody className={`divide-y divide-[#F1F5F9] text-[#0B1C30] text-xs sm:text-sm ${className}`}>{children}</tbody>;
};

export const TangramTr: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors hover:bg-[#F8FAFC] ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
};

export const TangramTd: React.FC<{
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}> = ({ children, className = '', align = 'left' }) => {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <td className={`py-3 px-4 align-middle ${alignClass} ${className}`}>
      {children}
    </td>
  );
};
