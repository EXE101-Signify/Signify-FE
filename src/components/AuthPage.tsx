import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import type { Screen } from '../types';

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

  const [email, setEmail] = useState('thanhliem@signbridge.vn');
  const [password, setPassword] = useState('••••••••');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    // Mock API đăng nhập.
    window.setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess();
    }, 800);
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

          <div className="mb-6 flex flex-col items-center rounded-2xl border border-brand-border bg-brand-bg p-4.5 text-center">
            <UserCheck className="mb-1 h-6 w-6 text-brand-primary" />

            <h2 className="text-xs font-bold uppercase tracking-wide text-brand-primary">
              Đăng nhập nhanh
            </h2>

            <p className="mb-3.5 mt-0.5 text-[10px] font-semibold leading-relaxed text-brand-text-muted">
              Bỏ qua nhập mật khẩu để lấy tài khoản Pro của
              &quot;Thanh Liêm&quot;
            </p>

            <button
              id="quick-login-sandbox-btn"
              type="button"
              onClick={() => {
                setEmail('thanhliem@signbridge.vn');
                setPassword('••••••••');
                onLoginSuccess();
              }}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-primary py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-brand-primary/15 transition-all hover:bg-brand-primary-hover"
            >
              Chọn tài khoản Thanh Liêm (Pro)
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="auth-email-input"
                className="block text-[10px] font-bold uppercase tracking-widest text-brand-text-muted"
              >
                Địa chỉ email
              </label>

              <div className="relative mt-1.5 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-brand-text-muted/65">
                  <Mail className="h-4 w-4" />
                </div>

                <input
                  id="auth-email-input"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="block w-full rounded-xl border border-brand-border bg-brand-bg py-3 pl-10 pr-4 text-xs font-bold text-brand-text outline-none transition-all focus:bg-white focus:ring-2 focus:ring-brand-primary"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="auth-password-input"
                className="block text-[10px] font-bold uppercase tracking-widest text-brand-text-muted"
              >
                Mật khẩu đăng nhập
              </label>

              <div className="relative mt-1.5 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-brand-text-muted/65">
                  <Lock className="h-4 w-4" />
                </div>

                <input
                  id="auth-password-input"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="block w-full rounded-xl border border-brand-border bg-brand-bg py-3 pl-10 pr-4 text-xs font-bold text-brand-text outline-none transition-all focus:bg-white focus:ring-2 focus:ring-brand-primary"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  defaultChecked
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

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-brand-border" />
              </div>

              <div className="relative flex justify-center text-[10px] font-bold uppercase">
                <span className="bg-white px-2 text-brand-text-muted/60">
                  Hoặc tiếp tục với
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                id="oauth-option-google"
                type="button"
                onClick={onLoginSuccess}
                className="inline-flex w-full cursor-pointer justify-center rounded-xl border border-brand-border bg-white px-4 py-2.5 text-xs font-bold text-brand-text transition-all hover:bg-brand-bg"
              >
                Google
              </button>

              <button
                id="oauth-option-apple"
                type="button"
                onClick={onLoginSuccess}
                className="inline-flex w-full cursor-pointer justify-center rounded-xl border border-brand-border bg-white px-4 py-2.5 text-xs font-bold text-brand-text transition-all hover:bg-brand-bg"
              >
                Apple ID
              </button>
            </div>
          </div>

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
    </div>
  );
}