import { useMemo, useState, type ComponentType } from 'react';
import {
  ArrowLeft,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  ChevronRight,
  Crown,
  MessageCircleMore,
  PhoneMissed,
  Settings,
  Sparkles,
} from 'lucide-react';
import type { Screen } from '../../types';

type NotificationType =
  | 'DIRECT_MESSAGE'
  | 'MISSED_CALL'
  | 'SUBSCRIPTION_EXPIRING'
  | 'SUBSCRIPTION_EXPIRED';

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  time: string;
  group: 'Hôm nay' | 'Trước đó';
  read: boolean;
}

interface NotificationsPageProps {
  onNavigate: (screen: Screen) => void;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notification-1',
    type: 'DIRECT_MESSAGE',
    title: 'Minh Anh đã gửi tin nhắn',
    content: 'Chiều nay mình gọi video nhé!',
    time: '10:24',
    group: 'Hôm nay',
    read: false,
  },
  {
    id: 'notification-2',
    type: 'MISSED_CALL',
    title: 'Bạn có một cuộc gọi nhỡ',
    content: 'Bác sĩ Linh đã gọi cho bạn lúc 09:05.',
    time: '09:05',
    group: 'Hôm nay',
    read: false,
  },
  {
    id: 'notification-3',
    type: 'SUBSCRIPTION_EXPIRING',
    title: 'Gói Signify Pro sắp hết hạn',
    content: 'Gói của bạn còn 5 ngày. Kiểm tra thông tin để không bị gián đoạn.',
    time: '08:30',
    group: 'Hôm nay',
    read: false,
  },
  {
    id: 'notification-4',
    type: 'DIRECT_MESSAGE',
    title: 'Thầy Hùng đã gửi tin nhắn',
    content: 'Bài tập tuần này nằm trong file nhé.',
    time: 'Hôm qua, 20:36',
    group: 'Trước đó',
    read: true,
  },
  {
    id: 'notification-5',
    type: 'SUBSCRIPTION_EXPIRED',
    title: 'Gói dùng thử đã kết thúc',
    content: 'Một số tính năng nâng cao đã tạm dừng. Bạn vẫn có thể tiếp tục nhắn tin.',
    time: '03/10',
    group: 'Trước đó',
    read: true,
  },
];

const TYPE_STYLES: Record<NotificationType, {
  icon: ComponentType<{ className?: string }>;
  iconClass: string;
  label: string;
  action: string;
}> = {
  DIRECT_MESSAGE: {
    icon: MessageCircleMore,
    iconClass: 'border-[#a9cfc2] bg-[#e1f0eb] text-[#377366]',
    label: 'Tin nhắn',
    action: 'Mở trò chuyện',
  },
  MISSED_CALL: {
    icon: PhoneMissed,
    iconClass: 'border-[#e4bdb2] bg-[#fae7e1] text-[#a75c48]',
    label: 'Cuộc gọi nhỡ',
    action: 'Nhắn lại',
  },
  SUBSCRIPTION_EXPIRING: {
    icon: Crown,
    iconClass: 'border-[#cdbed8] bg-[#eee8f3] text-[#745e82]',
    label: 'Gói dịch vụ',
    action: 'Xem chi tiết',
  },
  SUBSCRIPTION_EXPIRED: {
    icon: BellRing,
    iconClass: 'border-[#e6c6a5] bg-[#fbeddc] text-[#9a6a38]',
    label: 'Gói đã hết hạn',
    action: 'Xem lựa chọn',
  },
};

export default function NotificationsPage({ onNavigate }: NotificationsPageProps) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const unreadCount = notifications.filter((item) => !item.read).length;
  const visibleNotifications = useMemo(
    () => unreadOnly ? notifications.filter((item) => !item.read) : notifications,
    [notifications, unreadOnly],
  );

  const markRead = (id: string) => {
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
  };

  const markAllRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    setNotice('Đã đánh dấu tất cả thông báo là đã đọc.');
    window.setTimeout(() => setNotice(null), 2800);
  };

  const openNotification = (item: NotificationItem) => {
    markRead(item.id);
    if (item.type === 'DIRECT_MESSAGE' || item.type === 'MISSED_CALL') onNavigate('dashboard');
    else onNavigate('settings');
  };

  return (
    <main className="auth-dot-surface min-h-screen bg-gradient-to-br from-[#edf5f1] via-[#f6f2f8] to-[#fae9e3] text-[#263934]">
      <header className="sticky top-0 z-30 border-b-2 border-[#b8d0c8] bg-[#eef5f2]/90 shadow-[0_8px_30px_rgba(55,80,72,0.08)] backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <button type="button" onClick={() => onNavigate('dashboard')} aria-label="Quay lại tin nhắn" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-2 border-[#b4cdc5] bg-white/75 text-[#45675f] transition hover:-translate-x-0.5 hover:bg-white"><ArrowLeft className="h-5 w-5" /></button>
            <img src="/signify-logo-transparent.png" alt="Signify" className="hidden h-8 w-auto object-contain sm:block" />
            <span className="hidden h-8 w-px bg-[#bfd2cc] sm:block" />
            <div className="min-w-0"><h1 className="truncate text-lg font-extrabold">Thông báo</h1><p className="truncate text-[11px] font-medium text-[#657a73]">Những cập nhật quan trọng dành cho bạn</p></div>
          </div>
          <button type="button" onClick={() => onNavigate('settings')} className="flex h-10 items-center gap-2 rounded-xl border-2 border-[#b4cdc5] bg-white/70 px-3 text-xs font-bold text-[#45675f] transition hover:bg-white"><Settings className="h-4 w-4" /><span className="hidden sm:inline">Cài đặt</span></button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <section className="relative overflow-hidden rounded-[30px] border-2 border-[#a9c9bf] bg-gradient-to-r from-[#dcece7] via-[#eee9f3] to-[#f8e3dc] p-6 shadow-[0_22px_60px_rgba(60,84,76,0.13)] sm:p-8">
          <span className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full border-[30px] border-white/25" />
          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border-2 border-white/70 bg-white/75 text-[#3f7c72] shadow-lg"><Bell className="h-7 w-7" />{unreadCount > 0 && <i className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-[#c5745b] px-1 text-[10px] font-extrabold not-italic text-white">{unreadCount}</i>}</span>
              <div><span className="inline-flex rounded-full border border-[#9fc1b7] bg-white/65 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#3f7c72]">Trung tâm cập nhật</span><h2 className="mt-3 text-2xl font-extrabold tracking-[-0.025em]">{unreadCount ? `Bạn có ${unreadCount} thông báo mới` : 'Bạn đã xem hết thông báo'}</h2><p className="mt-1 text-xs font-medium text-[#657a73]">Tin nhắn, cuộc gọi và trạng thái dịch vụ được gom tại đây.</p></div>
            </div>
            <button type="button" disabled={!unreadCount} onClick={markAllRead} className="flex shrink-0 items-center justify-center gap-2 rounded-2xl border-2 border-[#6f9d91] bg-white/75 px-5 py-3 text-xs font-extrabold text-[#3f6d64] shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"><CheckCheck className="h-4 w-4" />Đánh dấu tất cả đã đọc</button>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[28px] border-2 border-[#c5d8d2] bg-white/80 shadow-[0_18px_50px_rgba(60,84,76,0.1)] backdrop-blur">
          <div className="flex flex-col gap-4 border-b-2 border-[#d2e0db] bg-[#f3f8f6] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex gap-2 text-xs font-bold">
              <button type="button" onClick={() => setUnreadOnly(false)} className={`rounded-full border-2 px-4 py-2 transition ${!unreadOnly ? 'border-[#3f7c72] bg-[#3f7c72] text-white shadow-md shadow-[#3f7c72]/20' : 'border-[#8bb0a6] bg-white text-[#45675f] hover:bg-[#edf6f2]'}`}>Tất cả <span className="ml-1 opacity-75">{notifications.length}</span></button>
              <button type="button" onClick={() => setUnreadOnly(true)} className={`rounded-full border-2 px-4 py-2 transition ${unreadOnly ? 'border-[#3f7c72] bg-[#3f7c72] text-white shadow-md shadow-[#3f7c72]/20' : 'border-[#8bb0a6] bg-white text-[#45675f] hover:bg-[#edf6f2]'}`}>Chưa đọc <span className="ml-1 opacity-75">{unreadCount}</span></button>
            </div>
            <span className="flex items-center gap-2 text-[10px] font-bold text-[#74857f]"><Sparkles className="h-3.5 w-3.5 text-[#9a758f]" />Cập nhật gần nhất vừa xong</span>
          </div>

          {visibleNotifications.length ? (
            <div>
              {(['Hôm nay', 'Trước đó'] as const).map((group) => {
                const items = visibleNotifications.filter((item) => item.group === group);
                if (!items.length) return null;
                return <div key={group} className="border-b-2 border-[#e0e9e6] last:border-b-0"><div className="bg-[#fafcfb] px-6 py-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#71827c]">{group}</div><div className="divide-y-2 divide-[#e3ebe8]">{items.map((item) => {
                  const style = TYPE_STYLES[item.type];
                  const Icon = style.icon;
                  return <article key={item.id} className={`relative flex gap-4 px-5 py-5 transition hover:bg-[#f8fbfa] sm:px-6 ${item.read ? 'bg-white/55' : 'bg-[#edf6f2]/75'}`}>
                    {!item.read && <span className="absolute inset-y-3 left-0 w-1.5 rounded-r-full bg-[#c5745b]" />}
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[17px] border-2 ${style.iconClass}`}><Icon className="h-5 w-5" /></span>
                    <button type="button" onClick={() => openNotification(item)} className="min-w-0 flex-1 text-left"><span className="flex flex-wrap items-center gap-2"><strong className="text-sm font-extrabold text-[#263934]">{item.title}</strong><small className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${style.iconClass}`}>{style.label}</small></span><p className="mt-1.5 text-xs leading-5 text-[#687a74]">{item.content}</p><span className="mt-2 block text-[10px] font-semibold text-[#8b9994]">{item.time}</span></button>
                    <div className="flex shrink-0 flex-col items-end justify-between gap-2"><button type="button" onClick={() => openNotification(item)} className="hidden items-center gap-1 rounded-xl border border-[#c9d9d4] bg-white px-3 py-2 text-[10px] font-bold text-[#477168] transition hover:border-[#78a498] sm:flex">{style.action}<ChevronRight className="h-3 w-3" /></button>{item.read ? <span className="flex items-center gap-1 text-[9px] font-bold text-[#789087]"><Check className="h-3 w-3" />Đã đọc</span> : <button type="button" onClick={() => markRead(item.id)} className="rounded-full border border-[#78a498] bg-white px-2.5 py-1 text-[9px] font-bold text-[#3f7469]">Đánh dấu đã đọc</button>}</div>
                  </article>;
                })}</div></div>;
              })}
            </div>
          ) : (
            <div className="px-6 py-20 text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border-2 border-[#bdd4cc] bg-[#e5f1ed] text-[#3f7c72]"><CheckCheck className="h-7 w-7" /></span><h3 className="mt-5 text-base font-extrabold">Không còn thông báo chưa đọc</h3><p className="mt-2 text-xs text-[#7a8a84]">Bạn đã xử lý tất cả cập nhật mới.</p><button type="button" onClick={() => setUnreadOnly(false)} className="mt-5 rounded-xl border-2 border-[#79a69a] bg-white px-4 py-2.5 text-xs font-bold text-[#3f6d64]">Xem tất cả thông báo</button></div>
          )}
        </section>

        <p className="mt-5 text-center text-[10px] font-medium text-[#7f8f89]">Thông báo đang được mô phỏng theo dữ liệu API backend, chưa kết nối dữ liệu thật.</p>
      </div>

      {notice && <div role="status" className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border-2 border-[#b9d2ca] bg-white px-4 py-3 text-xs font-bold text-[#40564f] shadow-[0_18px_45px_rgba(45,72,64,0.18)]"><Check className="h-4 w-4 text-[#3f7c72]" />{notice}</div>}
    </main>
  );
}
