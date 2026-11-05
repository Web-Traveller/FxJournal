import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  header,
  action,
  footer,
  noPadding = false,
}) => {
  return (
    <div
      className={`bg-[#131417] border border-[#26282f] rounded-[6px] overflow-hidden ${className}`}
    >
      {(header || action) && (
        <div className="px-4 py-2.5 border-b border-[#26282f] bg-[#0f1013] flex items-center justify-between gap-3">
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#71717a] font-sans">
            {header}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-4'}>{children}</div>
      {footer && (
        <div className="px-4 py-2 border-t border-[#26282f] bg-[#0f1013] text-xs text-[#71717a]">
          {footer}
        </div>
      )}
    </div>
  );
};
