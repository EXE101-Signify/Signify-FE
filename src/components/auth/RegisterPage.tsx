import { useState, type FormEvent } from 'react';
import { Lock, Mail, User, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button, Input } from '../common';
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

  return (
    <AuthShell
      title="Tạo"
      highlight="tài khoản"
      subtitle="Điền thông tin bên dưới để bắt đầu sử dụng Signify."
      backTo="/login"
    >
      <header className="mb-6 border-b border-brand-border pb-5">
        <div className="flex items-start gap-3">
          <UserPlus className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />

          <div>
            <h2 className="text-base font-semibold text-brand-text">
              Thông tin đăng ký
            </h2>

            <p className="mt-1 text-sm leading-5 text-brand-text-muted">
              Chúng tôi sẽ gửi mã xác thực đến email của bạn.
            </p>
          </div>
        </div>
      </header>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input
          id="register-full-name"
          label="Họ và tên"
          type="text"
          required
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Nguyễn Văn A"
          leftIcon={<User className="h-4 w-4" />}
        />

        <Input
          id="register-email"
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
          id="register-password"
          label="Mật khẩu"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Tối thiểu 8 ký tự"
          helperText="Sử dụng ít nhất 8 ký tự."
          leftIcon={<Lock className="h-4 w-4" />}
        />

        <Input
          id="register-confirm-password"
          label="Xác nhận mật khẩu"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) =>
            setConfirmPassword(event.target.value)
          }
          placeholder="Nhập lại mật khẩu"
          leftIcon={<Lock className="h-4 w-4" />}
        />

        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <Button
          id="register-submit-btn"
          type="submit"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          leftIcon={<UserPlus className="h-4 w-4" />}
        >
          {isSubmitting ? 'Đang gửi mã OTP' : 'Đăng ký'}
        </Button>
      </form>

      <p className="mt-6 border-t border-brand-border pt-5 text-center text-sm text-brand-text-muted">
        Đã có tài khoản?{' '}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="font-semibold text-brand-primary hover:text-brand-primary-hover"
        >
          Đăng nhập
        </button>
      </p>
    </AuthShell>
  );
}