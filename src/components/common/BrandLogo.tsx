import { Accessibility } from 'lucide-react';

interface BrandLogoProps {
  compact?: boolean;
  inverse?: boolean;
}

export default function BrandLogo({
  compact = false,
  inverse = false,
}: BrandLogoProps) {
  return (
    <div className="flex items-center gap-3" aria-label="SIGNIFY">
      <div
        className={`flex shrink-0 items-center justify-center rounded-xl ${
          compact ? 'h-9 w-9' : 'h-10 w-10'
        } ${
          inverse
            ? 'bg-white text-brand-primary'
            : 'bg-brand-primary text-white'
        }`}
      >
        <Accessibility
          className={compact ? 'h-4 w-4' : 'h-5 w-5'}
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0">
        <span
          className={`block font-black tracking-tight ${
            compact ? 'text-lg' : 'text-xl'
          } ${inverse ? 'text-white' : 'text-brand-primary'}`}
        >
          SIGNIFY
        </span>

        {!compact && (
          <span
            className={`block text-[9px] font-bold uppercase tracking-[0.22em] ${
              inverse ? 'text-white/70' : 'text-brand-text-muted'
            }`}
          >
            AI Sign Interpreter
          </span>
        )}
      </div>
    </div>
  );
}