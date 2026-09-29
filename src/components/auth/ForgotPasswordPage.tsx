import { useState, type FormEvent } from 'react';
import { KeyRound, Mail, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button, Input } from '../common';
import AuthShell from './AuthShell';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    window.setTimeout(() => {
      setIsSubmitting(false);

      navigate('/verify-otp', {
        state: {
          flow: 'reset-password',
          email,
        },
      });
    }, 700);
  };

  return (
    <AuthShell
      title="Khôi phục"
      highlight="mật khẩu"
      subtitle="Xác minh email để lấy lại quyền truy cập tài khoản."
      backTo="/login"
    >
      <header className="mb-6 border-b border-brand-border pb-5">
        <div className="flex items-start gap-3">
          <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />

          <div>
            <h2 className="text-base font-semibold text-brand-text">
              Tìm tài khoản của bạn
            </h2>

            <p className="mt-1 text-sm leading-5 text-brand-text-muted">
              Nhập email đã dùng để đăng ký Signify.
            </p>
          </div>
        </div>
      </header>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input
          id="forgot-password-email"
          label="Địa chỉ email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.com"
          leftIcon={<Mail className="h-4 w-4" />}
        />

        <div className="rounded-md border border-brand-border bg-brand-surface-container px-4 py-3">
          <p className="text-sm leading-5 text-brand-text-muted">
            Mã xác thực gồm 6 chữ số và chỉ được sử dụng một lần.
          </p>
        </div>

        <Button
          id="forgot-password-submit-btn"
          type="submit"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          leftIcon={<Send className="h-4 w-4" />}
        >
          {isSubmitting ? 'Đang gửi mã' : 'Gửi mã xác thực'}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => navigate('/login')}
        className="mt-6 w-full border-t border-brand-border pt-5 text-center text-sm font-semibold text-brand-primary hover:text-brand-primary-hover"
      >
        Quay lại đăng nhập
      </button>
    </AuthShell>
  );
}