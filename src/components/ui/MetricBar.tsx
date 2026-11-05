import React from 'react';

interface MetricBarProps {
  label: string;
  currentValue: number;
  maxValue: number;
  formattedCurrent?: string;
  formattedMax?: string;
  variant?: 'profit' | 'loss' | 'caution' | 'brand';
  helperText?: string;
  showPercentage?: boolean;
  className?: string;
}

export const MetricBar: React.FC<MetricBarProps> = ({
  label,
  currentValue,
  maxValue,
  formattedCurrent,
  formattedMax,
  variant = 'profit',
  helperText,
  showPercentage = true,
  className = '',
}) => {
  const percentage = maxValue > 0 ? Math.min(100, Math.max(0, (currentValue / maxValue) * 100)) : 0;

  const barColor = {
    profit: 'bg-[#10b981]',
    loss: 'bg-[#f43f5e]',
    caution: 'bg-[#f59e0b]',
    brand: 'bg-[#ededed]',
  }[variant];

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[11px] font-medium uppercase tracking-wider text-[#71717a] font-sans">
          {label}
        </span>
        <span className="font-mono tabular-nums text-[#ededed] font-medium text-xs">
          {formattedCurrent || currentValue}
          {formattedMax && <span className="text-[#71717a]"> / {formattedMax}</span>}
          {showPercentage && <span className="ml-1 text-[#71717a] text-[10px]">({percentage.toFixed(0)}%)</span>}
        </span>
      </div>

      <div className="h-1.5 w-full bg-[#0c0d0e] rounded-[2px] overflow-hidden border border-[#26282f]">
        <div
          className={`h-full ${barColor} rounded-[2px] transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {helperText && (
        <div className="text-[11px] text-[#71717a] font-mono flex items-center justify-between">
          <span>{helperText}</span>
        </div>
      )}
    </div>
  );
};
