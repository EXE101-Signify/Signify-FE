import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import {
  AlertCircle, ArrowLeft, ArrowRight, AtSign, Camera, Check, Circle, Eye, EyeOff,
  Lock, Mail, MapPin, Phone, User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GoogleButton from './GoogleButton';
import GoogleAuthModal, { type GoogleUserInfo } from './GoogleAuthModal';
import { emailApi } from '../../services/emailApi';
import { setStoredSession, type TokenDTO, type UserDTO } from '../../services/apiClient';
import {
  validateConfirmPassword, validateEmail, validateFullName, validatePassword,
} from '../../utils/validation';

type Field = 'username' | 'password' | 'confirmPassword' | 'familyName' | 'givenName' | 'fullName' | 'email' | 'avatar' | 'terms';
type FieldErrors = Partial<Record<Field, string>>;

const stepLabels = ['Tài khoản', 'Thông tin cá nhân', 'Xác nhận'];
const inputClass = 'h-11 w-full rounded-lg border border-brand-border bg-white px-3 text-sm text-brand-text outline-none transition-colors placeholder:text-brand-text-muted/75 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15';
const labelClass = 'mb-1.5 block text-xs font-bold text-brand-text';
const specialCharacterPattern = /[^A-Za-z0-9\s]/;

function getPasswordChecks(value: string) {
  const byteLength = new TextEncoder().encode(value).length;
  return [
    { label: 'Không quá 72 byte UTF-8', met: byteLength <= 72, error: 'Mật khẩu không được vượt quá 72 byte UTF-8.' },
    { label: 'Ít nhất 8 ký tự', met: value.length >= 8, error: 'Mật khẩu phải có ít nhất 8 ký tự.' },
    { label: 'Có chữ thường (a-z)', met: /[a-z]/.test(value), error: 'Mật khẩu phải có ít nhất một chữ thường.' },
    { label: 'Có chữ hoa (A-Z)', met: /[A-Z]/.test(value), error: 'Mật khẩu phải có ít nhất một chữ hoa.' },
    { label: 'Có chữ số (0-9)', met: /[0-9]/.test(value), error: 'Mật khẩu phải có ít nhất một chữ số.' },
    { label: 'Có ký tự đặc biệt', met: specialCharacterPattern.test(value), error: 'Mật khẩu phải có ít nhất một ký tự đặc biệt.' },
  ];
}

function getRegistrationPasswordError(value: string): string | null {
  if (validatePassword(value) || !value.trim()) return 'Vui lòng nhập mật khẩu.';
  return getPasswordChecks(value).find((check) => !check.met)?.error || null;
}

function FieldBlock({ label, htmlFor, error, children }: {
  label: string; htmlFor: string; error?: string; children: ReactNode;
}) {
  return <div>
    <label htmlFor={htmlFor} className={labelClass}>{label}</label>
    {children}
    {error && <p id={`${htmlFor}-error`} className="mt-1.5 text-xs font-medium text-brand-error">{error}</p>}
  </div>;
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return <div className="flex flex-col gap-0.5 border-b border-brand-border py-3 last:border-b-0 sm:flex-row sm:justify-between sm:gap-5">
    <dt className="text-xs text-brand-text-muted">{label}</dt>
    <dd className="break-words text-sm font-semibold text-brand-text sm:text-right">{value}</dd>
  </div>;
}

export default function RegisterPage({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [givenName, setGivenName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  useEffect(() => {
    if (!avatarFile) { setAvatarPreview(null); return; }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const passwordChecks = getPasswordChecks(password);
  const clearError = (field: Field) => setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
  const usernameError = () => username.trim() && username.trim().length < 3
    ? 'Tên đăng nhập phải có ít nhất 3 ký tự.' : null;

  const back = () => { setCurrentStep((step) => step - 1); setGlobalError(''); };
  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFieldErrors((previous) => ({ ...previous, avatar: 'Vui lòng chọn một tệp ảnh.' }));
      event.target.value = '';
      return;
    }
    setAvatarFile(file);
    clearError('avatar');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGlobalError('');
    const accountErrors: FieldErrors = {
      username: usernameError() || undefined,
      password: getRegistrationPasswordError(password) || undefined,
      confirmPassword: validateConfirmPassword(password, confirmPassword) || undefined,
    };
    if (currentStep === 1) {
      setFieldErrors(accountErrors);
      if (!Object.values(accountErrors).some(Boolean)) setCurrentStep(2);
      return;
    }

    const personalErrors: FieldErrors = {
      familyName: familyName.trim() ? undefined : 'Vui lòng nhập họ.',
      givenName: givenName.trim() ? undefined : 'Vui lòng nhập tên.',
      fullName: validateFullName(fullName) || undefined,
      email: validateEmail(email) || undefined,
    };
    if (currentStep === 2) {
      setFieldErrors(personalErrors);
      if (!Object.values(personalErrors).some(Boolean)) setCurrentStep(3);
      return;
    }

    const errors: FieldErrors = {
      ...accountErrors, ...personalErrors,
      terms: agreeTerms ? undefined : 'Vui lòng đồng ý với điều khoản và chính sách bảo mật.',
    };
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      if (Object.values(accountErrors).some(Boolean)) setCurrentStep(1);
      else if (Object.values(personalErrors).some(Boolean)) setCurrentStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      const trimmedEmail = email.trim();
      const response = await emailApi.sendRegisterOtp(trimmedEmail);
      if (!response.success) {
        setGlobalError(response.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');
        return;
      }
      const finalUsername = username.trim() || trimmedEmail.split('@')[0] || `user_${Date.now()}`;
      navigate('/verify-otp', { state: {
        flow: 'register', email: trimmedEmail,
        registration: {
          username: finalUsername, fullName: fullName.trim(), firstName: givenName.trim(),
          lastName: familyName.trim(), email: trimmedEmail, password, avatarFile,
        },
      } });
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : 'Không thể gửi mã OTP. Vui lòng thử lại.');
    } finally { setIsSubmitting(false); }
  };

  const handleGoogleSuccess = (userInfo: GoogleUserInfo) => {
    const userDTO: UserDTO = {
      userId: Date.now(), username: userInfo.email.split('@')[0], role: 'USER', emailVerified: true,
      email: userInfo.email, firstName: userInfo.name.split(' ')[0],
      lastName: userInfo.name.split(' ').slice(1).join(' '), avatar: userInfo.avatar,
    };
    const tokenDTO: TokenDTO = {
      accessToken: `mock_gg_access_token_${Date.now()}`,
      refreshToken: `mock_gg_refresh_token_${Date.now()}`,
      tokenType: 'Bearer', accessExpiresAt: Date.now() + 900000,
      refreshExpiresAt: Date.now() + 604800000,
    };
    setStoredSession(tokenDTO, userDTO);
    onLoginSuccess();
  };

  return <main id="register-page" className="min-h-screen bg-brand-bg px-4 py-10 text-brand-text sm:px-6 sm:py-14">
    <div className="mx-auto w-full max-w-[530px]">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">Tạo tài khoản</h1>
        <p className="mt-2 text-sm text-brand-text-muted">Tham gia cùng Signify và bắt đầu hành trình của bạn</p>
      </header>

      <section className="rounded-2xl border border-brand-border bg-white px-5 py-7 shadow-[0_16px_40px_rgba(31,45,42,0.07)] sm:px-8 sm:py-8" aria-label="Đăng ký tài khoản">
        <ol className="mb-9 flex items-start" aria-label="Tiến độ đăng ký">
          {stepLabels.map((label, index) => {
            const number = index + 1;
            const complete = number < currentStep;
            const active = number === currentStep;
            return <li key={label} aria-current={active ? 'step' : undefined} className="flex min-w-0 flex-1 items-start last:flex-none">
              <div className="flex min-w-0 flex-col items-center text-center">
                <span className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold transition-colors ${active || complete ? 'border-brand-primary bg-brand-primary text-white' : 'border-brand-border bg-brand-bg text-brand-text-muted'} ${active ? 'ring-4 ring-brand-primary-light' : ''}`}>
                  {complete ? <Check className="h-4 w-4" aria-hidden="true" /> : number}
                </span>
                <span className={`mt-2 max-w-20 text-[11px] leading-tight sm:max-w-none ${active ? 'font-bold text-brand-primary' : 'font-semibold text-brand-text-muted'}`}>{label}</span>
              </div>
              {index < 2 && <span aria-hidden="true" className={`mx-2 mt-[17px] h-px min-w-2 flex-1 ${complete ? 'bg-brand-primary' : 'bg-brand-border'}`} />}
            </li>;
          })}
        </ol>

        {globalError && <div role="alert" className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-brand-error"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{globalError}</div>}

        <form noValidate onSubmit={handleSubmit}>
          {currentStep === 1 && <div className="space-y-5">
            <FieldBlock label="Tên đăng nhập" htmlFor="register-username" error={fieldErrors.username}>
              <div className="relative"><AtSign className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-brand-text-muted" aria-hidden="true" />
                <input id="register-username" type="text" autoComplete="username" value={username} onChange={(event: ChangeEvent<HTMLInputElement>) => { setUsername(event.target.value); clearError('username'); }} onBlur={() => setFieldErrors((previous) => ({ ...previous, username: usernameError() || undefined }))} placeholder="abc@gmail.com" aria-invalid={Boolean(fieldErrors.username)} aria-describedby={fieldErrors.username ? 'register-username-error' : undefined} className={`${inputClass} pl-10`} />
              </div>
            </FieldBlock>
            <FieldBlock label="Mật khẩu" htmlFor="register-password" error={fieldErrors.password}>
              <div className="relative"><Lock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-brand-text-muted" aria-hidden="true" />
                <input id="register-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={password} onChange={(event: ChangeEvent<HTMLInputElement>) => { const nextPassword = event.target.value; setPassword(nextPassword); setFieldErrors((previous) => ({ ...previous, password: getRegistrationPasswordError(nextPassword) || undefined, confirmPassword: confirmPassword ? validateConfirmPassword(nextPassword, confirmPassword) || undefined : undefined })); }} onBlur={() => setFieldErrors((previous) => ({ ...previous, password: getRegistrationPasswordError(password) || undefined }))} placeholder="Tối thiểu 8 ký tự" aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? 'register-password-error register-password-rules' : 'register-password-rules'} className={`${inputClass} pl-10 pr-11`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="absolute right-3 top-3 rounded p-1 text-brand-text-muted hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-brand-primary">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
              <ul id="register-password-rules" className="mt-3 grid gap-1.5 sm:grid-cols-2" aria-label="Yêu cầu mật khẩu">
                {passwordChecks.map((check) => <li key={check.label} className={`flex items-center gap-1.5 text-xs ${check.met ? 'font-semibold text-brand-primary' : 'text-brand-text-muted'}`}>
                  {check.met ? <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : <Circle className="h-3 w-3 shrink-0" aria-hidden="true" />}
                  {check.label}
                </li>)}
              </ul>
            </FieldBlock>
            <FieldBlock label="Xác nhận mật khẩu" htmlFor="register-confirm-password" error={fieldErrors.confirmPassword}>
              <div className="relative"><Lock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-brand-text-muted" aria-hidden="true" />
                <input id="register-confirm-password" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" required value={confirmPassword} onChange={(event: ChangeEvent<HTMLInputElement>) => { const nextConfirmation = event.target.value; setConfirmPassword(nextConfirmation); setFieldErrors((previous) => ({ ...previous, confirmPassword: validateConfirmPassword(password, nextConfirmation) || undefined })); }} onBlur={() => setFieldErrors((previous) => ({ ...previous, confirmPassword: validateConfirmPassword(password, confirmPassword) || undefined }))} placeholder="Nhập lại mật khẩu" aria-invalid={Boolean(fieldErrors.confirmPassword)} aria-describedby={fieldErrors.confirmPassword ? 'register-confirm-password-error' : undefined} className={`${inputClass} pl-10 pr-11`} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'} className="absolute right-3 top-3 rounded p-1 text-brand-text-muted hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-brand-primary">{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </FieldBlock>
          </div>}

          {currentStep === 2 && <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldBlock label="Họ" htmlFor="register-family-name" error={fieldErrors.familyName}>
                <input id="register-family-name" type="text" autoComplete="family-name" required value={familyName} onChange={(event: ChangeEvent<HTMLInputElement>) => { setFamilyName(event.target.value); clearError('familyName'); }} onBlur={() => setFieldErrors((previous) => ({ ...previous, familyName: familyName.trim() ? undefined : 'Vui lòng nhập họ.' }))} placeholder="Nguyễn" aria-invalid={Boolean(fieldErrors.familyName)} aria-describedby={fieldErrors.familyName ? 'register-family-name-error' : undefined} className={inputClass} />
              </FieldBlock>
              <FieldBlock label="Tên" htmlFor="register-given-name" error={fieldErrors.givenName}>
                <input id="register-given-name" type="text" autoComplete="given-name" required value={givenName} onChange={(event: ChangeEvent<HTMLInputElement>) => { setGivenName(event.target.value); clearError('givenName'); }} onBlur={() => setFieldErrors((previous) => ({ ...previous, givenName: givenName.trim() ? undefined : 'Vui lòng nhập tên.' }))} placeholder="Văn A" aria-invalid={Boolean(fieldErrors.givenName)} aria-describedby={fieldErrors.givenName ? 'register-given-name-error' : undefined} className={inputClass} />
              </FieldBlock>
            </div>
            <FieldBlock label="Họ và tên đầy đủ" htmlFor="register-full-name" error={fieldErrors.fullName}>
              <div className="relative"><User className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-brand-text-muted" aria-hidden="true" /><input id="register-full-name" type="text" autoComplete="name" required value={fullName} onChange={(event: ChangeEvent<HTMLInputElement>) => { setFullName(event.target.value); clearError('fullName'); }} onBlur={() => setFieldErrors((previous) => ({ ...previous, fullName: validateFullName(fullName) || undefined }))} placeholder="Nguyễn Văn A" aria-invalid={Boolean(fieldErrors.fullName)} aria-describedby={fieldErrors.fullName ? 'register-full-name-error' : undefined} className={`${inputClass} pl-10`} /></div>
            </FieldBlock>
            <FieldBlock label="Địa chỉ email" htmlFor="register-email" error={fieldErrors.email}>
              <div className="relative"><Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-brand-text-muted" aria-hidden="true" /><input id="register-email" type="email" autoComplete="email" required value={email} onChange={(event: ChangeEvent<HTMLInputElement>) => { setEmail(event.target.value); clearError('email'); }} onBlur={() => setFieldErrors((previous) => ({ ...previous, email: validateEmail(email) || undefined }))} placeholder="name@example.com" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'register-email-error' : undefined} className={`${inputClass} pl-10`} /></div>
            </FieldBlock>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldBlock label="Số điện thoại (không bắt buộc)" htmlFor="register-phone"><div className="relative"><Phone className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-brand-text-muted" aria-hidden="true" /><input id="register-phone" type="tel" autoComplete="tel" value={phone} onChange={(event: ChangeEvent<HTMLInputElement>) => setPhone(event.target.value)} placeholder="Số điện thoại" className={`${inputClass} pl-10`} /></div></FieldBlock>
              <FieldBlock label="Giới tính (không bắt buộc)" htmlFor="register-gender"><select id="register-gender" value={gender} onChange={(event) => setGender(event.target.value)} className={inputClass}><option value="">Chọn giới tính</option><option value="Nam">Nam</option><option value="Nữ">Nữ</option><option value="Khác">Khác</option></select></FieldBlock>
            </div>
            <FieldBlock label="Địa chỉ (không bắt buộc)" htmlFor="register-address"><div className="relative"><MapPin className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-brand-text-muted" aria-hidden="true" /><textarea id="register-address" autoComplete="street-address" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Địa chỉ của bạn" rows={2} className={`${inputClass} h-auto min-h-20 py-3 pl-10`} /></div></FieldBlock>
            <FieldBlock label="Ảnh đại diện (không bắt buộc)" htmlFor="register-avatar" error={fieldErrors.avatar}>
              <div className="flex items-center gap-4 rounded-lg border border-dashed border-brand-border-high bg-brand-bg p-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-primary-light text-brand-primary">{avatarPreview ? <img src={avatarPreview} alt="Ảnh đại diện đã chọn" className="h-full w-full object-cover" /> : <User className="h-6 w-6" aria-hidden="true" />}</div>
                <label htmlFor="register-avatar" className="inline-flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-brand-border bg-white px-3 py-2 text-xs font-bold text-brand-primary hover:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20"><Camera className="h-4 w-4 shrink-0" /><span className="truncate">{avatarFile ? 'Thay đổi ảnh' : 'Tải ảnh đại diện'}</span><input id="register-avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="sr-only" aria-describedby={fieldErrors.avatar ? 'register-avatar-error' : undefined} /></label>
              </div>
            </FieldBlock>
            <p className="text-xs leading-5 text-brand-text-muted">Số điện thoại, giới tính và địa chỉ hiện chỉ được xem lại tại bước tiếp theo; hệ thống chưa lưu các thông tin này khi đăng ký.</p>
          </div>}

          {currentStep === 3 && <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-xl bg-brand-bg p-3"><div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-primary-light text-brand-primary">{avatarPreview ? <img src={avatarPreview} alt="Ảnh đại diện đã chọn" className="h-full w-full object-cover" /> : <User className="h-6 w-6" aria-hidden="true" />}</div><div className="min-w-0"><p className="truncate text-sm font-bold">{fullName}</p><p className="truncate text-xs text-brand-text-muted">{avatarFile ? avatarFile.name : 'Chưa chọn ảnh đại diện'}</p></div></div>
            <div><div className="flex items-center justify-between"><h2 className="text-sm font-bold">Thông tin tài khoản</h2><button type="button" onClick={() => setCurrentStep(1)} className="text-xs font-bold text-brand-primary hover:underline">Chỉnh sửa</button></div><dl className="mt-2"><ReviewRow label="Tên đăng nhập" value={username.trim() || email.trim().split('@')[0]} /><ReviewRow label="Mật khẩu" value={'•'.repeat(Math.max(8, password.length))} /></dl></div>
            <div><div className="flex items-center justify-between"><h2 className="text-sm font-bold">Thông tin cá nhân</h2><button type="button" onClick={() => setCurrentStep(2)} className="text-xs font-bold text-brand-primary hover:underline">Chỉnh sửa</button></div><dl className="mt-2"><ReviewRow label="Họ" value={familyName.trim()} /><ReviewRow label="Tên" value={givenName.trim()} /><ReviewRow label="Họ và tên đầy đủ" value={fullName.trim()} /><ReviewRow label="Email" value={email.trim()} />{phone.trim() && <ReviewRow label="Số điện thoại" value={phone.trim()} />}{gender && <ReviewRow label="Giới tính" value={gender} />}{address.trim() && <ReviewRow label="Địa chỉ" value={address.trim()} />}</dl>{(phone.trim() || gender || address.trim()) && <p className="mt-2 text-xs text-brand-text-muted">Số điện thoại, giới tính và địa chỉ hiện chưa được lưu khi đăng ký.</p>}</div>
            <div><label htmlFor="register-terms" className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-brand-text-muted"><input id="register-terms" type="checkbox" checked={agreeTerms} onChange={(event: ChangeEvent<HTMLInputElement>) => { setAgreeTerms(event.target.checked); clearError('terms'); }} aria-invalid={Boolean(fieldErrors.terms)} aria-describedby={fieldErrors.terms ? 'register-terms-error' : undefined} className="mt-0.5 h-4 w-4 shrink-0 accent-brand-primary" /><span>Tôi đã kiểm tra thông tin và đồng ý với Điều khoản dịch vụ, Chính sách bảo mật của SignBridge.</span></label>{fieldErrors.terms && <p id="register-terms-error" className="mt-1.5 text-xs font-medium text-brand-error">{fieldErrors.terms}</p>}</div>
            <p className="text-xs leading-5 text-brand-text-muted">Mã xác thực sẽ được gửi đến {email.trim()} sau khi bạn xác nhận.</p>
          </div>}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-brand-border pt-5">
            {currentStep === 1 ? <button type="button" onClick={() => navigate('/login')} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline"><ArrowLeft className="h-4 w-4" />Quay lại đăng nhập</button> : <button type="button" disabled={isSubmitting} onClick={back} className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-2 text-xs font-semibold text-brand-text hover:bg-brand-bg disabled:opacity-60"><ArrowLeft className="h-4 w-4" />Quay lại</button>}
            <button id="register-submit-btn" type="submit" disabled={isSubmitting} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-brand-primary px-4 py-2 text-xs font-bold text-white hover:bg-brand-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? 'Đang gửi mã OTP...' : currentStep === 3 ? 'Xác nhận và nhận mã OTP' : 'Tiếp tục'}{!isSubmitting && <ArrowRight className="h-4 w-4" />}</button>
          </div>
        </form>
      </section>
      <p className="mt-5 text-center text-xs text-brand-text-muted">Đã có tài khoản? <button type="button" onClick={() => navigate('/login')} className="font-bold text-brand-primary hover:underline">Đăng nhập</button></p>
    </div>
    <GoogleAuthModal isOpen={isGoogleModalOpen} onClose={() => setIsGoogleModalOpen(false)} onSuccess={handleGoogleSuccess} />
  </main>;
}
