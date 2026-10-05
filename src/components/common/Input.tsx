import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
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
    const inputId =
      id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const descriptionId =
      error || helperText ? `${inputId ?? 'input'}-description` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-semibold text-brand-text"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span
              className="pointer-events-none absolute left-3 flex text-brand-text-muted"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={descriptionId}
            className={[
              'min-h-11 w-full rounded-lg border bg-white',
              'px-3 py-2.5 text-sm text-brand-text',
              'placeholder:font-normal placeholder:text-gray-400',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2',
              'disabled:cursor-not-allowed disabled:bg-brand-surface-container',
              'disabled:text-brand-text-muted',
              leftIcon ? 'pl-10' : '',
              rightIcon ? 'pr-10' : '',
              error
                ? 'border-brand-error focus:border-brand-error focus:ring-brand-error/15'
                : 'border-brand-border-high hover:border-gray-400 focus:border-brand-primary focus:ring-brand-primary/15',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3 flex items-center text-brand-text-muted">
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p
            id={descriptionId}
            className="mt-1.5 text-sm text-brand-error"
          >
            {error}
          </p>
        )}

        {!error && helperText && (
          <p
            id={descriptionId}
            className="mt-1.5 text-sm text-brand-text-muted"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;