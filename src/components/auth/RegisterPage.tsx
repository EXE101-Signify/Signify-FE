import { useState, useEffect, type FormEvent } from 'react';
import { Eye, EyeOff, Lock, Mail, User, Phone, MapPin, ArrowLeft, ArrowRight, Check, UserPlus, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

import { Button, Input, BrandLogo } from '../common';

type Step = 1 | 2 | 3;

interface RegistrationData {
  username: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  gender: boolean | null; // true maps to Nam, false maps to Nữ in DB schema
  address: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<RegistrationData>({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    fullName: '',
    email: '',
    phone: '',
    gender: null,
    address: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFullNameManuallyEdited, setIsFullNameManuallyEdited] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic validation for confirm password
  useEffect(() => {
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Mật khẩu xác nhận không trùng khớp.' }));
    } else if (errors.confirmPassword) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.confirmPassword;
        return newErrors;
      });
    }
  }, [formData.password, formData.confirmPassword]);

  const updateData = (field: keyof RegistrationData, value: string | boolean | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.username.trim() || formData.username.length < 3 || formData.username.length > 30 || /\s/.test(formData.username)) {
      newErrors.username = 'Tên đăng nhập phải từ 3-30 ký tự, không chứa khoảng trắng.';
    }
    if (formData.password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự.';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'Vui lòng nhập tên.';
    if (formData.firstName.length > 100) newErrors.firstName = 'Tên tối đa 100 ký tự.';
    
    if (!formData.lastName.trim()) newErrors.lastName = 'Vui lòng nhập họ.';
    if (formData.lastName.length > 100) newErrors.lastName = 'Họ tối đa 100 ký tự.';
    
    if (!formData.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ và tên.';
    if (formData.fullName.length > 200) newErrors.fullName = 'Họ và tên tối đa 200 ký tự.';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email) || formData.email.length > 150) {
      newErrors.email = 'Vui lòng nhập email hợp lệ (tối đa 150 ký tự).';
    }
    
    if (formData.phone && formData.phone.length > 20) {
      newErrors.phone = 'Số điện thoại tối đa 20 ký tự.';
    }

    if (formData.gender === null) {
      newErrors.gender = 'Vui lòng chọn giới tính.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleBlurName = (field: 'firstName' | 'lastName' | 'fullName') => {
    setFormData((prev) => {
      const val = prev[field].trim().toUpperCase();
      const updates: Partial<RegistrationData> = { [field]: val };
      
      // Auto-generate fullName if not manually edited by user
      if ((field === 'firstName' || field === 'lastName') && !isFullNameManuallyEdited) {
        const newFirst = field === 'firstName' ? val : prev.firstName.trim().toUpperCase();
        const newLast = field === 'lastName' ? val : prev.lastName.trim().toUpperCase();
        if (newFirst || newLast) {
          updates.fullName = `${newLast} ${newFirst}`.trim();
        }
      }
      return { ...prev, ...updates };
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateStep1() || !validateStep2()) {
      return;
    }
    
    setIsSubmitting(true);

    // Simulate API call and navigate to OTP validation
    window.setTimeout(() => {
      setIsSubmitting(false);

      navigate('/verify-otp', {
        state: {
          flow: 'register',
          email: formData.email,
          registration: {
            username: formData.username,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            gender: formData.gender,
            address: formData.address,
          },
        },
      });
    }, 700);
  };

  const steps = [
    { num: 1, label: 'Tài khoản' },
    { num: 2, label: 'Thông tin cá nhân' },
    { num: 3, label: 'Xác nhận' },
  ];

  return (
    <main className="min-h-screen bg-brand-bg py-10 px-4 sm:px-6 flex flex-col justify-center items-center">
      <div className="w-full max-w-[640px]">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <BrandLogo />
          </div>
          <h1 className="text-[32px] font-bold tracking-tight text-brand-text mb-2">
            Tạo tài khoản
          </h1>
          <p className="text-brand-text-muted">
            Tham gia cùng Signify và bắt đầu hành trình của bạn
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-brand-surface border border-brand-border rounded-[16px] p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          
          {/* Progress Indicator */}
          <div aria-label="Registration progress" className="mb-10 relative px-2">
            <div className="absolute left-6 right-6 top-5 -translate-y-1/2 h-[2px] bg-brand-border-high/40 z-0" />
            <div 
              className="absolute left-6 top-5 -translate-y-1/2 h-[2px] bg-brand-primary transition-all duration-500 ease-out z-0"
              style={{ width: `calc(${((currentStep - 1) / 2) * 100}% - 3rem)` }}
            />
            <div className="flex justify-between relative z-10">
              {steps.map((s) => {
                const isActive = s.num === currentStep;
                const isCompleted = s.num < currentStep;
                
                return (
                  <div key={s.num} className="flex flex-col items-center">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                        isCompleted ? 'bg-brand-primary text-white shadow-md' :
                        isActive ? 'bg-brand-primary text-white ring-4 ring-brand-primary/20 shadow-md scale-110' :
                        'bg-brand-bg border-2 border-brand-border text-brand-text-muted'
                      }`}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : s.num}
                    </div>
                    <span className={`mt-3 text-sm font-semibold transition-colors duration-300 ${isActive ? 'text-brand-primary' : isCompleted ? 'text-brand-text' : 'text-brand-text-muted'}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="sr-only" aria-live="polite">
              Bước {currentStep} trên 3: {steps[currentStep - 1].label}
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="min-h-[300px]">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <Input
                      id="username"
                      label="Tên đăng nhập"
                      required
                      maxLength={30}
                      autoComplete="username"
                      value={formData.username}
                      onChange={(e) => updateData('username', e.target.value)}
                      placeholder="Nhập tên đăng nhập"
                      leftIcon={<User className="w-4 h-4" />}
                      error={errors.username}
                    />

                    <Input
                      id="password"
                      label="Mật khẩu"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={(e) => updateData('password', e.target.value)}
                      placeholder="Tối thiểu 8 ký tự"
                      leftIcon={<Lock className="w-4 h-4" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="hover:text-brand-primary focus:outline-none focus-visible:text-brand-primary p-1"
                          aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                      error={errors.password}
                    />

                    <Input
                      id="confirmPassword"
                      label="Xác nhận mật khẩu"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateData('confirmPassword', e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      leftIcon={<Lock className="w-4 h-4" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="hover:text-brand-primary focus:outline-none focus-visible:text-brand-primary p-1"
                          aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                      error={errors.confirmPassword}
                    />
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Input
                        id="lastName"
                        label="Họ"
                        required
                        maxLength={100}
                        value={formData.lastName}
                        onChange={(e) => updateData('lastName', e.target.value)}
                        onBlur={() => handleBlurName('lastName')}
                        placeholder="Nguyễn Văn"
                        error={errors.lastName}
                      />
                      <Input
                        id="firstName"
                        label="Tên"
                        required
                        maxLength={100}
                        value={formData.firstName}
                        onChange={(e) => updateData('firstName', e.target.value)}
                        onBlur={() => handleBlurName('firstName')}
                        placeholder="A"
                        error={errors.firstName}
                      />
                    </div>
                    
                    <Input
                      id="fullName"
                      label="Họ và tên đầy đủ"
                      required
                      maxLength={200}
                      value={formData.fullName}
                      onChange={(e) => {
                        setIsFullNameManuallyEdited(true);
                        updateData('fullName', e.target.value);
                      }}
                      onBlur={() => handleBlurName('fullName')}
                      placeholder="Nguyễn Văn A"
                      error={errors.fullName}
                    />

                    <Input
                      id="email"
                      label="Địa chỉ email"
                      type="email"
                      required
                      maxLength={150}
                      autoComplete="email"
                      value={formData.email}
                      onChange={(e) => updateData('email', e.target.value)}
                      placeholder="name@example.com"
                      leftIcon={<Mail className="w-4 h-4" />}
                      error={errors.email}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Input
                        id="phone"
                        label="Số điện thoại (Không bắt buộc)"
                        type="tel"
                        maxLength={20}
                        autoComplete="tel"
                        value={formData.phone}
                        onChange={(e) => updateData('phone', e.target.value)}
                        placeholder="0912345678"
                        leftIcon={<Phone className="w-4 h-4" />}
                        error={errors.phone}
                      />

                      <div className="w-full">
                        <label htmlFor="gender" className="mb-1.5 block text-sm font-semibold text-brand-text">
                          Giới tính <span className="text-brand-error">*</span>
                        </label>
                        <select
                          id="gender"
                          value={formData.gender === null ? '' : formData.gender ? 'true' : 'false'}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateData('gender', val === '' ? null : val === 'true');
                          }}
                          aria-invalid={Boolean(errors.gender)}
                          className={`min-h-11 w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-brand-text transition-colors duration-150 focus:outline-none focus:ring-2 ${
                            errors.gender 
                              ? 'border-brand-error focus:border-brand-error focus:ring-brand-error/15' 
                              : 'border-brand-border-high hover:border-gray-400 focus:border-brand-primary focus:ring-brand-primary/15'
                          }`}
                        >
                          <option value="" disabled>Chọn giới tính</option>
                          {/* Mapping boolean schema: true -> Nam, false -> Nữ */}
                          <option value="true">Nam</option>
                          <option value="false">Nữ</option>
                        </select>
                        {errors.gender && (
                          <p className="mt-1.5 text-sm text-brand-error">{errors.gender}</p>
                        )}
                      </div>
                    </div>

                    <div className="w-full">
                      <label htmlFor="address" className="mb-1.5 block text-sm font-semibold text-brand-text">
                        Địa chỉ (Không bắt buộc)
                      </label>
                      <div className="relative flex">
                        <span className="pointer-events-none absolute left-3 top-3 flex text-brand-text-muted" aria-hidden="true">
                          <MapPin className="w-4 h-4" />
                        </span>
                        <textarea
                          id="address"
                          rows={3}
                          value={formData.address}
                          onChange={(e) => updateData('address', e.target.value)}
                          placeholder="Nhập địa chỉ của bạn"
                          className="w-full rounded-lg border border-brand-border-high bg-white pl-10 pr-3 py-2.5 text-sm text-brand-text placeholder:text-gray-400 transition-colors duration-150 hover:border-gray-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/15"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="bg-brand-bg/50 rounded-xl border border-brand-border p-6">
                      <div className="flex items-center justify-between border-b border-brand-border pb-4 mb-4">
                        <h3 className="text-base font-semibold text-brand-text">Kiểm tra thông tin cá nhân</h3>
                        <button 
                          type="button" 
                          onClick={() => setCurrentStep(2)}
                          className="text-sm font-semibold text-brand-primary hover:text-brand-primary-hover transition-colors"
                        >
                          Chỉnh sửa
                        </button>
                      </div>
                      
                      <dl className="space-y-4 text-sm">
                        <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[160px_1fr] gap-2">
                          <dt className="text-brand-text-muted font-medium">Họ và tên:</dt>
                          <dd className="text-brand-text font-semibold">{formData.fullName}</dd>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[160px_1fr] gap-2">
                          <dt className="text-brand-text-muted font-medium">Email:</dt>
                          <dd className="text-brand-text font-semibold">{formData.email}</dd>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[160px_1fr] gap-2">
                          <dt className="text-brand-text-muted font-medium">Số điện thoại:</dt>
                          <dd className="text-brand-text font-semibold">{formData.phone || <span className="text-gray-400 italic">Chưa cung cấp</span>}</dd>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[160px_1fr] gap-2">
                          <dt className="text-brand-text-muted font-medium">Giới tính:</dt>
                          <dd className="text-brand-text font-semibold">
                            {formData.gender === true ? 'Nam' : formData.gender === false ? 'Nữ' : ''}
                          </dd>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[160px_1fr] gap-2">
                          <dt className="text-brand-text-muted font-medium">Địa chỉ:</dt>
                          <dd className="text-brand-text font-semibold">{formData.address || <span className="text-gray-400 italic">Chưa cung cấp</span>}</dd>
                        </div>
                      </dl>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Navigation Actions */}
            <div className="mt-8 pt-6 border-t border-brand-border flex items-center justify-between gap-4">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                  className="w-full sm:w-auto"
                >
                  Quay lại
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-sm font-semibold text-brand-primary hover:text-brand-primary-hover flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại đăng nhập
                </button>
              )}

              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full sm:w-auto ml-auto"
                >
                  Tiếp tục
                </Button>
              ) : (
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  leftIcon={!isSubmitting && <UserPlus className="w-4 h-4" />}
                  className="w-full sm:w-auto ml-auto"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Tạo tài khoản'}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}