import { useState, type FormEvent } from 'react';
import { KeyRound, Mail, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';
import { emailApi } from '../../services/emailApi';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await emailApi.sendForgotPasswordOtp(email);

      if (res.success) {
        navigate('/verify-otp', {
          state: {
            flow: 'reset-password',
            email,
          },
        });
      } else {
        setError(res.message || 'Không tìm thấy tài khoản với email này.');
      }
    } catch (err: any) {
      setError(
        err.message || 'Không tìm thấy tài khoản hoặc có lỗi xảy ra. Vui lòng kiểm tra lại email.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Quên"
      highlight="mật khẩu?"
      subtitle="Khôi phục quyền truy cập SignBridge"
      backTo="/login"
    >
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary-light text-brand-primary">
          <KeyRound className="h-5 w-5" />
        </div>

        <h2 className="mt-3 text-sm font-extrabold uppercase tracking-wide text-brand-text">
          Khôi phục tài khoản
        </h2>

        <p className="mt-1 text-xs leading-relaxed text-brand-text-muted">
          Nhập email đã đăng ký. Chúng tôi sẽ gửi mã OTP để xác minh
          tài khoản.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="forgot-password-email"
            className="block text-[10px] font-bold uppercase tracking-widest text-brand-text-muted"
          >
            Địa chỉ email
          </label>

          <div className="relative mt-1.5">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted/65" />

            <input
              id="forgot-password-email"
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

        <div className="rounded-xl border border-brand-border bg-brand-bg px-4 py-3">
          <p className="text-[11px] font-semibold leading-relaxed text-brand-text-muted">
            Mã OTP gồm 6 chữ số và chỉ được sử dụng một lần.
          </p>
        </div>

        <button
          id="forgot-password-submit-btn"
          type="submit"
          disabled={isSubmitting}
          className="flex w-full cursor-pointer justify-center rounded-xl border border-transparent bg-brand-primary px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-brand-primary/10 transition-all hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Đang gửi mã OTP...' : 'Gửi mã xác thực'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => navigate('/login')}
        className="mt-6 w-full cursor-pointer text-center text-xs font-extrabold text-brand-primary hover:text-brand-primary-hover"
      >
        Quay lại đăng nhập
      </button>
    </AuthShell>
  );
}