import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  actions,
}: PageHeaderProps) {
  return (
    <header className="border-b border-brand-border bg-white px-8 py-5">
      <div className="flex items-center justify-between gap-6">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold leading-tight tracking-[-0.02em] text-brand-text">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-1 text-sm text-brand-text-muted">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex shrink-0 items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}