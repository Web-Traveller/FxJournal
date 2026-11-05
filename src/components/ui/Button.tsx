import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'caution';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  shortcut?: string;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'sm',
  icon,
  shortcut,
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'bg-[#fafafa] hover:bg-[#ededed] active:bg-[#e4e4e7] text-[#0c0d0e] font-semibold border border-[#fafafa]',
    secondary:
      'bg-[#181a1e] hover:bg-[#222429] active:bg-[#282a30] text-[#ededed] border border-[#26282f] hover:border-[#363943]',
    ghost:
      'bg-transparent hover:bg-[#181a1e] active:bg-[#222429] text-[#a1a1aa] hover:text-[#fafafa]',
    danger:
      'bg-[#f43f5e]/10 hover:bg-[#f43f5e]/20 text-[#f43f5e] border border-[#f43f5e]/30',
    caution:
      'bg-[#f59e0b]/10 hover:bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30',
  };

  const sizeClasses: Record<ButtonSize, string> = {
    xs: 'px-2 py-1 text-[11px] gap-1.5 rounded-[4px]',
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-[4px]',
    md: 'px-3.5 py-2 text-xs gap-2 rounded-[5px]',
    lg: 'px-4 py-2.5 text-sm gap-2.5 rounded-[6px]',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-sans transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
      <span>{children}</span>
      {shortcut && (
        <kbd className="ml-1 px-1 py-0.2 text-[9px] font-mono font-medium rounded-[3px] bg-black/20 text-current border border-current/20">
          {shortcut}
        </kbd>
      )}
    </button>
  );
};
