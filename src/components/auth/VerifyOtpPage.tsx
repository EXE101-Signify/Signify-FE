import { useEffect, useState, type FormEvent } from 'react';
import { MailCheck, RefreshCw } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';
import OtpInput from './OtpInput';
import { emailApi } from '../../services/emailApi';
import { authApi } from '../../services/authApi';

type OtpFlow = 'register' | 'reset-password';

interface OtpRouteState {
  flow: OtpFlow;
  email: string;
  registration?: {
    username: string;
    fullName: string;
    firstName?: string;
    lastName?: string;
    email: string;
    password: string;
    avatarFile?: File | null;
  };
}

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

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (otp.length !== 6) {
      setError('Vui lòng nhập đầy đủ mã OTP gồm 6 chữ số.');
      return;
    }

    setIsVerifying(true);

    try {
      if (isRegisterFlow) {
        // 1. Verify OTP
        const verifyRes = await emailApi.verifyRegisterOtp(routeState.email, otp);
        if (!verifyRes.success) {
          setError(verifyRes.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
          return;
        }

        // 2. Perform account registration
        const regData = routeState.registration;
        if (regData) {
          const regRes = await authApi.register(
            {
              username: regData.username,
              password: regData.password,
              email: regData.email,
              firstName: regData.firstName,
              lastName: regData.lastName,
            },
            regData.avatarFile
          );

          if (regRes.success) {
            navigate('/login', {
              replace: true,
              state: {
                message: 'Xác thực & đăng ký thành công! Vui lòng đăng nhập tài khoản mới.',
              },
            });
            return;
          } else {
            setError(regRes.message || 'Đăng ký tài khoản không thành công.');
            return;
          }
        }
      } else {
        // For reset password flow, pass email and otp to ResetPasswordPage
        navigate('/reset-password', {
          replace: true,
          state: {
            email: routeState.email,
            otp,
            verified: true,
          },
        });
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi xác thực mã OTP. Vui lòng kiểm tra lại.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) {
      return;
    }

    setOtp('');
    setError('');
    setNotice('');

    try {
      const res = await emailApi.resendOtp(routeState.email);
      if (res.success) {
        setNotice('Mã OTP mới đã được gửi đến email của bạn.');
        setCooldown(RESEND_SECONDS);
      } else {
        setError(res.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại.');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối khi gửi lại mã OTP.');
    }
  };

  return (
    <AuthShell
      title="Xác thực"
      highlight="OTP"
      subtitle={
        isRegisterFlow
          ? 'Xác minh email đăng ký'
          : 'Xác minh yêu cầu đặt lại mật khẩu'
      }
      backTo={isRegisterFlow ? '/register' : '/forgot-password'}
    >
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary-light text-brand-primary">
          <MailCheck className="h-5 w-5" />
        </div>

        <h2 className="mt-3 text-sm font-extrabold uppercase tracking-wide text-brand-text">
          Nhập mã xác thực
        </h2>

        <p className="mt-1 text-xs leading-relaxed text-brand-text-muted">
          Mã OTP gồm 6 chữ số đã được gửi đến
        </p>

        <p className="mt-1 break-all text-xs font-extrabold text-brand-primary">
          {routeState.email}
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleVerify}>
        <OtpInput
          value={otp}
          onChange={(value) => {
            setOtp(value);
            setError('');
            setNotice('');
          }}
          disabled={isVerifying}
        />

        <div className="rounded-xl border border-brand-primary/20 bg-brand-primary-light/40 px-4 py-3 text-center">
          <p className="text-[11px] font-semibold text-brand-primary">
            Vui lòng kiểm tra hộp thư đến (hoặc Spam) của email để lấy mã OTP 6 chữ số.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700"
          >
            {notice}
          </div>
        )}

        <button
          id="verify-otp-submit-btn"
          type="submit"
          disabled={isVerifying || otp.length !== 6}
          className="flex w-full cursor-pointer justify-center rounded-xl border border-transparent bg-brand-primary px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-brand-primary/10 transition-all hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isVerifying ? 'Đang xác thực...' : 'Xác nhận mã OTP'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs font-semibold text-brand-text-muted">
          Bạn chưa nhận được mã?
        </p>

        <button
          type="button"
          disabled={cooldown > 0}
          onClick={handleResendOtp}
          className="mt-2 inline-flex cursor-pointer items-center justify-center gap-2 text-xs font-extrabold text-brand-primary hover:text-brand-primary-hover disabled:cursor-not-allowed disabled:text-brand-text-muted/60"
        >
          <RefreshCw className="h-3.5 w-3.5" />

          {cooldown > 0
            ? `Gửi lại sau ${cooldown} giây`
            : 'Gửi lại mã OTP'}
        </button>
      </div>
    </AuthShell>
  );
}