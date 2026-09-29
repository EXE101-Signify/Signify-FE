import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className = '',
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold uppercase tracking-wider text-brand-text-muted"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3.5 text-brand-text-muted">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-brand-text transition-all duration-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 disabled:bg-brand-bg disabled:opacity-60 ${
              leftIcon ? 'pl-10' : ''
            } ${rightIcon ? 'pr-10' : ''} ${
              error
                ? 'border-brand-error focus:border-brand-error focus:ring-brand-error/20'
                : 'border-brand-border focus:border-brand-primary focus:ring-brand-primary/20 hover:border-brand-border-high'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-brand-text-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs font-semibold text-brand-error">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-brand-text-muted">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
