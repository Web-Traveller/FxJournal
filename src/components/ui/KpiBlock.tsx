import React from 'react';

interface KpiBlockProps {
  label: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  status?: 'profit' | 'loss' | 'neutral' | 'caution';
  suffix?: string;
  badge?: React.ReactNode;
  className?: string;
}

export const KpiBlock: React.FC<KpiBlockProps> = ({
  label,
  value,
  subtitle,
  status = 'neutral',
  suffix,
  badge,
  className = '',
}) => {
  const statusColor = {
    profit: 'text-[#10b981]',
    loss: 'text-[#f43f5e]',
    caution: 'text-[#f59e0b]',
    neutral: 'text-[#fafafa]',
  }[status];

  return (
    <div
      className={`bg-[#131417] border border-[#26282f] rounded-[6px] p-3.5 flex flex-col justify-between transition-colors hover:border-[#363943] ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-[#71717a] font-sans">
          {label}
        </span>
        {badge}
      </div>

      <div className="flex items-baseline gap-1.5 my-0.5">
        <span className={`text-xl font-bold font-mono tracking-tight tabular-nums ${statusColor}`}>
          {value}
        </span>
        {suffix && (
          <span className="text-xs font-mono font-medium text-[#71717a]">{suffix}</span>
        )}
      </div>

      {subtitle && (
        <div className="text-xs text-[#a1a1aa] mt-1 flex items-center gap-1.5 font-mono">
          {subtitle}
        </div>
      )}
    </div>
  );
};
