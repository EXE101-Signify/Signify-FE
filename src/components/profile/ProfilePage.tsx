import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowLeft,
  AtSign,
  Bell,
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
import { getStoredUser, setStoredUser, type UserDTO } from '../../services/apiClient';
import { validateEmail } from '../../utils/validation';

interface ProfilePageProps {
  onNavigate?: (screen: Screen) => void;
  onLogout?: () => void;
}

interface ProfileView {
  id: string;
  username: string;
  role: 'USER' | 'ADMIN' | '';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: boolean | null;
  address: string;
  avatar: string;
  emailVerified: boolean | null;
}

const EMPTY_PROFILE: ProfileView = {
  id: '', username: '', role: '', firstName: '', lastName: '', email: '', phone: '',
  gender: null, address: '', avatar: '', emailVerified: null,
};

function fromUserDto(user: UserDTO): ProfileView {
  return {
    ...EMPTY_PROFILE,
    id: String(user.userId),
    username: user.username,
    role: user.role,
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    email: user.email ?? '',
    phone: user.phone ?? '',
    gender: user.gender === 'true' ? true : user.gender === 'false' ? false : null,
    address: user.address ?? '',
    avatar: user.avatar ?? '',
    emailVerified: user.emailVerified,
  };
}

function fullName(profile: ProfileView) {
  return [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.username || 'No data';
}

function genderLabel(value: boolean | null) {
  if (value === true) return 'Nam';
  if (value === false) return 'Nữ';
  return 'No data';
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
  return <div className={`rounded-[20px] border-2 p-4 ${tones[tone]}`}><div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-sm">{icon}</span><div className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-[0.12em] opacity-75">{label}</span><strong className="mt-1 block truncate text-sm font-bold text-[#263934]">{value || 'No data'}</strong></div></div></div>;
};

export default function ProfilePage({ onNavigate, onLogout }: ProfilePageProps) {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileView>(() => {
    const stored = getStoredUser();
    return stored ? fromUserDto(stored) : EMPTY_PROFILE;
  });
  const [draft, setDraft] = useState(profile);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState<'personal' | 'security' | 'notifications'>('personal');

  useEffect(() => {
    authApi.getProfile().then((response) => {
      if (!response.success || !response.data) return;
      setProfile((current) => {
        const updated = fromUserDto(response.data!);
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

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const emailError = draft.email ? validateEmail(draft.email) : null;
    if (emailError) { setError(emailError); return; }
    if (draft.firstName.length > 100 || draft.lastName.length > 100) { setError('Họ và tên không được vượt quá 100 ký tự mỗi trường.'); return; }
    if (draft.phone.length > 20) { setError('Số điện thoại không được vượt quá 20 ký tự.'); return; }
    if (draft.address.length > 500) { setError('Địa chỉ không được vượt quá 500 ký tự.'); return; }
    setSaving(true);
    try {
      const response = await authApi.updateProfile({
        email: draft.email.trim(), firstName: draft.firstName.trim(), lastName: draft.lastName.trim(),
        avatar: draft.avatar.trim(), phone: draft.phone.trim(), gender: draft.gender,
        address: draft.address.trim(),
      });
      if (!response.data) throw new Error(response.message || 'Không nhận được hồ sơ đã cập nhật.');
      const updated = fromUserDto(response.data);
      setStoredUser(response.data);
      setProfile(updated);
      setDraft(updated);
      setEditing(false);
      showNotice('Đã lưu hồ sơ.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu hồ sơ.');
    } finally { setSaving(false); }
  };

  return (
    <main className="min-h-screen bg-[#f5faf8] font-sans text-[#172b2c]">
      <header className="sticky top-0 z-30 border-b border-[#e2ebe8] bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-[76px] max-w-[1328px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4"><button type="button" onClick={() => onNavigate?.('dashboard')} aria-label="Quay lại tin nhắn" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#526a63] transition hover:bg-[#f2f8f6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f8274]"><ArrowLeft className="h-5 w-5" /></button><img src="/signify-logo-transparent.png" alt="Signify" className="h-9 w-auto max-w-24 object-contain sm:h-11" /><span className="hidden h-9 w-px bg-[#e2ebe8] sm:block" /><div className="min-w-0"><h1 className="truncate text-base font-bold sm:text-lg">Hồ sơ cá nhân</h1><p className="hidden text-xs text-[#687b80] sm:block">Quản lý thông tin tài khoản của bạn</p></div></div>
          <div className="flex items-center gap-1.5 sm:gap-2"><button type="button" onClick={() => onNavigate?.('settings')} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-[#45675f] hover:bg-[#f2f8f6] focus-visible:outline-2 focus-visible:outline-[#2f8274]"><Settings className="h-4 w-4" /><span className="hidden sm:inline">Cài đặt</span></button>{onLogout && <button type="button" onClick={onLogout} className="flex min-h-11 items-center gap-2 rounded-lg border border-[#f0d2cc] px-3 text-xs font-semibold text-[#a34e40] hover:bg-[#fff7f5] focus-visible:outline-2 focus-visible:outline-[#d95c47]"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Đăng xuất</span></button>}</div>
        </div>
      </header>

      <div className="mx-auto max-w-[1328px] px-3 py-5 sm:px-6 sm:py-9">
        <section className="grid gap-5 rounded-2xl border border-[#e2ebe8] bg-white p-3 shadow-[0_12px_36px_rgba(30,80,70,0.05)] sm:gap-7 sm:p-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-9 lg:p-6">
          <aside className="rounded-2xl bg-[#f2f8f6] p-4 sm:p-5">
            <div className="flex items-center gap-4 lg:flex-col lg:items-center lg:text-center">
              <div className="relative shrink-0">{profile.avatar ? <img src={profile.avatar} alt={`Ảnh đại diện ${fullName(profile)}`} onError={(event) => { event.currentTarget.style.display = 'none'; }} className="h-20 w-20 rounded-full border border-[#e2ebe8] bg-white object-cover sm:h-24 sm:w-24" referrerPolicy="no-referrer" /> : <span className="flex h-20 w-20 items-center justify-center rounded-full border border-[#e2ebe8] bg-white text-[#78918a] sm:h-24 sm:w-24"><UserRound className="h-9 w-9" aria-hidden="true" /></span>}</div>
              <div className="min-w-0 lg:w-full"><h2 className="break-words text-lg font-bold">{fullName(profile)}</h2><p className="mt-1 truncate text-sm text-[#687b80]">@{profile.username || '—'}</p><span className="mt-2 inline-flex rounded-full bg-[#e4efeb] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#356b61]">{profile.role || 'Chưa cập nhật'}</span></div>
            </div>
            <nav aria-label="Mục hồ sơ" className="mt-5 grid grid-cols-3 gap-1 lg:grid-cols-1 lg:gap-1.5">
              {([{id:'personal', label:'Thông tin cá nhân', Icon:UserRound}, {id:'security', label:'Tài khoản & bảo mật', Icon:ShieldCheck}, {id:'notifications', label:'Thông báo', Icon:Bell}] as const).map(({id,label,Icon}) => <button key={id} type="button" onClick={() => { setSection(id); setEditing(false); setError(null); }} aria-current={section === id ? 'page' : undefined} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 py-2 text-center text-[10px] font-semibold transition focus-visible:outline-2 focus-visible:outline-[#2f8274] sm:text-xs lg:justify-start lg:px-3 ${section === id ? 'bg-[#dff1eb] text-[#246b60]' : 'text-[#687b80] hover:bg-white'}`}><Icon className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="leading-tight">{label}</span></button>)}
            </nav>
          </aside>

          <div className="min-w-0 rounded-xl px-2 py-2 sm:px-3 sm:py-3">
          {error && <div role="alert" className="mb-4 flex items-center gap-3 rounded-xl border border-[#f0d2cc] bg-[#fff7f5] px-4 py-3 text-sm font-medium text-[#a64e3e]"><CircleAlert className="h-4 w-4 shrink-0" />{error}<button type="button" aria-label="Đóng thông báo lỗi" onClick={() => setError(null)} className="ml-auto flex h-11 w-11 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-[#d95c47]"><X className="h-4 w-4" /></button></div>}

          {section === 'personal' && (editing ? (
          <form onSubmit={saveProfile} className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2ebe8] pb-5"><div><h2 className="text-xl font-bold">Chỉnh sửa thông tin</h2><p className="mt-1 text-sm text-[#687b80]">Cập nhật thông tin hiển thị của bạn</p></div></div>
            <div className="grid gap-4 py-5 sm:grid-cols-2">
            <label className="block"><span className="text-xs font-bold text-[#526a63]">Họ</span><input maxLength={100} value={draft.firstName} onChange={(event) => setDraft({ ...draft, firstName: event.target.value })} className="mt-2 min-h-11 w-full rounded-xl border border-[#d6e2dd] bg-white px-4 py-3 text-sm outline-none focus:border-[#2f8274] focus:ring-2 focus:ring-[#2f8274]/15" /></label>
            <label className="block"><span className="text-xs font-bold text-[#526a63]">Tên</span><input maxLength={100} value={draft.lastName} onChange={(event) => setDraft({ ...draft, lastName: event.target.value })} className="mt-2 min-h-11 w-full rounded-xl border border-[#d6e2dd] bg-white px-4 py-3 text-sm outline-none focus:border-[#2f8274] focus:ring-2 focus:ring-[#2f8274]/15" /></label>
            <label className="block"><span className="text-xs font-bold text-[#526a63]">Email</span><input type="email" maxLength={150} value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} className="mt-2 min-h-11 w-full rounded-xl border border-[#d6e2dd] bg-white px-4 py-3 text-sm outline-none focus:border-[#2f8274] focus:ring-2 focus:ring-[#2f8274]/15" /><small className="mt-1.5 block text-xs text-[#687b80]">Đổi email sẽ chuyển trạng thái về chưa xác thực.</small></label>
            <label className="block"><span className="text-xs font-bold text-[#526a63]">Số điện thoại</span><input maxLength={20} value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} className="mt-2 min-h-11 w-full rounded-xl border border-[#d6e2dd] bg-white px-4 py-3 text-sm outline-none focus:border-[#2f8274] focus:ring-2 focus:ring-[#2f8274]/15" /></label>
            <label className="block"><span className="text-xs font-bold text-[#526a63]">Giới tính</span><select value={draft.gender === null ? '' : String(draft.gender)} onChange={(event) => setDraft({ ...draft, gender: event.target.value === '' ? null : event.target.value === 'true' })} className="mt-2 min-h-11 w-full rounded-xl border border-[#d6e2dd] bg-white px-4 py-3 text-sm outline-none focus:border-[#2f8274]"><option value="">Chưa cập nhật</option><option value="true">Nam</option><option value="false">Nữ</option></select></label>
            <label className="block"><span className="text-xs font-bold text-[#526a63]">Tên đăng nhập</span><input disabled value={draft.username} className="mt-2 min-h-11 w-full rounded-xl border border-[#e2ebe8] bg-[#f2f8f6] px-4 py-3 text-sm text-[#687b80]" /></label>
            <label className="block sm:col-span-2"><span className="text-xs font-bold text-[#526a63]">Địa chỉ</span><textarea rows={3} maxLength={500} value={draft.address} onChange={(event) => setDraft({ ...draft, address: event.target.value })} className="mt-2 w-full resize-y rounded-xl border border-[#d6e2dd] bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-[#2f8274]" /></label>
            <label className="block sm:col-span-2"><span className="text-xs font-bold text-[#526a63]">URL ảnh đại diện</span><input maxLength={2048} value={draft.avatar} onChange={(event) => setDraft({ ...draft, avatar: event.target.value })} className="mt-2 min-h-11 w-full rounded-xl border border-[#d6e2dd] bg-white px-4 py-3 text-sm outline-none focus:border-[#2f8274]" /><small className="mt-1.5 block text-xs text-[#687b80]">Backend hiện nhận URL ảnh; chưa có API tải ảnh lên.</small></label>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#e2ebe8] pt-4"><button type="button" onClick={() => { setDraft(profile); setEditing(false); setError(null); }} className="min-h-11 rounded-lg border border-[#d6e2dd] px-4 text-sm font-semibold text-[#526a63] hover:bg-[#f2f8f6]">Hủy</button><button type="submit" disabled={saving} className="flex min-h-11 items-center gap-2 rounded-lg bg-[#2f8274] px-4 text-sm font-semibold text-white hover:bg-[#246b60] disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button></div>
          </form>
          ) : (
          <section aria-labelledby="personal-info-title">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2ebe8] pb-5"><div><h2 id="personal-info-title" className="text-xl font-bold">Thông tin cá nhân</h2><p className="mt-1 text-sm text-[#687b80]">Cập nhật thông tin hiển thị của bạn</p></div>{!editing && <button type="button" onClick={beginEdit} className="flex min-h-11 items-center gap-2 rounded-xl bg-[#2f8274] px-4 text-sm font-semibold text-white transition hover:bg-[#246b60] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f8274]"><Image className="h-4 w-4" aria-hidden="true" />Chỉnh sửa</button>}</div>
            <dl className="mt-2 divide-y divide-[#e2ebe8]">
              {[
                {icon:<UserRound className="h-4 w-4" />, label:'Họ và tên', value:fullName(profile)},
                {icon:<Mail className="h-4 w-4" />, label:'Email', value:profile.email || 'Chưa cập nhật'},
                {icon:<Phone className="h-4 w-4" />, label:'Số điện thoại', value:profile.phone || 'Chưa cập nhật'},
                {icon:<VenusAndMars className="h-4 w-4" />, label:'Giới tính', value:profile.gender === null ? 'Chưa cập nhật' : genderLabel(profile.gender)},
                {icon:<MapPin className="h-4 w-4" />, label:'Địa chỉ', value:profile.address || 'Chưa cập nhật'},
              ].map((item) => <div key={item.label} className="grid min-w-0 grid-cols-[32px_minmax(0,150px)_minmax(0,1fr)] items-center gap-2 py-4 sm:grid-cols-[36px_minmax(0,190px)_minmax(0,1fr)] sm:gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg text-[#71847d]">{item.icon}</span><dt className="text-xs font-medium text-[#687b80] sm:text-sm">{item.label}</dt><dd className="min-w-0 break-words text-sm font-semibold text-[#172b2c]">{item.value}</dd></div>)}
              <div className="grid min-w-0 grid-cols-[32px_minmax(0,150px)_minmax(0,1fr)] items-center gap-2 py-4 sm:grid-cols-[36px_minmax(0,190px)_minmax(0,1fr)] sm:gap-3"><span className="flex h-8 w-8 items-center justify-center text-[#71847d]"><ShieldCheck className="h-4 w-4" /></span><dt className="text-xs font-medium text-[#687b80] sm:text-sm">Xác thực email</dt><dd><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${profile.emailVerified ? 'bg-[#e5f4ed] text-[#276650]' : 'bg-[#fff0e8] text-[#98563e]'}`}>{profile.emailVerified === null ? 'Chưa cập nhật' : profile.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}</span></dd></div>
            </dl>
          </section>
          ))}

          {section === 'security' && <section aria-labelledby="security-title"><h2 id="security-title" className="border-b border-[#e2ebe8] pb-5 text-xl font-bold">Tài khoản & bảo mật</h2><p className="mt-1 text-sm text-[#687b80]">Thông tin định danh và trạng thái tài khoản</p><dl className="mt-3 divide-y divide-[#e2ebe8]">{[{label:'Tên đăng nhập',value:profile.username ? `@${profile.username}` : 'Chưa cập nhật'},{label:'Vai trò',value:profile.role || 'Chưa cập nhật'},{label:'Mã người dùng',value:profile.id ? `#${profile.id}` : 'Chưa cập nhật'},{label:'Trạng thái email',value:profile.emailVerified === null ? 'Chưa cập nhật' : profile.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}].map((item)=><div key={item.label} className="flex flex-wrap items-center justify-between gap-2 py-4"><dt className="text-sm text-[#687b80]">{item.label}</dt><dd className="break-all text-sm font-semibold">{item.value}</dd></div>)}</dl><p className="mt-5 rounded-xl bg-[#f2f8f6] p-4 text-sm leading-6 text-[#526a63]">Tên đăng nhập, vai trò và mã người dùng là thông tin chỉ đọc. Để cập nhật email hoặc thông tin hồ sơ, hãy dùng mục Thông tin cá nhân.</p></section>}

          {section === 'notifications' && <section aria-labelledby="notifications-title"><h2 id="notifications-title" className="text-xl font-bold">Thông báo</h2><p className="mt-1 text-sm text-[#687b80]">Quản lý thông báo của bạn</p><div className="mt-5 rounded-xl border border-[#e2ebe8] bg-[#f8fbfa] p-5"><p className="text-sm leading-6 text-[#526a63]">Cài đặt thông báo hiện được quản lý trong trang Cài đặt.</p><button type="button" onClick={() => onNavigate?.('settings')} className="mt-4 min-h-11 rounded-lg bg-[#2f8274] px-4 text-sm font-semibold text-white hover:bg-[#246b60] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f8274]">Mở Cài đặt</button></div></section>}
        </div>
      </section>
      </div>

      {notice && <div role="status" className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-[#cde1d9] bg-white px-4 py-3 text-sm font-semibold text-[#40564f] shadow-[0_18px_45px_rgba(45,72,64,0.18)]"><Check className="h-4 w-4 text-[#3f7c72]" />{notice}<button type="button" aria-label="Đóng thông báo" onClick={() => setNotice(null)} className="flex h-11 w-11 items-center justify-center"><X className="h-4 w-4 text-[#87958f]" /></button></div>}
    </main>
  );
}
