import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import { KeyRound, Lock, Save } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button, Input } from '../common';
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
  const routeState =
    location.state as ResetPasswordRouteState | null;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');
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

    // Mock API cập nhật mật khẩu mới.
    window.setTimeout(() => {
      setIsSubmitting(false);

      navigate('/login', {
        replace: true,
        state: {
          message:
            'Đổi mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.',
        },
      });
    }, 700);
  };

  return (
    <AuthShell
      title="Đặt mật khẩu"
      highlight="mới"
      subtitle="Hoàn tất quá trình khôi phục tài khoản."
      backTo="/login"
    >
      <header className="mb-6 border-b border-brand-border pb-5">
        <div className="flex items-start gap-3">
          <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />

          <div className="min-w-0">
            <h2 className="text-base font-semibold text-brand-text">
              Tạo mật khẩu mới
            </h2>

            <p className="mt-1 text-sm leading-5 text-brand-text-muted">
              Tài khoản đã được xác thực:
            </p>

            <p className="mt-1 break-all text-sm font-semibold text-brand-text">
              {routeState.email}
            </p>
          </div>
        </div>
      </header>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input
          id="reset-password"
          label="Mật khẩu mới"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Tối thiểu 8 ký tự"
          helperText="Không sử dụng lại mật khẩu cũ."
          leftIcon={<Lock className="h-4 w-4" />}
        />

        <Input
          id="reset-confirm-password"
          label="Xác nhận mật khẩu mới"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) =>
            setConfirmPassword(event.target.value)
          }
          placeholder="Nhập lại mật khẩu mới"
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
          id="reset-password-submit-btn"
          type="submit"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          leftIcon={<Save className="h-4 w-4" />}
        >
          {isSubmitting
            ? 'Đang cập nhật'
            : 'Cập nhật mật khẩu'}
        </Button>
      </form>
    </AuthShell>
  );
}