import { useState, type ComponentType } from 'react';
import {
  ArrowLeft,
  Bell,
  Ban,
  Check,
  ChevronRight,
  Eye,
  Globe2,
  Laptop,
  LockKeyhole,
  LogOut,
  MoonStar,
  Palette,
  Settings2,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserRound,
  UserX,
  X,
} from 'lucide-react';
import type { Screen } from '../../types';
import { getStoredUser } from '../../services/apiClient';

type SettingsSection = 'account' | 'notifications' | 'privacy' | 'appearance';

interface BlockedUserItem {
  id: string;
  name: string;
  avatar: string;
  blockedAt: string;
}

const INITIAL_BLOCKED_USERS: BlockedUserItem[] = [
  { id: 'blocked-1', name: 'Hoàng Nam', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=160', blockedAt: 'Đã chặn ngày 02/10/2026' },
  { id: 'blocked-2', name: 'Tài khoản hỗ trợ cũ', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=160', blockedAt: 'Đã chặn ngày 28/09/2026' },
];

interface SettingsPageProps {
  onNavigate: (screen: Screen) => void;
}

interface ToggleRowProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

const ToggleRow = ({ title, description, checked, onChange }: ToggleRowProps) => (
  <div className="flex items-center justify-between gap-6 border-b-2 border-[#d8e5e0] px-5 py-4 last:border-0 even:bg-[#f8f5fa]/65">
    <div>
      <h3 className="text-sm font-bold text-[#263934]">{title}</h3>
      <p className="mt-1 max-w-xl text-xs leading-5 text-[#788781]">{description}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full border transition ${checked ? 'border-[#3f7c72] bg-[#3f7c72]' : 'border-[#b9cac5] bg-[#dfe8e5]'}`}
    >
      <span className={`absolute top-1 h-[18px] w-[18px] rounded-full bg-white shadow-sm transition ${checked ? 'left-[25px]' : 'left-1'}`} />
    </button>
  </div>
);

export default function SettingsPage({ onNavigate }: SettingsPageProps) {
  const user = getStoredUser();
  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username
    : 'Người dùng Signify';
  const email = user?.email || 'user@signify.vn';
  const avatar = user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=160';

  const [activeSection, setActiveSection] = useState<SettingsSection>('account');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [callNotifications, setCallNotifications] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [theme, setTheme] = useState<'light' | 'system'>('light');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [deleteAccepted, setDeleteAccepted] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [blockedUsers, setBlockedUsers] = useState(INITIAL_BLOCKED_USERS);
  const [unblockTarget, setUnblockTarget] = useState<BlockedUserItem | null>(null);
  const [logoutAllOpen, setLogoutAllOpen] = useState(false);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 3200);
  };

  const closeDeleteModal = () => {
    setDeleteOpen(false);
    setConfirmation('');
    setDeleteAccepted(false);
  };

  const confirmDelete = () => {
    closeDeleteModal();
    showNotice('Giao diện xác nhận đã hoàn tất. Chức năng xóa sẽ hoạt động sau khi kết nối API.');
  };

  const confirmUnblock = () => {
    if (!unblockTarget) return;
    setBlockedUsers((current) => current.filter((item) => item.id !== unblockTarget.id));
    showNotice(`Đã bỏ chặn ${unblockTarget.name} trên bản xem trước.`);
    setUnblockTarget(null);
  };

  const sections: Array<{ id: SettingsSection; label: string; description: string; icon: ComponentType<{ className?: string }> }> = [
    { id: 'account', label: 'Tài khoản', description: 'Thông tin và thiết bị', icon: UserRound },
    { id: 'notifications', label: 'Thông báo', description: 'Tin nhắn và cuộc gọi', icon: Bell },
    { id: 'privacy', label: 'Quyền riêng tư', description: 'Hiện diện và bảo mật', icon: ShieldCheck },
    { id: 'appearance', label: 'Giao diện', description: 'Màu sắc và hiển thị', icon: Palette },
  ];

  return (
    <main className="auth-dot-surface min-h-screen bg-gradient-to-br from-[#dfeee9] via-[#f2edf6] to-[#f7e4dd] font-sans text-[#21322e]">
      <header className="sticky top-0 z-30 border-b-2 border-[#aecbc2] bg-gradient-to-r from-[#e2f0eb]/95 via-[#f2edf6]/95 to-[#f8e5df]/95 shadow-[0_8px_28px_rgba(57,86,78,0.1)] backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => onNavigate('dashboard')} aria-label="Quay lại trang tin nhắn" className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#cbdcd6] bg-white text-[#45675f] transition hover:-translate-x-0.5 hover:border-[#76a397] hover:bg-[#edf6f2]"><ArrowLeft className="h-5 w-5" /></button>
            <img src="/signify-logo-transparent.png" alt="Signify" className="h-12 w-auto object-contain drop-shadow-sm" />
            <span className="h-9 w-[2px] rounded-full bg-[#9fc1b7]" />
            <div><h1 className="text-lg font-bold">Cài đặt</h1><p className="text-[11px] font-medium text-[#657a73]">Quản lý trải nghiệm Signify của bạn</p></div>
          </div>
          <button type="button" onClick={() => onNavigate('profile')} className="flex items-center gap-3 rounded-2xl border border-[#d9e4e0] bg-white px-3 py-2 text-left shadow-sm transition hover:border-[#9bbcb3]">
            <img src={avatar} alt="" className="h-9 w-9 rounded-xl object-cover" referrerPolicy="no-referrer" />
            <span className="hidden sm:block"><strong className="block max-w-40 truncate text-xs">{displayName}</strong><small className="block max-w-40 truncate text-[10px] text-[#87958f]">{email}</small></span>
            <ChevronRight className="h-4 w-4 text-[#82918c]" />
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-7 px-6 py-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="h-fit overflow-hidden rounded-[28px] border-2 border-[#b8d0c8] bg-[#f8fbfa]/90 shadow-[0_20px_55px_rgba(55,83,74,0.14)] backdrop-blur-xl">
          <div className="relative overflow-hidden border-b-2 border-[#b8d0c8] bg-gradient-to-br from-[#d8ebe4] via-[#ece5f1] to-[#f6ddd5] px-5 py-5">
            <span className="pointer-events-none absolute -right-7 -top-8 h-24 w-24 rounded-full border-[18px] border-white/25" />
            <div className="relative flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-white/75 text-[#3f7c72] shadow-sm"><Settings2 className="h-5 w-5" /></span>
              <div><h2 className="text-base font-bold text-[#263934]">Trung tâm cài đặt</h2><p className="mt-0.5 text-[11px] font-medium text-[#657a73]">4 nhóm tùy chỉnh cá nhân</p></div>
            </div>
            <div className="relative mt-4 flex gap-1.5" aria-hidden="true"><span className="h-1.5 flex-1 rounded-full bg-[#4c8b7f]" /><span className="h-1.5 flex-1 rounded-full bg-[#9477a0]" /><span className="h-1.5 flex-1 rounded-full bg-[#d08a73]" /><span className="h-1.5 flex-1 rounded-full bg-white/80" /></div>
          </div>
          <nav className="divide-y-2 divide-[#d8e5e0] p-3" aria-label="Danh mục cài đặt">
            {sections.map(({ id, label, description, icon: Icon }) => {
              const active = activeSection === id;
              return <button key={id} type="button" onClick={() => setActiveSection(id)} className={`my-1 flex w-full items-center gap-3 rounded-[17px] border px-3.5 py-3.5 text-left transition ${active ? 'border-[#315f57] bg-[#3f7c72] text-white shadow-[0_10px_25px_rgba(63,124,114,0.24)]' : 'border-transparent text-[#526a63] hover:border-[#9fc1b7] hover:bg-[#edf6f2]'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-white/15' : 'bg-[#e4f0ec]'}`}><Icon className="h-4.5 w-4.5" /></span><span className="min-w-0 flex-1"><strong className="block text-xs font-bold">{label}</strong><small className={`mt-0.5 block text-[10px] font-medium ${active ? 'text-white/75' : 'text-[#7c8d87]'}`}>{description}</small></span><ChevronRight className="h-4 w-4 shrink-0 opacity-60" /></button>;
            })}
          </nav>
        </aside>

        <section className="min-w-0">
          {activeSection === 'account' && (
            <div className="space-y-5">
              <div className="overflow-hidden rounded-[28px] border-2 border-[#b8d0c8] bg-[#fbfdfc] shadow-[0_18px_50px_rgba(60,84,76,0.12)]">
                <div className="flex items-start justify-between gap-5 border-b-2 border-[#b8d0c8] bg-gradient-to-r from-[#e1f0eb] via-[#eef0f3] to-[#f6e8e3] px-6 py-5"><div><span className="inline-flex rounded-full border border-[#9fc1b7] bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#3f7c72]">Tài khoản</span><h2 className="mt-3 text-xl font-bold">Thông tin đăng nhập</h2><p className="mt-1 text-xs font-medium text-[#657a73]">Kiểm tra hồ sơ và các phiên đang hoạt động.</p></div><button type="button" onClick={() => onNavigate('profile')} className="rounded-xl border-2 border-[#76a397] bg-white/75 px-4 py-2 text-xs font-bold text-[#3f6d64] transition hover:bg-white">Chỉnh sửa hồ sơ</button></div>
                <div className="m-6 flex items-center gap-4 rounded-[22px] border-2 border-[#cbded7] bg-[#edf6f2] p-4"><img src={avatar} alt={displayName} className="h-16 w-16 rounded-[20px] border-2 border-white object-cover shadow-sm" referrerPolicy="no-referrer" /><div className="min-w-0"><h3 className="truncate text-base font-bold">{displayName}</h3><p className="mt-1 truncate text-xs text-[#657a73]">{email}</p><span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#a9cfc2] bg-white/75 px-2.5 py-1 text-[9px] font-bold text-[#367265]"><Check className="h-3 w-3" />Tài khoản đang hoạt động</span></div></div>
              </div>

              <div className="overflow-hidden rounded-[28px] border-2 border-[#c8bfd4] bg-[#fbf9fc] shadow-[0_18px_50px_rgba(76,62,84,0.1)]">
                <div className="flex items-center gap-3 border-b-2 border-[#c8bfd4] bg-[#eee8f3] px-6 py-5"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#6f5c7d] shadow-sm"><Laptop className="h-5 w-5" /></span><div><h2 className="text-base font-bold">Thiết bị đăng nhập</h2><p className="text-xs font-medium text-[#746d79]">Các phiên gần đây của tài khoản.</p></div></div>
                <div className="m-6 mb-4 divide-y-2 divide-[#dcd3e3] rounded-[20px] border-2 border-[#d5cce0] bg-white px-4">
                  <div className="flex items-center gap-3 py-4"><Laptop className="h-5 w-5 text-[#527a71]" /><div className="flex-1"><strong className="block text-xs">Chrome trên Windows</strong><small className="text-[10px] text-[#87958f]">Thiết bị hiện tại · Hoạt động ngay bây giờ</small></div><span className="rounded-full bg-[#dff0e9] px-2.5 py-1 text-[9px] font-bold text-[#367265]">Hiện tại</span></div>
                  <div className="flex items-center gap-3 py-4"><Smartphone className="h-5 w-5 text-[#806f8d]" /><div className="flex-1"><strong className="block text-xs">Thiết bị di động</strong><small className="text-[10px] text-[#87958f]">Phiên mẫu · Chờ API phiên đăng nhập</small></div><button type="button" onClick={() => showNotice('Quản lý phiên sẽ hoạt động sau khi kết nối API.')} className="text-[10px] font-bold text-[#a06451]">Đăng xuất</button></div>
                </div>
                <button type="button" onClick={() => setLogoutAllOpen(true)} className="mx-6 mb-6 flex items-center gap-2 rounded-xl border-2 border-[#d4b4ac] bg-[#fff6f3] px-4 py-2.5 text-xs font-extrabold text-[#9c5544] transition hover:bg-[#ffefea]"><LogOut className="h-4 w-4" />Đăng xuất khỏi tất cả thiết bị</button>
              </div>

              <div className="rounded-[28px] border-2 border-[#dfa99e] bg-gradient-to-r from-[#fff3ef] to-[#fbe9e4] p-6 shadow-[0_16px_40px_rgba(150,78,60,0.1)]">
                <div className="flex items-start justify-between gap-6"><div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f9dfda] text-[#b55443]"><Trash2 className="h-5 w-5" /></span><div><h2 className="text-base font-extrabold text-[#8d3e33]">Xóa tài khoản</h2><p className="mt-1 max-w-xl text-xs leading-5 text-[#95675f]">Tài khoản sẽ bị vô hiệu hóa và dữ liệu cá nhân được xử lý theo chính sách của Signify. Hành động này cần xác nhận.</p></div></div><button type="button" onClick={() => setDeleteOpen(true)} className="shrink-0 rounded-xl bg-[#b55443] px-4 py-2.5 text-xs font-extrabold text-white shadow-md shadow-[#b55443]/20 transition hover:bg-[#9f4638]">Xóa tài khoản</button></div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="overflow-hidden rounded-[28px] border-2 border-[#c8bfd4] bg-[#fbf9fc] shadow-[0_18px_50px_rgba(76,62,84,0.12)]"><div className="border-b-2 border-[#c8bfd4] bg-gradient-to-r from-[#eee6f2] to-[#f7e9e5] p-6"><span className="inline-flex rounded-full border border-[#c8bfd4] bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#7d6687]">Thông báo</span><h2 className="mt-3 text-xl font-bold">Bạn muốn được báo khi nào?</h2><p className="mt-1 text-xs text-[#6f7472]">Các lựa chọn hiện được lưu tạm trên giao diện.</p></div><div className="m-6 overflow-hidden rounded-[20px] border-2 border-[#d8cfe1] bg-white"><ToggleRow title="Tin nhắn mới" description="Hiển thị thông báo khi bạn nhận được tin nhắn." checked={messageNotifications} onChange={setMessageNotifications} /><ToggleRow title="Cuộc gọi đến" description="Phát thông báo khi có yêu cầu gọi đến." checked={callNotifications} onChange={setCallNotifications} /><ToggleRow title="Thông báo qua email" description="Nhận cập nhật quan trọng và cảnh báo bảo mật qua email." checked={emailNotifications} onChange={setEmailNotifications} /></div></div>
          )}

          {activeSection === 'privacy' && (
            <div className="space-y-5">
              <div className="overflow-hidden rounded-[28px] border-2 border-[#aacbc0] bg-[#f8fcfa] shadow-[0_18px_50px_rgba(60,84,76,0.12)]">
                <div className="border-b-2 border-[#aacbc0] bg-gradient-to-r from-[#deeee8] to-[#eee8f3] p-6"><span className="inline-flex rounded-full border border-[#9fc1b7] bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#3f7c72]">Quyền riêng tư</span><h2 className="mt-3 text-xl font-bold">Kiểm soát thông tin của bạn</h2><p className="mt-1 text-xs text-[#657a73]">Chọn những trạng thái mà người khác có thể nhìn thấy.</p></div>
                <div className="m-6 overflow-hidden rounded-[20px] border-2 border-[#cbded7] bg-white"><ToggleRow title="Hiển thị trạng thái trực tuyến" description="Cho phép liên hệ biết khi bạn đang hoạt động." checked={onlineStatus} onChange={setOnlineStatus} /><ToggleRow title="Xác nhận đã xem" description="Cho người gửi biết khi bạn đã đọc tin nhắn." checked={readReceipts} onChange={setReadReceipts} /><ToggleRow title="Hiển thị hồ sơ trong tìm kiếm" description="Cho phép người dùng Signify tìm thấy tài khoản của bạn." checked={profileVisibility} onChange={setProfileVisibility} /></div>
                <button type="button" onClick={() => showNotice('Các tùy chọn hiển thị chưa có API lưu cấu hình.')} className="mx-6 mb-6 flex items-center gap-2 rounded-xl border-2 border-[#76a397] bg-white px-4 py-2.5 text-xs font-bold text-[#3f6d64]"><Eye className="h-4 w-4" />Kiểm tra quyền riêng tư</button>
              </div>

              <div className="overflow-hidden rounded-[28px] border-2 border-[#d8b8ae] bg-[#fffaf8] shadow-[0_18px_50px_rgba(112,76,65,0.1)]">
                <div className="flex items-center justify-between gap-4 border-b-2 border-[#d8b8ae] bg-gradient-to-r from-[#fae5df] to-[#eee7f3] px-6 py-5">
                  <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/75 text-[#a65c49] shadow-sm"><UserX className="h-5 w-5" /></span><div><h2 className="text-base font-extrabold">Tài khoản đã chặn</h2><p className="mt-0.5 text-xs text-[#7b6e69]">Những người này không thể gửi tin nhắn mới cho bạn.</p></div></div>
                  <span className="flex h-8 min-w-8 items-center justify-center rounded-full border border-[#ddb8ae] bg-white px-2 text-xs font-extrabold text-[#9f5947]">{blockedUsers.length}</span>
                </div>
                {blockedUsers.length ? <div className="divide-y-2 divide-[#eee1dc] bg-white/70">{blockedUsers.map((blockedUser) => <div key={blockedUser.id} className="flex items-center gap-4 px-6 py-4"><img src={blockedUser.avatar} alt={blockedUser.name} className="h-12 w-12 rounded-2xl border-2 border-white object-cover shadow-sm" referrerPolicy="no-referrer" /><div className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#354741]">{blockedUser.name}</strong><small className="mt-1 block text-[10px] text-[#8a7771]">{blockedUser.blockedAt}</small></div><button type="button" onClick={() => setUnblockTarget(blockedUser)} className="rounded-xl border-2 border-[#d3b5ad] bg-white px-3.5 py-2 text-[10px] font-extrabold text-[#9b5645] transition hover:bg-[#fff0ec]">Bỏ chặn</button></div>)}</div> : <div className="px-6 py-12 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#e5f1ed] text-[#3f7c72]"><ShieldCheck className="h-6 w-6" /></span><h3 className="mt-4 text-sm font-extrabold">Danh sách chặn đang trống</h3><p className="mt-1 text-xs text-[#7d8c87]">Các tài khoản bạn chặn sẽ xuất hiện tại đây.</p></div>}
                <div className="flex items-start gap-3 border-t-2 border-[#ead7d1] bg-[#fdf4f1] px-6 py-4 text-[10px] leading-5 text-[#84665e]"><Ban className="mt-0.5 h-4 w-4 shrink-0 text-[#a65c49]" />Lịch sử trò chuyện cũ vẫn được giữ lại. Sau khi bỏ chặn, hai bên có thể gửi tin nhắn mới.</div>
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="overflow-hidden rounded-[28px] border-2 border-[#d8b8ae] bg-[#fffaf8] shadow-[0_18px_50px_rgba(112,76,65,0.1)]"><div className="border-b-2 border-[#d8b8ae] bg-gradient-to-r from-[#fae5df] to-[#eee7f3] p-6"><span className="inline-flex rounded-full border border-[#d8b8ae] bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#a96652]">Giao diện</span><h2 className="mt-3 text-xl font-bold">Chọn cách Signify hiển thị</h2><p className="mt-1 text-xs text-[#7b6e69]">Giữ phong cách nhẹ nhàng và dễ đọc trên mọi màn hình.</p></div><div className="p-6"><div className="grid gap-4 sm:grid-cols-2"><button type="button" onClick={() => setTheme('light')} className={`rounded-[22px] border-2 p-4 text-left transition ${theme === 'light' ? 'border-[#3f7c72] bg-[#edf6f2]' : 'border-[#d8b8ae] bg-white'}`}><span className="mb-4 block h-28 rounded-[16px] border-2 border-[#c9ddd6] bg-gradient-to-br from-white via-[#edf6f2] to-[#f7e8e2]" /><span className="flex items-center justify-between"><strong className="text-sm font-bold">Sáng dịu</strong>{theme === 'light' && <Check className="h-4 w-4 text-[#3f7c72]" />}</span><small className="mt-1 block text-[10px] text-[#7e8f89]">Bảng màu Signify hiện tại</small></button><button type="button" onClick={() => setTheme('system')} className={`rounded-[22px] border-2 p-4 text-left transition ${theme === 'system' ? 'border-[#3f7c72] bg-[#edf6f2]' : 'border-[#c8bfd4] bg-white'}`}><span className="mb-4 flex h-28 items-center justify-center rounded-[16px] border-2 border-[#d1c7dc] bg-gradient-to-br from-[#f1edf5] to-[#dcece6]"><MoonStar className="h-8 w-8 text-[#746681]" /></span><span className="flex items-center justify-between"><strong className="text-sm font-bold">Theo hệ thống</strong>{theme === 'system' && <Check className="h-4 w-4 text-[#3f7c72]" />}</span><small className="mt-1 block text-[10px] text-[#7e8f89]">Đồng bộ cài đặt thiết bị</small></button></div><div className="mt-5 flex items-center gap-3 rounded-[18px] border-2 border-[#d3c9dc] bg-[#f5f1f7] p-4 text-xs text-[#756b7b]"><Globe2 className="h-4 w-4 shrink-0" />Ngôn ngữ giao diện: Tiếng Việt</div></div></div>
          )}
        </section>
      </div>

      {notice && <div role="status" className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-[#cfe0da] bg-white px-4 py-3 text-xs font-bold text-[#40564f] shadow-[0_18px_45px_rgba(45,72,64,0.18)]"><Check className="h-4 w-4 text-[#3f7c72]" />{notice}<button type="button" onClick={() => setNotice(null)} aria-label="Đóng"><X className="h-4 w-4 text-[#87958f]" /></button></div>}

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18231f]/45 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
          <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-white/70 bg-[#fffaf8] shadow-[0_28px_80px_rgba(55,38,34,0.28)]">
            <div className="flex items-start justify-between border-b border-[#efd7d1] bg-[#fce9e4] p-6"><div className="flex gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#b55443]"><Trash2 className="h-5 w-5" /></span><div><h2 id="delete-account-title" className="text-lg font-extrabold text-[#80382f]">Xác nhận xóa tài khoản</h2><p className="mt-1 text-xs text-[#95675f]">Hãy đọc kỹ trước khi tiếp tục.</p></div></div><button type="button" onClick={closeDeleteModal} aria-label="Đóng" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/75 text-[#8c665f]"><X className="h-4 w-4" /></button></div>
            <div className="space-y-5 p-6"><div className="rounded-[18px] border border-[#efd7d1] bg-white p-4 text-xs leading-6 text-[#735650]"><div className="flex gap-2"><LockKeyhole className="mt-1 h-4 w-4 shrink-0 text-[#b55443]" /><p>Tài khoản sẽ không thể đăng nhập sau khi yêu cầu được xác nhận. Lịch sử và dữ liệu liên quan sẽ được xử lý theo chính sách hệ thống.</p></div></div><label className="flex items-start gap-3 text-xs leading-5 text-[#665852]"><input type="checkbox" checked={deleteAccepted} onChange={(event) => setDeleteAccepted(event.target.checked)} className="mt-1 h-4 w-4 accent-[#b55443]" /><span>Tôi hiểu đây là hành động nghiêm trọng và muốn tiếp tục gửi yêu cầu xóa tài khoản.</span></label><label className="block"><span className="text-xs font-extrabold text-[#5f4d48]">Nhập <strong className="text-[#a9483a]">XÓA TÀI KHOẢN</strong> để xác nhận</span><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="XÓA TÀI KHOẢN" className="mt-2 w-full rounded-2xl border border-[#dfc5bf] bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-[#b55443] focus:ring-4 focus:ring-[#b55443]/10" /></label><div className="flex justify-end gap-3"><button type="button" onClick={closeDeleteModal} className="rounded-xl border border-[#d7c5c0] bg-white px-4 py-2.5 text-xs font-extrabold text-[#6f5d58]">Hủy bỏ</button><button type="button" disabled={!deleteAccepted || confirmation.trim().toUpperCase() !== 'XÓA TÀI KHOẢN'} onClick={confirmDelete} className="rounded-xl bg-[#b55443] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#9f4638] disabled:cursor-not-allowed disabled:opacity-40">Xác nhận xóa</button></div></div>
          </div>
        </div>
      )}

      {unblockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18231f]/45 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="unblock-user-title" onMouseDown={() => setUnblockTarget(null)}>
          <div className="w-full max-w-md overflow-hidden rounded-[28px] border-2 border-[#d8b8ae] bg-[#fffaf8] shadow-[0_28px_80px_rgba(55,38,34,0.28)]" onMouseDown={(event) => event.stopPropagation()}>
            <div className="border-b-2 border-[#ead1ca] bg-gradient-to-r from-[#f9e5df] to-[#eee7f3] p-6"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#a65c49] shadow-sm"><UserRound className="h-5 w-5" /></span><h2 id="unblock-user-title" className="mt-4 text-lg font-extrabold">Bỏ chặn {unblockTarget.name}?</h2><p className="mt-1 text-xs leading-5 text-[#806860]">Người này sẽ có thể bắt đầu hoặc tiếp tục gửi tin nhắn trực tiếp cho bạn.</p></div>
            <div className="flex justify-end gap-3 p-5"><button type="button" onClick={() => setUnblockTarget(null)} className="rounded-xl border-2 border-[#d7c5c0] bg-white px-4 py-2.5 text-xs font-extrabold text-[#6f5d58]">Hủy</button><button type="button" onClick={confirmUnblock} className="rounded-xl bg-[#3f7c72] px-4 py-2.5 text-xs font-extrabold text-white shadow-md">Xác nhận bỏ chặn</button></div>
          </div>
        </div>
      )}

      {logoutAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18231f]/45 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="logout-all-title" onMouseDown={() => setLogoutAllOpen(false)}>
          <div className="w-full max-w-md overflow-hidden rounded-[28px] border-2 border-[#d8b8ae] bg-[#fffaf8] shadow-[0_28px_80px_rgba(55,38,34,0.28)]" onMouseDown={(event) => event.stopPropagation()}>
            <div className="border-b-2 border-[#ead1ca] bg-gradient-to-r from-[#f9e5df] to-[#eee7f3] p-6"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#a65c49] shadow-sm"><LogOut className="h-5 w-5" /></span><h2 id="logout-all-title" className="mt-4 text-lg font-extrabold">Đăng xuất khỏi tất cả thiết bị?</h2><p className="mt-2 text-xs leading-5 text-[#806860]">Tất cả refresh token của tài khoản sẽ bị thu hồi. Bạn cũng cần đăng nhập lại trên thiết bị hiện tại.</p></div>
            <div className="flex justify-end gap-3 p-5"><button type="button" onClick={() => setLogoutAllOpen(false)} className="rounded-xl border-2 border-[#d7c5c0] bg-white px-4 py-2.5 text-xs font-extrabold text-[#6f5d58]">Hủy</button><button type="button" onClick={() => { setLogoutAllOpen(false); showNotice('UI đã sẵn sàng cho POST /api/auth/logout-all.'); }} className="rounded-xl bg-[#ad5847] px-4 py-2.5 text-xs font-extrabold text-white shadow-md">Đăng xuất tất cả</button></div>
          </div>
        </div>
      )}
    </main>
  );
}
