/**
 * Authentication Form Validation & Error Handling Utilities
 * Provides validation rules, error messaging, and password strength scoring for SignBridge
 */

export interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

export interface PasswordStrength {
  score: number; // 0 to 4
  label: string;
  color: string;
  barWidthClass: string;
  requirements: PasswordRequirement[];
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return 'Vui lòng nhập địa chỉ email.';
  }
  // Standard email pattern check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return 'Email không đúng định dạng (VD: example@gmail.com).';
  }
  return null;
}

export function validateFullName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'Vui lòng nhập họ và tên của bạn.';
  }
  if (trimmed.length < 2) {
    return 'Họ và tên phải có ít nhất 2 ký tự.';
  }
  if (/[0-9!@#$%^&*()_+={}\[\]:;<>,.?/~`]/.test(trimmed)) {
    return 'Họ và tên không nên chứa chữ số hoặc ký tự đặc biệt.';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return 'Vui lòng nhập mật khẩu.';
  }
  return null;
}

export function validateConfirmPassword(
  password: string,
  confirmPassword: string
): string | null {
  if (!confirmPassword) {
    return 'Vui lòng nhập lại mật khẩu để xác nhận.';
  }
  if (password !== confirmPassword) {
    return 'Mật khẩu xác nhận không trùng khớp với mật khẩu đã nhập.';
  }
  return null;
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  const requirements: PasswordRequirement[] = [
    {
      id: 'min-length',
      label: 'Ít nhất 8 ký tự',
      met: password.length >= 8,
    },
    {
      id: 'has-letter',
      label: 'Có chứa chữ cái (a-z, A-Z)',
      met: /[a-zA-Z]/.test(password),
    },
    {
      id: 'has-number',
      label: 'Có chứa ít nhất 1 chữ số (0-9)',
      met: /[0-9]/.test(password),
    },
    {
      id: 'has-special',
      label: 'Có ký tự đặc biệt (!@#$%...) hoặc chữ hoa',
      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) || /[A-Z]/.test(password),
    },
  ];

  const metCount = requirements.filter((r) => r.met).length;

  let score = 0;
  let label = 'Rất yếu';
  let color = 'bg-rose-500 text-rose-600';
  let barWidthClass = 'w-1/4';

  if (!password) {
    score = 0;
    label = 'Chưa nhập';
    color = 'bg-gray-300 text-gray-500';
    barWidthClass = 'w-0';
  } else if (metCount <= 1) {
    score = 1;
    label = 'Yếu';
    color = 'bg-rose-500 text-rose-600';
    barWidthClass = 'w-1/4';
  } else if (metCount === 2) {
    score = 2;
    label = 'Trung bình';
    color = 'bg-amber-500 text-amber-600';
    barWidthClass = 'w-2/4';
  } else if (metCount === 3) {
    score = 3;
    label = 'Khá mạnh';
    color = 'bg-blue-500 text-blue-600';
    barWidthClass = 'w-3/4';
  } else {
    score = 4;
    label = 'Rất mạnh';
    color = 'bg-emerald-500 text-emerald-600';
    barWidthClass = 'w-full';
  }

  return {
    score,
    label,
    color,
    barWidthClass,
    requirements,
  };
}
