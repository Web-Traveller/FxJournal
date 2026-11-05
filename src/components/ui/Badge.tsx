import React from 'react';

export type BadgeVariant = 'profit' | 'loss' | 'neutral' | 'caution' | 'brand' | 'subtle';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'xs' | 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'xs',
  pulse = false,
  className = '',
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    profit: 'bg-emerald-500/10 text-[#10b981] border-emerald-500/25',
    loss: 'bg-rose-500/10 text-[#f43f5e] border-rose-500/25',
    caution: 'bg-amber-500/10 text-[#f59e0b] border-amber-500/25',
    brand: 'bg-[#ededed]/10 text-[#ededed] border-[#ededed]/25',
    neutral: 'bg-[#181a1e] text-[#a1a1aa] border-[#26282f]',
    subtle: 'bg-transparent text-[#71717a] border-[#26282f]',
  };

  const sizeStyles = {
    xs: 'px-1.5 py-0.2 text-[10px] tracking-normal rounded-[3px]',
    sm: 'px-2 py-0.5 text-[11px] tracking-normal rounded-[4px]',
    md: 'px-2.5 py-1 text-xs tracking-normal rounded-[4px]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-medium border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      {children}
    </span>
  );
};
