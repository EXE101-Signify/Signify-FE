import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, ArrowLeft, Mail, Lock, ShieldCheck, KeyRound, UserCheck } from 'lucide-react';
import { Screen } from '../types';

interface AuthPageProps {
  onNavigate: (screen: Screen) => void;
  onLoginSuccess: () => void;
}

export default function AuthPage({ onNavigate, onLoginSuccess }: AuthPageProps) {
  const [email, setEmail] = useState('thanhliem@signbridge.vn');
  const [password, setPassword] = useState('••••••••');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate real auth call
    setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess();
    }, 800);
  };

  return (
    <div id="auth-page-root" className="min-h-screen bg-brand-bg text-brand-text font-sans flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative bg-dot-grid">
      {/* Back to Home Button */}
      <div className="absolute top-6 left-6">
        <button 
          id="back-to-home-btn"
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-text-muted hover:text-brand-primary transition-colors bg-white px-4 py-2.5 rounded-xl border border-brand-border shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại Trang chủ
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center text-white shadow-md shadow-brand-primary/10">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="mt-6 text-3xl font-black tracking-tight text-brand-text uppercase">
          Chào mừng <span className="text-brand-primary">trở lại!</span>
        </h2>
        <p className="mt-2 text-xs uppercase tracking-widest text-brand-text-muted">
          Đăng nhập vào hệ thống <span className="font-extrabold text-brand-primary">SignBridge</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-brand-border shadow-md rounded-[24px] sm:px-10 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-brand-primary"></div>

          {/* Quick Sandbox Login Box */}
          <div className="mb-6 p-4.5 bg-brand-bg border border-brand-border rounded-2xl flex flex-col items-center text-center">
            <UserCheck className="w-6 h-6 text-brand-primary mb-1" />
            <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wide">Đăng nhập nhanh</h4>
            <p className="text-[10px] text-brand-text-muted mt-0.5 mb-3.5 leading-relaxed font-semibold">Bỏ qua nhập mật khẩu để lấy tài khoản Pro của "Thanh Liêm"</p>
            <button
              id="quick-login-sandbox-btn"
              type="button"
              onClick={() => {
                setEmail('thanhliem@signbridge.vn');
                setPassword('••••••••');
                onLoginSuccess();
              }}
              className="w-full py-3 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-brand-primary/15"
            >
              Chọn tài khoản Thanh Liêm (Pro)
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">
                Địa chỉ Email
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-text-muted/65">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-brand-bg border border-brand-border rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-brand-primary text-brand-text outline-none transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">
                Mật khẩu đăng nhập
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-text-muted/65">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="auth-password-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-brand-bg border border-brand-border rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-brand-primary text-brand-text outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-brand-border-high rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-brand-text-muted font-bold cursor-pointer">
                  Ghi nhớ tài khoản
                </label>
              </div>

              <div className="text-xs">
                <a href="#" className="font-bold text-brand-primary hover:text-brand-primary-hover">
                  Quên mật khẩu?
                </a>
              </div>
            </div>

            <div>
              <button
                id="auth-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-brand-primary hover:bg-brand-primary-hover transition-all cursor-pointer shadow-md shadow-brand-primary/10"
              >
                {isSubmitting ? 'Đang xác thực...' : 'Đăng nhập tài khoản'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-brand-border" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold">
                <span className="px-2 bg-white text-brand-text-muted/60">Hoặc tiếp tục với</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                id="oauth-option-google"
                type="button"
                onClick={() => onLoginSuccess()}
                className="w-full inline-flex justify-center py-2.5 px-4 rounded-xl border border-brand-border bg-white text-xs font-bold text-brand-text hover:bg-brand-bg transition-all cursor-pointer"
              >
                Google
              </button>
              <button
                id="oauth-option-apple"
                type="button"
                onClick={() => onLoginSuccess()}
                className="w-full inline-flex justify-center py-2.5 px-4 rounded-xl border border-brand-border bg-white text-xs font-bold text-brand-text hover:bg-brand-bg transition-all cursor-pointer"
              >
                Apple ID
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
