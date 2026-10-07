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
import GoogleAuthModal, { type GoogleUserInfo } from './auth/GoogleAuthModal';
import { Button, Input } from './common';
import { validatePassword } from '../utils/validation';
import { authApi } from '../services/authApi';
import { setStoredSession, type UserDTO, type TokenDTO } from '../services/apiClient';

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
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

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
    const passErr = password === '••••••••' ? null : validatePassword(password);

    if (usernameErr || passErr) {
      setFieldErrors({
        username: usernameErr || undefined,
        password: passErr || undefined,
      });
      setGlobalError('Thông tin đăng nhập không hợp lệ. Vui lòng kiểm tra lại.');
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
        setGlobalError(res.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (err: any) {
      setGlobalError(
        err.message || 'Đăng nhập không thành công. Mật khẩu hoặc tên đăng nhập không đúng.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = (userInfo: GoogleUserInfo) => {
    const userDTO: UserDTO = {
      userId: Date.now(),
      username: userInfo.email.split('@')[0],
      role: 'USER',
      emailVerified: true,
      email: userInfo.email,
      firstName: userInfo.name.split(' ')[0],
      lastName: userInfo.name.split(' ').slice(1).join(' '),
      avatar: userInfo.avatar,
    };
    const tokenDTO: TokenDTO = {
      accessToken: `mock_gg_access_token_${Date.now()}`,
      refreshToken: `mock_gg_refresh_token_${Date.now()}`,
      tokenType: 'Bearer',
      accessExpiresAt: Date.now() + 900000,
      refreshExpiresAt: Date.now() + 604800000,
    };
    setStoredSession(tokenDTO, userDTO);
    onLoginSuccess();
  };

  const handleQuickLogin = () => {
    setUsername('thanhliem');
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

      {globalError && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-600"
        >
          <span className="font-medium">{globalError}</span>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input
          id="auth-username-input"
          label="Tên đăng nhập"
          type="text"
          required
          autoComplete="username"
          value={username}
          onChange={(event) => {
            setUsername(event.target.value);
            if (fieldErrors.username) {
              setFieldErrors((prev) => ({ ...prev, username: undefined }));
            }
          }}
          onBlur={() => handleBlurField('username')}
          placeholder="Nhập tên đăng nhập của bạn"
          leftIcon={<Mail className="h-4 w-4" />}
          error={fieldErrors.username}
        />

        <Input
          id="auth-password-input"
          label="Mật khẩu"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            if (fieldErrors.password) {
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }
          }}
          onBlur={() => handleBlurField('password')}
          placeholder="••••••••"
          leftIcon={<Lock className="h-4 w-4" />}
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

      {/* Google Login Modal */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSuccess={handleGoogleSuccess}
      />
    </AuthShell>
  );
}