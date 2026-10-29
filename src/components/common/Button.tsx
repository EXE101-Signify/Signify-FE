import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border border-brand-primary bg-brand-primary text-white hover:border-brand-primary-hover hover:bg-brand-primary-hover',
  secondary:
    'border border-brand-secondary bg-brand-secondary text-white hover:border-brand-secondary-hover hover:bg-brand-secondary-hover',
  outline:
    'border border-brand-border-high bg-white text-brand-text hover:border-brand-text-muted hover:bg-brand-surface-container',
  ghost:
    'border border-transparent bg-transparent text-brand-text-muted hover:bg-brand-surface-container hover:text-brand-text',
  danger:
    'border border-brand-error bg-brand-error text-white hover:border-red-700 hover:bg-red-700',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-8 gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold',
  md: 'min-h-10 gap-2 rounded-lg px-4 py-2 text-sm font-semibold',
  lg: 'min-h-11 gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          'inline-flex items-center justify-center whitespace-nowrap',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth ? 'w-full' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {isLoading ? (
          <Loader2
            className="h-4 w-4 shrink-0 animate-spin"
            aria-hidden="true"
          />
        ) : (
          leftIcon && (
            <span className="flex shrink-0 items-center" aria-hidden="true">
              {leftIcon}
            </span>
          )
        )}

        <span>{children}</span>

        {!isLoading && rightIcon && (
          <span className="flex shrink-0 items-center" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;