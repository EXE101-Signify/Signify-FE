import type { ReactNode } from 'react';

interface SectionCardProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article';
  id?: string;
}

export default function SectionCard({
  children,
  className = '',
  as: Component = 'section',
  id,
}: SectionCardProps) {
  return (
    <Component
      id={id}
      className={[
        'rounded-xl border border-brand-border bg-brand-surface',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </Component>
  );
}