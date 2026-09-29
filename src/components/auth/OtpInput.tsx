import {
  useRef,
  type ClipboardEvent,
  type ChangeEvent,
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
      className="flex justify-center gap-2"
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
          className="h-14 w-12 rounded-xl border border-brand-border bg-brand-bg text-center text-xl font-black text-brand-text outline-none transition-all focus:border-brand-primary focus:bg-white focus:ring-2 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      ))}
    </div>
  );
}