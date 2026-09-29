import { useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  Lock,
  LogIn,
  Mail,
  UserCheck,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import type { Screen } from '../types';
import AuthShell from './auth/AuthShell';
import { Button, Input } from './common';

interface AuthPageProps {
  onNavigate: (screen: Screen) => void;
  onLoginSuccess: () => void;
}

interface LoginLocationState {
  message?: string;
}

export default function AuthPage({
  onLoginSuccess,
}: AuthPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LoginLocationState | null;

  const [email, setEmail] = useState(
    'thanhliem@Signify.vn',
  );
  const [password, setPassword] = useState('••••••••');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    window.setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess();
    }, 800);
  };

  const handleQuickLogin = () => {
    setEmail('thanhliem@Signify.vn');
    setPassword('••••••••');
    onLoginSuccess();
  };

  return (
    <AuthShell
      title="Chào mừng"
      highlight="trở lại"
      subtitle="Đăng nhập để tiếp tục sử dụng Signify."
      backTo="/"
    >
      {locationState?.message && (
        <div
          role="status"
          className="mb-5 flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />

          <p className="text-sm leading-5 text-emerald-800">
            {locationState.message}
          </p>
        </div>
      )}

      {/* <section className="mb-6 border-b border-brand-border pb-6">
        <div className="flex items-start gap-3">
          <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />

          <div>
            <h2 className="text-sm font-semibold text-brand-text">
              Tài khoản dùng thử
            </h2>

            <p className="mt-1 text-sm leading-5 text-brand-text-muted">
              Truy cập nhanh bằng tài khoản Pro của Thanh Liêm.
            </p>
          </div>
        </div>

        <Button
          id="quick-login-sandbox-btn"
          type="button"
          variant="outline"
          fullWidth
          className="mt-4"
          onClick={handleQuickLogin}
        >
          Tiếp tục với tài khoản Thanh Liêm
        </Button>
      </section> */}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input
          id="auth-email-input"
          label="Địa chỉ email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.com"
          leftIcon={<Mail className="h-4 w-4" />}
        />

        <Input
          id="auth-password-input"
          label="Mật khẩu"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Nhập mật khẩu"
          leftIcon={<Lock className="h-4 w-4" />}
        />

        <div className="flex items-center justify-between gap-4">
          <label
            htmlFor="remember-me"
            className="flex cursor-pointer items-center gap-2 text-sm text-brand-text-muted"
          >
            <input
              id="remember-me"
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-brand-border-high text-brand-primary focus:ring-brand-primary"
            />

            Ghi nhớ tài khoản
          </label>

          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-sm font-semibold text-brand-primary hover:text-brand-primary-hover"
          >
            Quên mật khẩu?
          </button>
        </div>

        <Button
          id="auth-submit-btn"
          type="submit"
          fullWidth
          size="lg"
          isLoading={isSubmitting}
          leftIcon={<LogIn className="h-4 w-4" />}
        >
          {isSubmitting ? 'Đang đăng nhập' : 'Đăng nhập'}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-brand-border" />
        <span className="text-xs text-brand-text-muted">
          hoặc
        </span>
        <span className="h-px flex-1 bg-brand-border" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          id="oauth-option-google"
          type="button"
          variant="outline"
          onClick={onLoginSuccess}
        >
          Google
        </Button>

        <Button
          id="oauth-option-apple"
          type="button"
          variant="outline"
          onClick={onLoginSuccess}
        >
          Apple ID
        </Button>
      </div>

      <p className="mt-6 border-t border-brand-border pt-5 text-center text-sm text-brand-text-muted">
        Chưa có tài khoản?{' '}
        <button
          type="button"
          onClick={() => navigate('/register')}
          className="font-semibold text-brand-primary hover:text-brand-primary-hover"
        >
          Đăng ký ngay
        </button>
      </p>
    </AuthShell>
  );
}