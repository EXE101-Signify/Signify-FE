import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowLeft,
  AtSign,
  BadgeCheck,
  Check,
  CheckCircle2,
  CircleAlert,
  Image,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  Settings,
  ShieldCheck,
  UserRound,
  VenusAndMars,
  X,
} from 'lucide-react';
import type { Screen } from '../../types';
import { authApi } from '../../services/authApi';
import { getStoredUser, type UserDTO } from '../../services/apiClient';
import { validateEmail } from '../../utils/validation';

interface ProfilePageProps {
  onNavigate?: (screen: Screen) => void;
  onLogout?: () => void;
}

interface ProfileView {
  id: string;
  username: string;
  role: 'USER' | 'ADMIN';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: boolean | null;
  address: string;
  avatar: string;
  emailVerified: boolean;
}

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300';

const FALLBACK_PROFILE: ProfileView = {
  id: 'local-user',
  username: 'signify.user',
  role: 'USER',
  firstName: 'Người dùng',
  lastName: 'Signify',
  email: 'user@signify.vn',
  phone: '',
  gender: null,
  address: '',
  avatar: FALLBACK_AVATAR,
  emailVerified: false,
};

function fromUserDto(user: UserDTO, current: ProfileView): ProfileView {
  return {
    ...current,
    id: String(user.userId),
    username: user.username,
    role: user.role,
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    email: user.email ?? '',
    phone: user.phone ?? '',
    gender: user.gender === 'true' ? true : user.gender === 'false' ? false : null,
    address: user.address ?? '',
    avatar: user.avatar || current.avatar,
    emailVerified: user.emailVerified,
  };
}

function fullName(profile: ProfileView) {
  return [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.username;
}

function genderLabel(value: boolean | null) {
  if (value === true) return 'Nam';
  if (value === false) return 'Nữ';
  return 'Chưa cập nhật';
}

const InfoCard = ({ icon, label, value, tone = 'mint' }: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: 'mint' | 'lavender' | 'peach';
}) => {
  const tones = {
    mint: 'border-[#bed8d0] bg-[#edf6f2] text-[#3f7c72]',
    lavender: 'border-[#d1c6dc] bg-[#f2edf5] text-[#776483]',
    peach: 'border-[#e4c2b7] bg-[#faece7] text-[#a76550]',
  };
  return <div className={`rounded-[20px] border-2 p-4 ${tones[tone]}`}><div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-sm">{icon}</span><div className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-[0.12em] opacity-75">{label}</span><strong className="mt-1 block truncate text-sm font-bold text-[#263934]">{value || 'Chưa cập nhật'}</strong></div></div></div>;
};

export default function ProfilePage({ onNavigate, onLogout }: ProfilePageProps) {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileView>(() => {
    const stored = getStoredUser();
    const saved = localStorage.getItem('signify.profile.preview');
    if (saved) {
      try { return JSON.parse(saved) as ProfileView; } catch { /* use stored/fallback */ }
    }
    return stored ? fromUserDto(stored, FALLBACK_PROFILE) : FALLBACK_PROFILE;
  });
  const [draft, setDraft] = useState(profile);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authApi.getProfile().then((response) => {
      if (!response.success || !response.data) return;
      setProfile((current) => {
        const updated = fromUserDto(response.data!, current);
        setDraft(updated);
        return updated;
      });
    }).catch(() => undefined);
  }, []);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 3200);
  };

  const beginEdit = () => {
    setDraft(profile);
    setError(null);
    setEditing(true);
  };

  const saveProfile = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const emailError = draft.email ? validateEmail(draft.email) : null;
    if (emailError) { setError(emailError); return; }
    if (draft.firstName.length > 100 || draft.lastName.length > 100) { setError('Họ và tên không được vượt quá 100 ký tự mỗi trường.'); return; }
    if (draft.phone.length > 20) { setError('Số điện thoại không được vượt quá 20 ký tự.'); return; }
    if (draft.address.length > 500) { setError('Địa chỉ không được vượt quá 500 ký tự.'); return; }
    setSaving(true);
    window.setTimeout(() => {
      const emailChanged = draft.email.trim() !== profile.email;
      const updated = {
        ...draft,
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim(),
        address: draft.address.trim(),
        avatar: draft.avatar.trim() || FALLBACK_AVATAR,
        emailVerified: emailChanged ? false : profile.emailVerified,
      };
      setProfile(updated);
      setDraft(updated);
      localStorage.setItem('signify.profile.preview', JSON.stringify(updated));
      setSaving(false);
      setEditing(false);
      showNotice('Đã lưu hồ sơ trên bản xem trước.');
    }, 450);
  };

  return (
    <main className="auth-dot-surface min-h-screen bg-gradient-to-br from-[#dfeee9] via-[#f2edf6] to-[#f7e4dd] font-sans text-[#21322e]">
      <header className="sticky top-0 z-30 border-b-2 border-[#aecbc2] bg-gradient-to-r from-[#e2f0eb]/95 via-[#f2edf6]/95 to-[#f8e5df]/95 shadow-[0_8px_28px_rgba(57,86,78,0.1)] backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4"><button type="button" onClick={() => onNavigate?.('dashboard')} aria-label="Quay lại tin nhắn" className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-[#b4cdc5] bg-white/75 text-[#45675f] transition hover:-translate-x-0.5 hover:bg-white"><ArrowLeft className="h-5 w-5" /></button><img src="/signify-logo-transparent.png" alt="Signify" className="h-12 w-auto object-contain drop-shadow-sm" /><span className="h-9 w-[2px] rounded-full bg-[#9fc1b7]" /><div><h1 className="text-lg font-bold">Hồ sơ cá nhân</h1><p className="text-[11px] font-medium text-[#657a73]">Thông tin tài khoản của bạn</p></div></div>
          <div className="flex items-center gap-2"><button type="button" onClick={() => onNavigate?.('settings')} className="flex h-10 items-center gap-2 rounded-xl border-2 border-[#b4cdc5] bg-white/70 px-3 text-xs font-bold text-[#45675f] hover:bg-white"><Settings className="h-4 w-4" />Cài đặt</button>{onLogout && <button type="button" onClick={onLogout} className="flex h-10 items-center gap-2 rounded-xl border-2 border-[#e0b7ad] bg-[#fff5f2] px-3 text-xs font-bold text-[#a65443] hover:bg-white"><LogOut className="h-4 w-4" />Đăng xuất</button>}</div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <section className="overflow-hidden rounded-[30px] border-2 border-[#b6cfc7] bg-white/90 shadow-[0_22px_60px_rgba(55,83,74,0.14)]">
          <div className="relative overflow-hidden bg-gradient-to-r from-[#d4eae2] via-[#e8e0ef] to-[#f5d9d0] px-7 py-7"><span className="pointer-events-none absolute -right-8 -top-16 h-44 w-44 rounded-full border-[34px] border-white/20" /><div className="relative flex flex-wrap items-center justify-between gap-6"><div className="flex items-center gap-5"><img src={editing ? draft.avatar || FALLBACK_AVATAR : profile.avatar} alt={fullName(profile)} className="h-24 w-24 rounded-[26px] border-4 border-white object-cover shadow-[0_14px_35px_rgba(55,75,68,0.2)]" referrerPolicy="no-referrer" /><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl font-bold tracking-[-0.02em]">{fullName(profile)}</h2>{profile.emailVerified && <BadgeCheck className="h-5 w-5 text-[#3f7c72]" />}</div><p className="mt-1 text-sm font-medium text-[#60756e]">@{profile.username}</p><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full border border-[#90b8ac] bg-white/70 px-3 py-1 text-[10px] font-bold text-[#356b61]">{profile.role}</span><span className={`rounded-full border bg-white/70 px-3 py-1 text-[10px] font-bold ${profile.emailVerified ? 'border-[#90b8ac] text-[#356b61]' : 'border-[#dfb6aa] text-[#9b5a46]'}`}>{profile.emailVerified ? 'Email đã xác thực' : 'Email chưa xác thực'}</span></div></div></div>{!editing && <button type="button" onClick={beginEdit} className="rounded-2xl border-2 border-[#6f9d91] bg-white/75 px-5 py-3 text-xs font-bold text-[#3f6d64] shadow-sm transition hover:bg-white">Chỉnh sửa hồ sơ</button>}</div></div>
        </section>

        {error && <div className="flex items-center gap-3 rounded-2xl border-2 border-[#e2b6ad] bg-[#fff2ee] px-4 py-3 text-xs font-bold text-[#a64e3e]"><CircleAlert className="h-4 w-4" />{error}<button type="button" onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4" /></button></div>}

        {!editing ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
            <section className="overflow-hidden rounded-[28px] border-2 border-[#b9d2ca] bg-white/90 shadow-[0_18px_50px_rgba(55,83,74,0.1)]"><div className="border-b-2 border-[#b9d2ca] bg-[#e4f1ed] px-6 py-5"><h3 className="text-base font-bold">Thông tin cá nhân</h3><p className="mt-1 text-xs text-[#657a73]">Các trường hiện được backend cho phép xem và cập nhật.</p></div><div className="grid gap-4 p-6 sm:grid-cols-2"><InfoCard icon={<UserRound className="h-5 w-5" />} label="Họ và tên" value={fullName(profile)} /><InfoCard icon={<Mail className="h-5 w-5" />} label="Địa chỉ email" value={profile.email} tone="lavender" /><InfoCard icon={<Phone className="h-5 w-5" />} label="Số điện thoại" value={profile.phone} tone="peach" /><InfoCard icon={<VenusAndMars className="h-5 w-5" />} label="Giới tính" value={genderLabel(profile.gender)} /><InfoCard icon={<MapPin className="h-5 w-5" />} label="Địa chỉ" value={profile.address} tone="lavender" /></div></section>
            <aside className="space-y-6"><section className="overflow-hidden rounded-[28px] border-2 border-[#cbbfd6] bg-white/90 shadow-[0_18px_50px_rgba(76,62,84,0.1)]"><div className="border-b-2 border-[#cbbfd6] bg-[#eee8f3] px-5 py-4"><h3 className="text-sm font-bold">Trạng thái tài khoản</h3></div><div className="divide-y-2 divide-[#e2dbe8] px-5"><div className="flex items-center justify-between gap-3 py-4 text-xs"><span className="text-[#73817c]">Xác thực email</span><strong className={`flex items-center gap-1 ${profile.emailVerified ? 'text-[#377366]' : 'text-[#a25e4c]'}`}>{profile.emailVerified ? <CheckCircle2 className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}{profile.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}</strong></div><div className="flex items-center justify-between py-4 text-xs"><span className="text-[#73817c]">Vai trò</span><strong>{profile.role}</strong></div><div className="flex items-center justify-between py-4 text-xs"><span className="text-[#73817c]">User ID</span><strong>#{profile.id}</strong></div></div></section><section className="rounded-[28px] border-2 border-[#dfb9ae] bg-[#fff3ef] p-5 text-xs leading-5 text-[#835f56]"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#a96652]" /><p>Username, vai trò và trạng thái tài khoản chỉ đọc; người dùng không thể tự thay đổi các trường này.</p></div></section></aside>
          </div>
        ) : (
          <form onSubmit={saveProfile} className="overflow-hidden rounded-[28px] border-2 border-[#b9d2ca] bg-white/90 shadow-[0_18px_50px_rgba(55,83,74,0.1)]"><div className="border-b-2 border-[#b9d2ca] bg-gradient-to-r from-[#e2f0eb] to-[#eee8f3] px-6 py-5"><h3 className="text-base font-bold">Chỉnh sửa hồ sơ</h3><p className="mt-1 text-xs text-[#657a73]">Form này khớp với `PATCH /api/users/profile`.</p></div><div className="grid gap-5 p-6 sm:grid-cols-2">
            <label className="block"><span className="text-xs font-bold text-[#526a63]">Họ</span><input maxLength={100} value={draft.firstName} onChange={(event) => setDraft({ ...draft, firstName: event.target.value })} className="mt-2 w-full rounded-2xl border-2 border-[#c8dcd5] bg-[#f8fbfa] px-4 py-3 text-sm outline-none focus:border-[#6f9d91] focus:ring-4 focus:ring-[#6f9d91]/10" /></label>
            <label className="block"><span className="text-xs font-bold text-[#526a63]">Tên</span><input maxLength={100} value={draft.lastName} onChange={(event) => setDraft({ ...draft, lastName: event.target.value })} className="mt-2 w-full rounded-2xl border-2 border-[#c8dcd5] bg-[#f8fbfa] px-4 py-3 text-sm outline-none focus:border-[#6f9d91] focus:ring-4 focus:ring-[#6f9d91]/10" /></label>
            <label className="block"><span className="text-xs font-bold text-[#526a63]">Email</span><input type="email" maxLength={150} value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} className="mt-2 w-full rounded-2xl border-2 border-[#d2c7dc] bg-[#fbf9fc] px-4 py-3 text-sm outline-none focus:border-[#9477a0] focus:ring-4 focus:ring-[#9477a0]/10" /><small className="mt-1.5 block text-[10px] text-[#8a7c90]">Đổi email sẽ chuyển trạng thái về chưa xác thực.</small></label>
            <label className="block"><span className="text-xs font-bold text-[#526a63]">Số điện thoại</span><input maxLength={20} value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} className="mt-2 w-full rounded-2xl border-2 border-[#e1c5bc] bg-[#fffaf8] px-4 py-3 text-sm outline-none focus:border-[#c77b64] focus:ring-4 focus:ring-[#c77b64]/10" /></label>
            <label className="block"><span className="text-xs font-bold text-[#526a63]">Giới tính</span><select value={draft.gender === null ? '' : String(draft.gender)} onChange={(event) => setDraft({ ...draft, gender: event.target.value === '' ? null : event.target.value === 'true' })} className="mt-2 w-full rounded-2xl border-2 border-[#c8dcd5] bg-[#f8fbfa] px-4 py-3 text-sm outline-none focus:border-[#6f9d91]"><option value="">Chưa cập nhật</option><option value="true">Nam</option><option value="false">Nữ</option></select></label>
            <label className="block"><span className="text-xs font-bold text-[#526a63]">Username</span><div className="relative mt-2"><AtSign className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#82918c]" /><input disabled value={draft.username} className="w-full cursor-not-allowed rounded-2xl border-2 border-[#d8e1de] bg-[#eff3f1] py-3 pl-10 pr-4 text-sm text-[#788781]" /></div></label>
            <label className="block sm:col-span-2"><span className="text-xs font-bold text-[#526a63]">Địa chỉ</span><textarea rows={3} maxLength={500} value={draft.address} onChange={(event) => setDraft({ ...draft, address: event.target.value })} className="mt-2 w-full resize-none rounded-2xl border-2 border-[#d2c7dc] bg-[#fbf9fc] px-4 py-3 text-sm leading-6 outline-none focus:border-[#9477a0]" /></label>
            <label className="block sm:col-span-2"><span className="text-xs font-bold text-[#526a63]">URL ảnh đại diện</span><div className="relative mt-2"><Image className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#82918c]" /><input maxLength={2048} value={draft.avatar} onChange={(event) => setDraft({ ...draft, avatar: event.target.value })} className="w-full rounded-2xl border-2 border-[#c8dcd5] bg-[#f8fbfa] py-3 pl-10 pr-4 text-sm outline-none focus:border-[#6f9d91]" /></div><small className="mt-1.5 block text-[10px] text-[#7e8f89]">Backend cập nhật hồ sơ hiện nhận chuỗi avatar, chưa có API upload avatar riêng.</small></label>
          </div><div className="flex justify-end gap-3 border-t-2 border-[#d5e2de] bg-[#f7faf9] px-6 py-4"><button type="button" onClick={() => { setDraft(profile); setEditing(false); setError(null); }} className="rounded-xl border-2 border-[#c7d6d1] bg-white px-4 py-2.5 text-xs font-bold text-[#64756f]">Hủy</button><button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-[#3f7c72] px-5 py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button></div></form>
        )}
      </div>

      {notice && <div role="status" className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border-2 border-[#b9d2ca] bg-white px-4 py-3 text-xs font-bold text-[#40564f] shadow-[0_18px_45px_rgba(45,72,64,0.18)]"><Check className="h-4 w-4 text-[#3f7c72]" />{notice}<button type="button" onClick={() => setNotice(null)}><X className="h-4 w-4 text-[#87958f]" /></button></div>}
    </main>
  );
}
