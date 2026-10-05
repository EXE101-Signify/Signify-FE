import { useEffect, useState, type FormEvent } from 'react';
import { KeyRound, Lock } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';
import { emailApi } from '../../services/emailApi';

interface ResetPasswordRouteState {
  email: string;
  otp?: string;
  verified: boolean;
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as ResetPasswordRouteState | null;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!routeState?.verified || !routeState.email) {
      navigate('/forgot-password', { replace: true });
    }
  }, [navigate, routeState]);

  if (!routeState?.verified || !routeState.email) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await emailApi.verifyForgotPasswordOtp(
        routeState.email,
        routeState.otp || '123456',
        password
      );

      if (res.success) {
        navigate('/login', {
          replace: true,
          state: {
            message:
              'Đổi mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.',
          },
        });
      } else {
        setError(res.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
      }
    } catch (err: any) {
      setError(
        err.message || 'Lỗi đặt lại mật khẩu. Vui lòng kiểm tra lại mã OTP hoặc thử lại.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Tạo mật khẩu"
      highlight="mới"
      subtitle="Hoàn tất khôi phục tài khoản"
      backTo="/login"
    >
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary-light text-brand-primary">
          <KeyRound className="h-5 w-5" />
        </div>

        <h2 className="mt-3 text-sm font-extrabold uppercase tracking-wide text-brand-text">
          Đặt lại mật khẩu
        </h2>

        <p className="mt-1 text-xs leading-relaxed text-brand-text-muted">
          Tài khoản đã được xác thực:
        </p>

        <p className="mt-1 break-all text-xs font-extrabold text-brand-primary">
          {routeState.email}
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="reset-password"
            className="block text-[10px] font-bold uppercase tracking-widest text-brand-text-muted"
          >
            Mật khẩu mới
          </label>

          <div className="relative mt-1.5">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted/65" />

            <input
              id="reset-password"
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
            htmlFor="reset-confirm-password"
            className="block text-[10px] font-bold uppercase tracking-widest text-brand-text-muted"
          >
            Xác nhận mật khẩu mới
          </label>

          <div className="relative mt-1.5">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted/65" />

            <input
              id="reset-confirm-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Nhập lại mật khẩu mới"
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
          id="reset-password-submit-btn"
          type="submit"
          disabled={isSubmitting}
          className="flex w-full cursor-pointer justify-center rounded-xl border border-transparent bg-brand-primary px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-brand-primary/10 transition-all hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
        </button>
      </form>
    </AuthShell>
  );
}