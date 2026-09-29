import type { ReactNode } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuthShellProps {
  title: string;
  highlight: string;
  subtitle: string;
  children: ReactNode;
  backTo?: string;
}

export default function AuthShell({
  title,
  highlight,
  subtitle,
  children,
  backTo = '/login',
}: AuthShellProps) {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen flex-col justify-center bg-brand-bg bg-dot-grid px-6 py-12 font-sans text-brand-text">
      <div className="absolute left-6 top-6">
        <button
          type="button"
          onClick={() => navigate(backTo)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-brand-border bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-brand-text-muted shadow-sm transition-colors hover:text-brand-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>
      </div>

      <div className="mx-auto w-full max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-md shadow-brand-primary/10">
          <ShieldCheck className="h-6 w-6" />
        </div>

        <h1 className="mt-6 text-3xl font-black uppercase tracking-tight text-brand-text">
          {title}{' '}
          <span className="text-brand-primary">{highlight}</span>
        </h1>

        <p className="mt-2 text-xs uppercase tracking-widest text-brand-text-muted">
          {subtitle}
        </p>
      </div>

      <div className="mx-auto mt-8 w-full max-w-md">
        <div className="relative overflow-hidden rounded-[24px] border border-brand-border bg-white px-8 py-8 shadow-md">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-brand-primary" />
          {children}
        </div>
      </div>
    </div>
  );
}