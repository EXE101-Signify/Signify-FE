import { useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  UserCheck,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import type { Screen } from '../types';
import AuthShell from './auth/AuthShell';
import { Button, Input } from './common';
import { validatePassword } from '../utils/validation';
import { authApi } from '../services/authApi';

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

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  const [globalError, setGlobalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberAccount, setRememberAccount] = useState(true);

  const handleBlurField = (field: 'username' | 'password') => {
    setFieldErrors((prev) => {
      const updated = { ...prev };
      if (field === 'username') {
        if (!username.trim()) updated.username = 'Vui lòng nhập tên đăng nhập.';
        else delete updated.username;
      }
      if (field === 'password') {
        const err = validatePassword(password);
        if (err) updated.password = err;
        else delete updated.password;
      }
      return updated;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGlobalError('');

    const usernameErr = !username.trim() ? 'Vui lòng nhập tên đăng nhập.' : null;
    const passErr = validatePassword(password);

    if (usernameErr || passErr) {
      setFieldErrors({
        username: usernameErr || undefined,
        password: passErr || undefined,
      });
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const res = await authApi.login({
        username: username.trim(),
        password: password,
      });

      if (res.success) {
        onLoginSuccess();
      } else {
        setGlobalError('Tên đăng nhập hoặc mật khẩu không chính xác.');
      }
    } catch (err: unknown) {
      const status = typeof err === 'object' && err !== null && 'status' in err
        ? (err as { status?: number }).status
        : undefined;
      setGlobalError(status === 401 || status === 403
        ? 'Tên đăng nhập hoặc mật khẩu không chính xác.'
        : 'Không thể kết nối đến máy chủ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Chào mừng"
      highlight="trở lại"
      subtitle="Đăng nhập để tiếp tục sử dụng Signify."
      backTo="/"
      pageId="auth-login-page"
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

      {globalError && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-600"
        >
          <span className="font-medium">{globalError}</span>
        </div>
      )}

      <form className="space-y-3.5" onSubmit={handleSubmit}>
        <Input
          id="auth-username-input"
          label="Tên đăng nhập"
          type="text"
          required
          autoComplete="username"
          value={username}
          onChange={(event) => {
            setUsername(event.target.value);
            setFieldErrors((prev) => ({ ...prev, username: event.target.value.trim() ? undefined : prev.username }));
          }}
          onBlur={() => handleBlurField('username')}
          placeholder="Nhập tên đăng nhập của bạn"
          leftIcon={<Mail className="h-4 w-4" />}
          error={fieldErrors.username}
        />

        <Input
          id="auth-password-input"
          label="Mật khẩu"
          type={showPassword ? 'text' : 'password'}
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setFieldErrors((prev) => ({ ...prev, password: event.target.value ? undefined : prev.password }));
          }}
          onBlur={() => handleBlurField('password')}
          placeholder="••••••••"
          leftIcon={<Lock className="h-4 w-4" />}
          rightIcon={(
            <button
              type="button"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              aria-pressed={showPassword}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setShowPassword((visible) => !visible)}
              className="flex h-11 w-11 items-center justify-center rounded-md text-brand-text-muted transition-colors hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          )}
          error={fieldErrors.password}
        />

        <div className="flex items-center justify-between gap-4">
          <label
            htmlFor="remember-me"
            className="flex cursor-pointer items-center gap-2 text-sm text-brand-text-muted"
          >
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberAccount}
              onChange={(event) => setRememberAccount(event.target.checked)}
              className="h-5 w-5 rounded border-brand-border-high text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
            />

            Ghi nhớ tài khoản
          </label>

          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="inline-flex min-h-11 items-center rounded px-1 text-sm font-semibold text-brand-primary underline decoration-transparent underline-offset-4 transition-colors hover:text-brand-primary-hover hover:decoration-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
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
          disabled={isSubmitting}
          leftIcon={<LogIn className="h-4 w-4" />}
        >
          {isSubmitting ? 'Đang đăng nhập' : 'Đăng nhập'}
        </Button>
      </form>

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
