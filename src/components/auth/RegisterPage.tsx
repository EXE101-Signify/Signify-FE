import { useState, type FormEvent, type ChangeEvent } from 'react';
import { Eye, EyeOff, Lock, Mail, User, UserPlus, CheckCircle2, AlertCircle, Upload, AtSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';
import GoogleButton from './GoogleButton';
import GoogleAuthModal, { type GoogleUserInfo } from './GoogleAuthModal';
import { emailApi } from '../../services/emailApi';
import { setStoredSession, type UserDTO, type TokenDTO } from '../../services/apiClient';
import {
  calculatePasswordStrength,
  validateConfirmPassword,
  validateEmail,
  validateFullName,
  validatePassword,
} from '../../utils/validation';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});

  const [globalError, setGlobalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  const passwordStrength = calculatePasswordStrength(password);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleBlurField = (field: string) => {
    setFieldErrors((prev) => {
      const updated = { ...prev };
      if (field === 'username' && username.trim()) {
        if (username.length < 3) updated.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
        else delete updated.username;
      }
      if (field === 'fullName') {
        const err = validateFullName(fullName);
        if (err) updated.fullName = err;
        else delete updated.fullName;
      }
      if (field === 'email') {
        const err = validateEmail(email);
        if (err) updated.email = err;
        else delete updated.email;
      }
      if (field === 'password') {
        const err = validatePassword(password);
        if (err) updated.password = err;
        else delete updated.password;
      }
      if (field === 'confirmPassword') {
        const err = validateConfirmPassword(password, confirmPassword);
        if (err) updated.confirmPassword = err;
        else delete updated.confirmPassword;
      }
      return updated;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGlobalError('');

    const nameErr = validateFullName(fullName);
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    const confirmErr = validateConfirmPassword(password, confirmPassword);
    const termsErr = !agreeTerms ? 'Bạn cần đồng ý với Điều khoản dịch vụ để tiếp tục.' : null;

    const finalUsername = username.trim() || email.split('@')[0] || `user_${Date.now()}`;

    if (nameErr || emailErr || passErr || confirmErr || termsErr) {
      setFieldErrors({
        fullName: nameErr || undefined,
        email: emailErr || undefined,
        password: passErr || undefined,
        confirmPassword: confirmErr || undefined,
        terms: termsErr || undefined,
      });
      setGlobalError('Vui lòng kiểm tra và sửa các thông tin bị lỗi bên dưới.');
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      // Send OTP for registration email verification
      const res = await emailApi.sendRegisterOtp(email);

      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      if (res.success) {
        navigate('/verify-otp', {
          state: {
            flow: 'register',
            email,
            registration: {
              username: finalUsername,
              fullName: fullName.trim(),
              firstName,
              lastName,
              email: email.trim(),
              password,
              avatarFile,
            },
          },
        });
      } else {
        setGlobalError(res.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');
      }
    } catch (err: any) {
      setGlobalError(err.message || 'Lỗi gửi mã OTP. Vui lòng kiểm tra lại email.');
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

    navigate('/dashboard', {
      replace: true,
      state: {
        toastMessage: `Đăng ký & Đăng nhập thành công với tài khoản Google ${userInfo.name}!`,
      },
    });
  };

  return (
    <AuthShell
      title="Tạo"
      highlight="tài khoản"
      subtitle="Đăng ký tài khoản SignBridge"
      backTo="/login"
    >
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary-light text-brand-primary">
          <UserPlus className="h-5 w-5" />
        </div>

        <h2 className="mt-3 text-sm font-extrabold uppercase tracking-wide text-brand-text">
          Thông tin đăng ký
        </h2>

        <p className="mt-1 text-xs leading-relaxed text-brand-text-muted">
          Bắt đầu hành trình giao tiếp bằng ngôn ngữ ký hiệu
        </p>
      </div>

      {/* Google Quick Sign Up */}
      <div className="mb-6">
        <GoogleButton
          label="Đăng ký nhanh bằng Google"
          onClick={() => setIsGoogleModalOpen(true)}
        />

        <div className="relative mt-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-brand-border" />
          </div>
          <div className="relative flex justify-center text-[10px] font-bold uppercase">
            <span className="bg-white px-2 text-brand-text-muted/60">
              Hoặc điền form đăng ký
            </span>
          </div>
        </div>
      </div>

      {globalError && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="font-medium">{globalError}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {/* Username */}
        <div>
          <label
            htmlFor="register-username"
            className="block text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-1"
          >
            Tên đăng nhập (Username)
          </label>

          <div className="relative">
            <AtSign className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted/65" />

            <input
              id="register-username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (fieldErrors.username) {
                  setFieldErrors((prev) => ({ ...prev, username: undefined }));
                }
              }}
              onBlur={() => handleBlurField('username')}
              placeholder="ví dụ: alice123 (tùy chọn)"
              className={`block w-full rounded-xl border bg-brand-bg py-3 pl-10 pr-4 text-xs font-bold text-brand-text outline-none transition-all focus:bg-white focus:ring-2 ${
                fieldErrors.username
                  ? 'border-brand-error focus:ring-brand-error/20'
                  : 'border-brand-border focus:ring-brand-primary'
              }`}
            />
          </div>
          {fieldErrors.username && (
            <p className="mt-1 text-[11px] font-semibold text-brand-error">
              {fieldErrors.username}
            </p>
          )}
        </div>

        {/* Full Name */}
        <div>
          <label
            htmlFor="register-full-name"
            className="block text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-1"
          >
            Họ và tên
          </label>

          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted/65" />

            <input
              id="register-full-name"
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (fieldErrors.fullName) {
                  setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                }
              }}
              onBlur={() => handleBlurField('fullName')}
              placeholder="Nguyễn Văn A"
              className={`block w-full rounded-xl border bg-brand-bg py-3 pl-10 pr-4 text-xs font-bold text-brand-text outline-none transition-all focus:bg-white focus:ring-2 ${
                fieldErrors.fullName
                  ? 'border-brand-error focus:ring-brand-error/20'
                  : 'border-brand-border focus:ring-brand-primary'
              }`}
            />
          </div>
          {fieldErrors.fullName && (
            <p className="mt-1 text-[11px] font-semibold text-brand-error">
              {fieldErrors.fullName}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="register-email"
            className="block text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-1"
          >
            Địa chỉ email
          </label>

          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted/65" />

            <input
              id="register-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              onBlur={() => handleBlurField('email')}
              placeholder="name@example.com"
              className={`block w-full rounded-xl border bg-brand-bg py-3 pl-10 pr-4 text-xs font-bold text-brand-text outline-none transition-all focus:bg-white focus:ring-2 ${
                fieldErrors.email
                  ? 'border-brand-error focus:ring-brand-error/20'
                  : 'border-brand-border focus:ring-brand-primary'
              }`}
            />
          </div>
          {fieldErrors.email && (
            <p className="mt-1 text-[11px] font-semibold text-brand-error">
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="register-password"
            className="block text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-1"
          >
            Mật khẩu
          </label>

          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted/65" />

            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              onBlur={() => handleBlurField('password')}
              placeholder="Tối thiểu 8 ký tự"
              className={`block w-full rounded-xl border bg-brand-bg py-3 pl-10 pr-10 text-xs font-bold text-brand-text outline-none transition-all focus:bg-white focus:ring-2 ${
                fieldErrors.password
                  ? 'border-brand-error focus:ring-brand-error/20'
                  : 'border-brand-border focus:ring-brand-primary'
              }`}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted/70 hover:text-brand-text cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Password Strength Meter */}
          {password.length > 0 && (
            <div className="mt-2 space-y-2 rounded-xl bg-gray-50 p-2.5 border border-brand-border">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-gray-500">Độ mạnh mật khẩu:</span>
                <span className={passwordStrength.color}>{passwordStrength.label}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full transition-all duration-300 ${passwordStrength.color.split(' ')[0]} ${passwordStrength.barWidthClass}`}
                />
              </div>

              {/* Requirements checklist */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {passwordStrength.requirements.map((req) => (
                  <div
                    key={req.id}
                    className={`flex items-center gap-1 text-[10px] ${
                      req.met ? 'text-emerald-600 font-semibold' : 'text-gray-400'
                    }`}
                  >
                    <CheckCircle2
                      className={`h-3 w-3 shrink-0 ${
                        req.met ? 'text-emerald-600' : 'text-gray-300'
                      }`}
                    />
                    <span>{req.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {fieldErrors.password && (
            <p className="mt-1 text-[11px] font-semibold text-brand-error">
              {fieldErrors.password}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="register-confirm-password"
            className="block text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-1"
          >
            Xác nhận mật khẩu
          </label>

          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted/65" />

            <input
              id="register-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }
              }}
              onBlur={() => handleBlurField('confirmPassword')}
              placeholder="Nhập lại mật khẩu"
              className={`block w-full rounded-xl border bg-brand-bg py-3 pl-10 pr-10 text-xs font-bold text-brand-text outline-none transition-all focus:bg-white focus:ring-2 ${
                fieldErrors.confirmPassword
                  ? 'border-brand-error focus:ring-brand-error/20'
                  : 'border-brand-border focus:ring-brand-primary'
              }`}
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted/70 hover:text-brand-text cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {fieldErrors.confirmPassword && (
            <p className="mt-1 text-[11px] font-semibold text-brand-error">
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        {/* Terms Checkbox */}
        <div className={`rounded-xl p-2.5 transition-all ${fieldErrors.terms ? 'bg-red-50/70 border border-red-200' : ''}`}>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => {
                const checked = e.target.checked;
                setAgreeTerms(checked);
                if (checked) {
                  setFieldErrors((prev) => ({ ...prev, terms: undefined }));
                  if (globalError.includes('Điều khoản')) {
                    setGlobalError('');
                  }
                }
              }}
              className="mt-0.5 h-4 w-4 cursor-pointer rounded border-brand-border-high text-brand-primary focus:ring-brand-primary"
            />
            <span className="text-xs text-brand-text-muted leading-tight">
              Tôi đồng ý với{' '}
              <a href="#" onClick={(e) => e.preventDefault()} className="font-bold text-brand-primary hover:underline">
                Điều khoản dịch vụ
              </a>{' '}
              và{' '}
              <a href="#" onClick={(e) => e.preventDefault()} className="font-bold text-brand-primary hover:underline">
                Chính sách bảo mật
              </a>{' '}
              của SignBridge. <span className="text-rose-500 font-bold">*</span>
            </span>
          </label>
          {fieldErrors.terms && (
            <p className="mt-1.5 text-[11px] font-semibold text-brand-error flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{fieldErrors.terms}</span>
            </p>
          )}
        </div>

        <button
          id="register-submit-btn"
          type="submit"
          disabled={isSubmitting || !agreeTerms}
          title={!agreeTerms ? 'Vui lòng tích chọn đồng ý Điều khoản dịch vụ để đăng ký' : undefined}
          className="flex w-full cursor-pointer justify-center rounded-xl border border-transparent bg-brand-primary px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-brand-primary/10 transition-all hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-400 disabled:shadow-none mt-2"
        >
          {isSubmitting ? 'Đang gửi mã OTP...' : 'Đăng ký tài khoản'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs font-semibold text-brand-text-muted">
        Đã có tài khoản?{' '}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="cursor-pointer font-extrabold text-brand-primary hover:text-brand-primary-hover"
        >
          Đăng nhập
        </button>
      </p>

      {/* Google Auth Modal */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSuccess={handleGoogleSuccess}
      />
    </AuthShell>
  );
}