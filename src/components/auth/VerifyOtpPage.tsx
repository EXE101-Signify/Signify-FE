import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import {
  MailCheck,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '../common';
import AuthShell from './AuthShell';
import OtpInput from './OtpInput';

type OtpFlow = 'register' | 'reset-password';

interface OtpRouteState {
  flow: OtpFlow;
  email: string;
  registration?: {
    fullName: string;
    email: string;
    password: string;
  };
}

const MOCK_OTP = '123456';
const RESEND_SECONDS = 60;

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as OtpRouteState | null;

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (
      !routeState?.email ||
      !['register', 'reset-password'].includes(routeState.flow)
    ) {
      navigate('/login', { replace: true });
    }
  }, [navigate, routeState]);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCooldown((currentValue) => currentValue - 1);
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [cooldown]);

  if (!routeState?.email) {
    return null;
  }

  const isRegisterFlow = routeState.flow === 'register';

  const handleVerify = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (otp.length !== 6) {
      setError('Vui lòng nhập đầy đủ mã OTP gồm 6 chữ số.');
      return;
    }

    if (otp !== MOCK_OTP) {
      setError('Mã OTP không chính xác. Vui lòng thử lại.');
      return;
    }

    setIsVerifying(true);

    window.setTimeout(() => {
      setIsVerifying(false);

      if (isRegisterFlow) {
        navigate('/login', {
          replace: true,
          state: {
            message:
              'Xác thực thành công. Tài khoản của bạn đã được tạo.',
          },
        });

        return;
      }

      navigate('/reset-password', {
        replace: true,
        state: {
          email: routeState.email,
          verified: true,
        },
      });
    }, 700);
  };

  const handleResendOtp = () => {
    if (cooldown > 0) {
      return;
    }

    setOtp('');
    setError('');
    setNotice('Mã OTP mới đã được gửi đến email của bạn.');
    setCooldown(RESEND_SECONDS);
  };

  return (
    <AuthShell
      title="Xác minh"
      highlight="email"
      subtitle={
        isRegisterFlow
          ? 'Hoàn tất bước xác minh tài khoản Signify.'
          : 'Xác minh yêu cầu đặt lại mật khẩu.'
      }
      backTo={
        isRegisterFlow ? '/register' : '/forgot-password'
      }
    >
      <header className="mb-6 border-b border-brand-border pb-5">
        <div className="flex items-start gap-3">
          <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />

          <div className="min-w-0">
            <h2 className="text-base font-semibold text-brand-text">
              Nhập mã xác thực
            </h2>

            <p className="mt-1 text-sm leading-5 text-brand-text-muted">
              Mã OTP đã được gửi đến
            </p>

            <p className="mt-1 break-all text-sm font-semibold text-brand-text">
              {routeState.email}
            </p>
          </div>
        </div>
      </header>

      <form className="space-y-5" onSubmit={handleVerify}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-brand-text">
            Mã OTP
          </label>

          <OtpInput
            value={otp}
            onChange={(value) => {
              setOtp(value);
              setError('');
              setNotice('');
            }}
            disabled={isVerifying}
          />
        </div>

        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">
            Mã OTP dùng để kiểm thử:{' '}
            <code className="font-mono font-semibold">
              {MOCK_OTP}
            </code>
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            {notice}
          </div>
        )}

        <Button
          id="verify-otp-submit-btn"
          type="submit"
          size="lg"
          fullWidth
          isLoading={isVerifying}
          disabled={otp.length !== 6}
          leftIcon={<ShieldCheck className="h-4 w-4" />}
        >
          {isVerifying ? 'Đang xác thực' : 'Xác nhận mã OTP'}
        </Button>
      </form>

      <div className="mt-6 border-t border-brand-border pt-5 text-center">
        <p className="text-sm text-brand-text-muted">
          Bạn chưa nhận được mã?
        </p>

        <button
          type="button"
          disabled={cooldown > 0}
          onClick={handleResendOtp}
          className="mt-2 inline-flex items-center justify-center gap-2 text-sm font-semibold text-brand-primary hover:text-brand-primary-hover disabled:cursor-not-allowed disabled:text-brand-text-muted"
        >
          <RefreshCw className="h-4 w-4" />

          {cooldown > 0
            ? `Gửi lại sau ${cooldown} giây`
            : 'Gửi lại mã OTP'}
        </button>
      </div>
    </AuthShell>
  );
}