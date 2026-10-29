import {
  useRef,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
}

export default function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const digits = Array.from(
    { length },
    (_, index) => value[index] ?? '',
  );

  const updateDigit = (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const digit = event.target.value.replace(/\D/g, '').slice(-1);
    const nextDigits = [...digits];

    nextDigits[index] = digit;
    onChange(nextDigits.join('').slice(0, length));

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();

    const pastedValue = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, length);

    if (!pastedValue) {
      return;
    }

    onChange(pastedValue);

    const nextIndex = Math.min(pastedValue.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      className="flex justify-between gap-2"
      onPaste={handlePaste}
      aria-label="Nhập mã OTP"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Số OTP thứ ${index + 1}`}
          onChange={(event) => updateDigit(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          className={[
            'h-13 min-w-0 flex-1 rounded-md border bg-white',
            'text-center text-lg font-semibold text-brand-text',
            'outline-none transition-colors',
            'hover:border-gray-400',
            'focus:border-brand-primary focus:ring-2',
            'focus:ring-brand-primary/15',
            'disabled:cursor-not-allowed disabled:bg-brand-surface-container',
            'disabled:opacity-60',
            digit
              ? 'border-brand-primary'
              : 'border-brand-border-high',
          ].join(' ')}
        />
      ))}
    </div>
  );
}