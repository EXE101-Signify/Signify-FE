import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import GoogleIcon from './GoogleIcon';

export interface GoogleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  isLoading?: boolean;
  variant?: 'outline' | 'solid';
  fullWidth?: boolean;
}

export default function GoogleButton({
  label = 'Tiếp tục với Google',
  isLoading = false,
  variant = 'outline',
  fullWidth = true,
  className = '',
  disabled,
  onClick,
  ...props
}: GoogleButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer';

  const variantClasses =
    variant === 'solid'
      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20'
      : 'border border-brand-border bg-white text-brand-text shadow-sm hover:border-brand-border-high hover:bg-gray-50/80 hover:shadow-md';

  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-brand-primary shrink-0" />
      ) : (
        <GoogleIcon className="h-4.5 w-4.5 shrink-0" />
      )}
      <span className="truncate">{isLoading ? 'Đang kết nối Google...' : label}</span>
    </button>
  );
}
