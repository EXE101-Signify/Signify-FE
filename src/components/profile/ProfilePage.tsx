import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Award,
  Calendar,
  Camera,
  Save,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  Video,
  BookOpen,
  Eye,
  EyeOff,
} from 'lucide-react';
import AppLayout from '../../layouts/AppLayout';
import type { Screen, UserProfile } from '../../types';
import { calculatePasswordStrength, validateEmail, validateFullName, validatePassword } from '../../utils/validation';
import { authApi } from '../../services/authApi';
import { getStoredUser } from '../../services/apiClient';

interface ProfilePageProps {
  onNavigate?: (screen: Screen) => void;
  onLogout?: () => void;
}

const INITIAL_USER: UserProfile = {
  id: 'usr_thanhliem_01',
  name: 'Thanh Liêm',
  email: 'thanhliem@signbridge.vn',
  phone: '0988 123 456',
  role: 'admin',
  plan: 'pro',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300',
  bio: 'Chuyên gia hỗ trợ phát triển ngôn ngữ ký hiệu SignBridge. Đam mê công nghệ hỗ trợ cộng đồng người khiếm thính Việt Nam.',
  status: 'active',
  joinedDate: '15/01/2025',
  lastActive: 'Vài phút trước',
};

export default function ProfilePage({ onNavigate, onLogout }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'security'>('overview');

  // User Profile State
  const [profile, setProfile] = useState<UserProfile>(() => {
    const stored = getStoredUser();
    if (stored) {
      return {
        id: String(stored.userId),
        name: [stored.firstName, stored.lastName].filter(Boolean).join(' ') || stored.username,
        email: stored.email || `${stored.username}@signbridge.vn`,
        phone: '0988 123 456',
        role: stored.role.toLowerCase() as any,
        plan: 'pro',
        avatar: stored.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300',
        bio: 'Tài khoản thành viên SignBridge.',
        status: 'active',
        joinedDate: 'Hôm nay',
        lastActive: 'Vài phút trước',
      };
    }
    const saved = localStorage.getItem('signbridge_user_profile');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  useEffect(() => {
    authApi
      .getProfile()
      .then((res) => {
        if (res.success && res.data) {
          const u = res.data;
          const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username;
          setProfile((prev) => ({
            ...prev,
            id: String(u.userId),
            name: fullName,
            email: u.email || prev.email,
            role: u.role.toLowerCase() as any,
            avatar: u.avatar || prev.avatar,
          }));
        }
      })
      .catch(() => {
        // Fallback to local profile if offline or unauthenticated
      });
  }, []);

  // Edit Form State
  const [editName, setEditName] = useState(profile.name);
  const [editEmail, setEditEmail] = useState(profile.email);
  const [editPhone, setEditPhone] = useState(profile.phone);
  const [editBio, setEditBio] = useState(profile.bio);
  const [editAvatar, setEditAvatar] = useState(profile.avatar);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Toast / Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const newPassStrength = calculatePasswordStrength(newPassword);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const nameErr = validateFullName(editName);
    const emailErr = validateEmail(editEmail);

    if (nameErr || emailErr) {
      setErrorMessage(nameErr || emailErr || 'Thông tin chỉnh sửa không hợp lệ.');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      const updatedProfile: UserProfile = {
        ...profile,
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        bio: editBio.trim(),
        avatar: editAvatar,
      };

      setProfile(updatedProfile);
      localStorage.setItem('signbridge_user_profile', JSON.stringify(updatedProfile));
      setIsSaving(false);
      showToast('Cập nhật hồ sơ cá nhân thành công!');
    }, 600);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentPassword) {
      setErrorMessage('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    const passErr = validatePassword(newPassword);
    if (passErr) {
      setErrorMessage(passErr);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Mật khẩu mới xác nhận không trùng khớp.');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showToast('Đổi mật khẩu thành công!');
    }, 700);
  };

  const handleAvatarChange = () => {
    // Cycle demo avatars
    const avatars = [
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    ];
    const currentIndex = avatars.indexOf(editAvatar);
    const nextAvatar = avatars[(currentIndex + 1) % avatars.length];
    setEditAvatar(nextAvatar);
    showToast('Đã chọn ảnh đại diện mới. Bấm "Lưu thay đổi" để xác nhận.');
  };

  return (
    <AppLayout
      title="Hồ sơ cá nhân"
      subtitle="Quản lý thông tin tài khoản và cài đặt cá nhân SignBridge"
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-700 shadow-sm animate-fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-600 shadow-sm">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Profile Header Banner Card */}
        <div className="relative overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm">
          <div className="h-32 bg-gradient-to-r from-brand-primary via-indigo-600 to-purple-600 relative">
            <div className="absolute right-4 top-4 flex gap-2">
              <span className="rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-[10px] font-extrabold uppercase text-white border border-white/30">
                Gói {profile.plan.toUpperCase()}
              </span>
              <span className="rounded-full bg-emerald-500/80 backdrop-blur-md px-3 py-1 text-[10px] font-extrabold uppercase text-white">
                {profile.status === 'active' ? 'Đang hoạt động' : 'Tạm khóa'}
              </span>
            </div>
          </div>

          <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12">
            <div className="flex items-end gap-4">
              <div className="relative group">
                <img
                  src={activeTab === 'edit' ? editAvatar : profile.avatar}
                  alt={profile.name}
                  className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-md bg-white"
                />
                {activeTab === 'edit' && (
                  <button
                    type="button"
                    onClick={handleAvatarChange}
                    className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/50 text-white opacity-90 transition-opacity cursor-pointer"
                  >
                    <Camera className="h-5 w-5" />
                    <span className="text-[9px] font-bold mt-1">Đổi ảnh</span>
                  </button>
                )}
              </div>

              <div>
                <h1 className="text-xl font-extrabold text-brand-text flex items-center gap-2">
                  {profile.name}
                  <ShieldCheck className="h-5 w-5 text-brand-primary" />
                </h1>
                <p className="text-xs text-brand-text-muted mt-0.5">{profile.email}</p>
                <div className="flex items-center gap-3 mt-2 text-[11px] font-semibold text-gray-500">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-brand-primary" />
                    Vai trò: <strong className="capitalize text-brand-text">{profile.role}</strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-brand-primary" />
                    Tham gia: {profile.joinedDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'edit'
                    ? 'bg-brand-primary text-white shadow-md'
                    : 'border border-brand-border bg-white text-brand-text hover:bg-gray-50'
                }`}
              >
                Chỉnh sửa hồ sơ
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-t border-brand-border bg-gray-50/50 px-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('overview');
                setErrorMessage(null);
              }}
              className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-brand-text-muted hover:text-brand-text'
              }`}
            >
              Thông tin cá nhân
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('edit');
                setErrorMessage(null);
              }}
              className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === 'edit'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-brand-text-muted hover:text-brand-text'
              }`}
            >
              Chỉnh sửa hồ sơ
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('security');
                setErrorMessage(null);
              }}
              className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-brand-text-muted hover:text-brand-text'
              }`}
            >
              Bảo mật & Đổi mật khẩu
            </button>
          </div>
        </div>

        {/* TAB 1: OVERVIEW (FE-THU-08) */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-brand-text border-b border-brand-border pb-3">
                  Giới thiệu & Tiểu sử
                </h3>
                <p className="text-xs leading-relaxed text-brand-text-muted">
                  {profile.bio || 'Chưa cập nhật tiểu sử cá nhân.'}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-brand-border bg-brand-bg">
                    <User className="h-5 w-5 text-brand-primary shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold uppercase text-brand-text-muted">Họ và tên</div>
                      <div className="text-xs font-extrabold text-brand-text">{profile.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-brand-border bg-brand-bg">
                    <Mail className="h-5 w-5 text-brand-primary shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold uppercase text-brand-text-muted">Địa chỉ Email</div>
                      <div className="text-xs font-extrabold text-brand-text">{profile.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-brand-border bg-brand-bg">
                    <Phone className="h-5 w-5 text-brand-primary shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold uppercase text-brand-text-muted">Số điện thoại</div>
                      <div className="text-xs font-extrabold text-brand-text">{profile.phone}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-brand-border bg-brand-bg">
                    <Award className="h-5 w-5 text-brand-primary shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold uppercase text-brand-text-muted">Gói đăng ký dịch vụ</div>
                      <div className="text-xs font-extrabold text-brand-secondary capitalize">SignBridge {profile.plan}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity statistics */}
              <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-brand-text border-b border-brand-border pb-3">
                  Thống kê học tập & Sử dụng
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-xl bg-brand-primary-light/30 border border-brand-primary-light">
                    <Video className="h-6 w-6 text-brand-primary mx-auto mb-1" />
                    <div className="text-lg font-black text-brand-primary">48</div>
                    <div className="text-[10px] font-bold uppercase text-brand-text-muted">Cuộc gọi dịch Sign</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <BookOpen className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
                    <div className="text-lg font-black text-emerald-700">1,250</div>
                    <div className="text-[10px] font-bold uppercase text-brand-text-muted">Từ vựng Ký hiệu</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <Clock className="h-6 w-6 text-amber-600 mx-auto mb-1" />
                    <div className="text-lg font-black text-amber-700">12.5h</div>
                    <div className="text-[10px] font-bold uppercase text-brand-text-muted">Thời lượng sử dụng</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Status Summary */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-brand-text border-b border-brand-border pb-3">
                  Trạng thái tài khoản
                </h3>
                <ul className="space-y-3 text-xs">
                  <li className="flex items-center justify-between">
                    <span className="text-gray-500">Xác thực Email:</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Đã xác thực
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-gray-500">Quyền truy cập Admin:</span>
                    <span className="font-bold text-brand-primary uppercase">{profile.role}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-gray-500">Đăng nhập gần nhất:</span>
                    <span className="font-semibold text-gray-700">{profile.lastActive}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EDIT PROFILE (FE-THU-09) */}
        {activeTab === 'edit' && (
          <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
            <div className="mb-6 border-b border-brand-border pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-brand-text">
                  Chỉnh sửa thông tin cá nhân
                </h3>
                <p className="text-xs text-brand-text-muted">Cập nhật họ tên, địa chỉ email, số điện thoại và tiểu sử của bạn</p>
              </div>
              <button
                type="button"
                onClick={handleAvatarChange}
                className="flex items-center gap-2 text-xs font-bold text-brand-primary hover:underline cursor-pointer"
              >
                <Camera className="h-4 w-4" /> Đổi ảnh đại diện
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5 max-w-2xl">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-xs font-bold text-brand-text outline-none focus:bg-white focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-1">
                    Địa chỉ Email
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-xs font-bold text-brand-text outline-none focus:bg-white focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-xs font-bold text-brand-text outline-none focus:bg-white focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-1">
                  Tiểu sử cá nhân (Bio)
                </label>
                <textarea
                  rows={4}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Viết một đoạn giới thiệu ngắn về bạn..."
                  className="w-full rounded-xl border border-brand-border bg-brand-bg p-4 text-xs font-medium text-brand-text outline-none focus:bg-white focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-xs font-bold uppercase text-white shadow-md hover:bg-brand-primary-hover cursor-pointer disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Đang lưu thay đổi...' : 'Lưu thay đổi'}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="rounded-xl border border-brand-border px-5 py-3 text-xs font-bold text-brand-text hover:bg-gray-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: SECURITY & PASSWORD */}
        {activeTab === 'security' && (
          <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm space-y-6 max-w-2xl">
            <div className="border-b border-brand-border pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-brand-text flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-brand-primary" /> Đổi mật khẩu tài khoản
              </h3>
              <p className="text-xs text-brand-text-muted">Cập nhật mật khẩu để bảo vệ an toàn cho tài khoản của bạn</p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-1">
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-brand-border bg-brand-bg py-3 pl-4 pr-10 text-xs font-bold text-brand-text outline-none focus:bg-white focus:ring-2 focus:ring-brand-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-1">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-brand-border bg-brand-bg py-3 pl-4 pr-10 text-xs font-bold text-brand-text outline-none focus:bg-white focus:ring-2 focus:ring-brand-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {newPassword.length > 0 && (
                  <div className="mt-2 space-y-1 bg-gray-50 p-2.5 rounded-xl border border-brand-border">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-gray-500">Độ mạnh:</span>
                      <span className={newPassStrength.color}>{newPassStrength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full ${newPassStrength.color.split(' ')[0]} ${newPassStrength.barWidthClass}`} />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-brand-border bg-brand-bg py-3 px-4 text-xs font-bold text-brand-text outline-none focus:bg-white focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full flex justify-center items-center gap-2 rounded-xl bg-brand-primary py-3 text-xs font-bold uppercase text-white shadow-md hover:bg-brand-primary-hover cursor-pointer disabled:opacity-60"
              >
                <Lock className="h-4 w-4" />
                {isSaving ? 'Đang cập nhật mật khẩu...' : 'Cập nhật mật khẩu'}
              </button>
            </form>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
