import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Mail,
  ShieldCheck,
  User,
  UserCheck,
  UserPlus,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import type { Screen } from '../types';
import GoogleButton from './auth/GoogleButton';
import GoogleAuthModal, { type GoogleUserInfo } from './auth/GoogleAuthModal';
import { validateEmail, validatePassword } from '../utils/validation';
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
  onNavigate,
  onLoginSuccess,
}: AuthPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LoginLocationState | null;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

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

  return (
    <div
      id="auth-page-root"
      className="relative flex min-h-screen flex-col justify-center bg-brand-bg bg-dot-grid py-12 font-sans text-brand-text sm:px-6 lg:px-8"
    >
      <div className="absolute left-6 top-6">
        <button
          id="back-to-home-btn"
          type="button"
          onClick={() => onNavigate('landing')}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-brand-border bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-brand-text-muted shadow-sm transition-colors hover:text-brand-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại Trang chủ
        </button>
      </div>

      <div className="text-center sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-md shadow-brand-primary/10">
          <ShieldCheck className="h-6 w-6" />
        </div>

        <h1 className="mt-6 text-3xl font-black uppercase tracking-tight text-brand-text">
          Chào mừng{' '}
          <span className="text-brand-primary">trở lại!</span>
        </h1>

        <p className="mt-2 text-xs uppercase tracking-widest text-brand-text-muted">
          Đăng nhập vào hệ thống{' '}
          <span className="font-extrabold text-brand-primary">
            SignBridge
          </span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="relative overflow-hidden rounded-[24px] border border-brand-border bg-white px-4 py-8 shadow-md sm:px-10"
        >
          <div className="absolute inset-x-0 top-0 h-1.5 bg-brand-primary" />

          {locationState?.message && (
            <div
              role="status"
              className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

              <p className="text-xs font-semibold leading-relaxed text-emerald-700">
                {locationState.message}
              </p>
            </div>
          )}

          {globalError && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="font-medium">{globalError}</span>
            </div>
          )}

          {/* Quick Sandbox Login Box */}
          <div className="mb-6 flex flex-col items-center rounded-2xl border border-brand-border bg-brand-bg p-4.5 text-center">
            <UserCheck className="mb-1 h-6 w-6 text-brand-primary" />

            <h2 className="text-xs font-bold uppercase tracking-wide text-brand-primary">
              Đăng nhập nhanh (Sandbox)
            </h2>

            <p className="mb-3.5 mt-0.5 text-[10px] font-semibold leading-relaxed text-brand-text-muted">
              Bỏ qua nhập mật khẩu để lấy tài khoản Pro dùng thử của &quot;Thanh Liêm&quot;
            </p>

            <button
              id="quick-login-sandbox-btn"
              type="button"
              onClick={() => {
                setUsername('thanhliem');
                setPassword('••••••••');
                onLoginSuccess();
              }}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-primary py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-brand-primary/15 transition-all hover:bg-brand-primary-hover"
            >
              Chọn tài khoản Thanh Liêm (Pro)
            </button>
          </div>

          {/* Google Sign In Option */}
          <div className="mb-6">
            <GoogleButton
              label="Tiếp tục bằng Google"
              onClick={() => setIsGoogleModalOpen(true)}
            />

            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-brand-border" />
              </div>

              <div className="relative flex justify-center text-[10px] font-bold uppercase">
                <span className="bg-white px-2 text-brand-text-muted/60">
                  Hoặc bằng Tên đăng nhập & Mật khẩu
                </span>
              </div>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label
                htmlFor="auth-username-input"
                className="block text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-1"
              >
                Tên đăng nhập
              </label>

              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted/65" />

                <input
                  id="auth-username-input"
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
                  className={`block w-full rounded-xl border bg-brand-bg py-3 pl-10 pr-4 text-xs font-bold text-brand-text outline-none transition-all focus:bg-white focus:ring-2 ${
                    fieldErrors.username
                      ? 'border-brand-error focus:ring-brand-error/20'
                      : 'border-brand-border focus:ring-brand-primary'
                  }`}
                  placeholder="Nhập tên đăng nhập của bạn"
                />
              </div>
              {fieldErrors.username && (
                <p className="mt-1 text-[11px] font-semibold text-brand-error">
                  {fieldErrors.username}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="auth-password-input"
                className="block text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-1"
              >
                Mật khẩu đăng nhập
              </label>

              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted/65" />

                <input
                  id="auth-password-input"
                  type={showPassword ? 'text' : 'password'}
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
                  className={`block w-full rounded-xl border bg-brand-bg py-3 pl-10 pr-10 text-xs font-bold text-brand-text outline-none transition-all focus:bg-white focus:ring-2 ${
                    fieldErrors.password
                      ? 'border-brand-error focus:ring-brand-error/20'
                      : 'border-brand-border focus:ring-brand-primary'
                  }`}
                  placeholder="••••••••"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted/70 hover:text-brand-text cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-[11px] font-semibold text-brand-error">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-brand-border-high text-brand-primary focus:ring-brand-primary"
                />

                <label
                  htmlFor="remember-me"
                  className="ml-2 block cursor-pointer text-xs font-bold text-brand-text-muted"
                >
                  Ghi nhớ tài khoản
                </label>
              </div>

              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="cursor-pointer text-xs font-bold text-brand-primary hover:text-brand-primary-hover"
              >
                Quên mật khẩu?
              </button>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="flex w-full cursor-pointer justify-center rounded-xl border border-transparent bg-brand-primary px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-brand-primary/10 transition-all hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? 'Đang xác thực...'
                : 'Đăng nhập tài khoản'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 border-t border-brand-border pt-6">
            <UserPlus className="h-4 w-4 text-brand-text-muted" />

            <p className="text-xs font-semibold text-brand-text-muted">
              Chưa có tài khoản?
            </p>

            <button
              type="button"
              onClick={() => navigate('/register')}
              className="cursor-pointer text-xs font-extrabold text-brand-primary hover:text-brand-primary-hover"
            >
              Đăng ký ngay
            </button>
          </div>
        </motion.div>
      </div>

      {/* Google Login Modal */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSuccess={handleGoogleSuccess}
      />
    </div>
  );
}