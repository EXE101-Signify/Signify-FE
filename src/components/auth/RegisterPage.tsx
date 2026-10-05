import { useState, type FormEvent } from 'react';
import { Lock, Mail, User, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (fullName.trim().length < 2) {
      setError('Vui lòng nhập họ và tên hợp lệ.');
      return;
    }

    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setIsSubmitting(true);

    // Mock API gửi OTP đăng ký.
    window.setTimeout(() => {
      setIsSubmitting(false);

      navigate('/verify-otp', {
        state: {
          flow: 'register',
          email,
          registration: {
            fullName: fullName.trim(),
            email,
            password,
          },
        },
      });
    }, 700);
  };

  const steps = [
    { num: 1, label: 'Tài khoản' },
    { num: 2, label: 'Thông tin cá nhân' },
    { num: 3, label: 'Xác nhận' },
  ];

  return (
    <AuthShell
      title="Tạo"
      highlight="tài khoản"
      subtitle="Đăng ký tài khoản SignBridge"
      backTo="/login"
    >
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary-light text-brand-primary">
          <UserPlus className="h-5 w-5" />
        </div>

        <h2 className="mt-3 text-sm font-extrabold uppercase tracking-wide text-brand-text">
          Thông tin đăng ký
        </h2>

        <p className="mt-1 text-xs leading-relaxed text-brand-text-muted">
          Mã xác thực sẽ được gửi đến địa chỉ email của bạn.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="register-full-name"
            className="block text-[10px] font-bold uppercase tracking-widest text-brand-text-muted"
          >
            Họ và tên
          </label>

          <div className="relative mt-1.5">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted/65" />

            <input
              id="register-full-name"
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Nguyễn Văn A"
              className="block w-full rounded-xl border border-brand-border bg-brand-bg py-3 pl-10 pr-4 text-xs font-bold text-brand-text outline-none transition-all focus:bg-white focus:ring-2 focus:ring-brand-primary"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="register-email"
            className="block text-[10px] font-bold uppercase tracking-widest text-brand-text-muted"
          >
            Địa chỉ email
          </label>

          <div className="relative mt-1.5">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted/65" />

            <input
              id="register-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              className="block w-full rounded-xl border border-brand-border bg-brand-bg py-3 pl-10 pr-4 text-xs font-bold text-brand-text outline-none transition-all focus:bg-white focus:ring-2 focus:ring-brand-primary"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="register-password"
            className="block text-[10px] font-bold uppercase tracking-widest text-brand-text-muted"
          >
            Mật khẩu
          </label>

          <div className="relative mt-1.5">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted/65" />

            <input
              id="register-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Tối thiểu 8 ký tự"
              className="block w-full rounded-xl border border-brand-border bg-brand-bg py-3 pl-10 pr-4 text-xs font-bold text-brand-text outline-none transition-all focus:bg-white focus:ring-2 focus:ring-brand-primary"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="register-confirm-password"
            className="block text-[10px] font-bold uppercase tracking-widest text-brand-text-muted"
          >
            Xác nhận mật khẩu
          </label>

          <div className="relative mt-1.5">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted/65" />

            <input
              id="register-confirm-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Nhập lại mật khẩu"
              className="block w-full rounded-xl border border-brand-border bg-brand-bg py-3 pl-10 pr-4 text-xs font-bold text-brand-text outline-none transition-all focus:bg-white focus:ring-2 focus:ring-brand-primary"
            />
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600"
          >
            {error}
          </div>
        )}

        <button
          id="register-submit-btn"
          type="submit"
          disabled={isSubmitting}
          className="flex w-full cursor-pointer justify-center rounded-xl border border-transparent bg-brand-primary px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-brand-primary/10 transition-all hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Đang gửi mã OTP...' : 'Đăng ký tài khoản'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs font-semibold text-brand-text-muted">
        Đã có tài khoản?{' '}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="cursor-pointer font-extrabold text-brand-primary hover:text-brand-primary-hover"
        >
          Đăng nhập
        </button>
      </p>
    </AuthShell>
  );
}