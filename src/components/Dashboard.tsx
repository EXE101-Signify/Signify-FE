import { useState } from 'react';
import {
  Bell,
  Clock,
  Languages,
  Phone,
  Search,
  ShieldAlert,
  Sparkles,
  Users,
  Video,
} from 'lucide-react';

import type { CallLog, Contact, Screen } from '../types';
import AppLayout from '../layouts/AppLayout';

interface DashboardProps {
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  onStartCall: (contact: Contact) => void;
}

const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'Minh Anh',
    role: 'Bạn thân',
    status: 'online',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    lastCall: 'Hôm qua',
  },
  {
    id: '2',
    name: 'Bác sĩ Linh',
    role: 'Bác sĩ gia đình',
    status: 'online',
    avatar:
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150',
    lastCall: '3 ngày trước',
  },
  {
    id: '3',
    name: 'Thầy Hùng',
    role: 'Giáo viên ký hiệu',
    status: 'offline',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    lastCall: 'Tuần trước',
  },
  {
    id: '4',
    name: 'Nam Phong',
    role: 'Đồng nghiệp',
    status: 'online',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    lastCall: '2 giờ trước',
  },
  {
    id: '5',
    name: 'SIGNIFY Support',
    role: 'Hỗ trợ kỹ thuật',
    status: 'online',
    avatar:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
    lastCall: 'Chưa từng',
  },
  {
    id: '6',
    name: 'Lan Hương',
    role: 'Gia đình',
    status: 'offline',
    avatar:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150',
    lastCall: '5 ngày trước',
  },
];

const mockCallLogs: CallLog[] = [
  {
    id: '101',
    contactName: 'Minh Anh',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    duration: '12 phút',
    date: '30/05/2026 - 10:14',
    type: 'incoming',
  },
  {
    id: '102',
    contactName: 'Nam Phong',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    duration: '28 phút',
    date: '30/05/2026 - 08:32',
    type: 'outgoing',
  },
  {
    id: '103',
    contactName: 'Bác sĩ Linh',
    avatar:
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150',
    duration: '0 phút',
    date: '29/05/2026',
    type: 'missed',
  },
];

export default function Dashboard({
  onNavigate,
  onLogout,
  onStartCall,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'contacts' | 'recent'>(
    'contacts',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [aiSignActive, setAiSignActive] = useState(true);
  const [voiceToSignActive, setVoiceToSignActive] = useState(true);
  const [avatar3dActive, setAvatar3dActive] = useState(true);
  const [sosActivated, setSosActivated] = useState(false);

  const currentDate = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const filteredContacts = mockContacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.role.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSosTrigger = () => {
    setSosActivated(true);

    setTimeout(() => {
      const emergencyContact =
        mockContacts.find(
          (contact) => contact.name === 'SIGNIFY Support',
        ) ?? mockContacts[0];

      onStartCall(emergencyContact);
      setSosActivated(false);
    }, 1800);
  };

  const handleContactsMenuClick = () => {
    setActiveTab('contacts');

    document
      .getElementById('contacts-column')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleQuickCall = () => {
    const selectElement = document.getElementById(
      'quick-call-select-recipient',
    ) as HTMLSelectElement | null;

    const selectedContact =
      mockContacts.find(
        (contact) => contact.id === selectElement?.value,
      ) ?? mockContacts[0];

    onStartCall(selectedContact);
  };

  return (
    <AppLayout
      activeScreen="dashboard"
      title={
        <>
          Chào{' '}
          <span className="text-brand-primary">Thanh Liêm</span>,
          chúc ngày tốt lành!
        </>
      }
      subtitle={`Bảng điều khiển SIGNIFY · ${currentDate}`}
      onNavigate={onNavigate}
      onLogout={onLogout}
      onContactsClick={handleContactsMenuClick}
      actions={
        <>
          <button
            id="emergency-sos-action-btn"
            type="button"
            onClick={handleSosTrigger}
            disabled={sosActivated}
            className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold uppercase tracking-wider shadow-md transition-all ${
              sosActivated
                ? 'animate-bounce bg-brand-error text-white'
                : 'cursor-pointer border border-brand-error-light bg-brand-error-light text-brand-error hover:bg-brand-error hover:text-white'
            }`}
          >
            <ShieldAlert
              className={`h-4 w-4 ${
                sosActivated ? 'animate-spin' : ''
              }`}
            />
            {sosActivated
              ? 'ĐANG KẾT NỐI SOS...'
              : 'KHẨN CẤP (SOS)'}
          </button>

          <button
            id="noti-bell-btn"
            type="button"
            className="relative rounded-xl bg-brand-bg p-3 text-brand-text transition-colors hover:bg-brand-border"
            aria-label="Thông báo"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand-primary" />
          </button>
        </>
      }
    >
      <div
        id="dashboard-body"
        className="space-y-8 p-5 sm:p-8"
      >
        {/* Trạng thái AI */}
        <div
          id="ai-status-row"
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-border bg-white p-4 shadow-sm"
        >
          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-primary">
            <Sparkles className="h-4 w-4" />
            Trạng thái AI kết nối
          </span>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  aiSignActive
                    ? 'animate-pulse bg-brand-secondary'
                    : 'bg-brand-border-high'
                }`}
              />
              <span className="text-xs font-bold text-brand-text-muted">
                Nhận diện cử chỉ:{' '}
                {aiSignActive ? 'KÍCH HOẠT' : 'TẮT'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  voiceToSignActive
                    ? 'animate-pulse bg-brand-secondary'
                    : 'bg-brand-border-high'
                }`}
              />
              <span className="text-xs font-bold text-brand-text-muted">
                Giọng nói → Ký hiệu:{' '}
                {voiceToSignActive ? 'SẴN SÀNG' : 'TẮT'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  avatar3dActive
                    ? 'bg-brand-secondary'
                    : 'bg-brand-border-high'
                }`}
              />
              <span className="text-xs font-bold text-brand-text-muted">
                Nhân vật ảo 3D:{' '}
                {avatar3dActive ? 'CHUẨN BỊ' : 'TẮT'}
              </span>
            </div>
          </div>
        </div>

        {/* Thống kê */}
        <section
          id="stats-counter-cards"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4"
        >
          <div className="space-y-4 rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                Cuộc gọi tháng này
              </span>

              <div className="rounded-xl bg-brand-primary-light p-2 text-brand-primary">
                <Phone className="h-4.5 w-4.5" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-black text-brand-text">
                47
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-secondary">
                → +12% so với tháng trước
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                Giờ giao tiếp
              </span>

              <div className="rounded-xl bg-brand-primary-light p-2 text-brand-primary">
                <Clock className="h-4.5 w-4.5" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-black text-brand-text">
                18.5h
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-secondary">
                → Không lỗi kết nối
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                Danh bạ liên kết
              </span>

              <div className="rounded-xl bg-brand-primary-light p-2 text-brand-primary">
                <Users className="h-4.5 w-4.5" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-black text-brand-text">
                24
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-secondary">
                → Thêm 2 liên hệ tuần này
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                Ký hiệu nhận dạng
              </span>

              <div className="rounded-xl bg-brand-primary-light p-2 text-brand-primary">
                <Languages className="h-4.5 w-4.5" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-black text-brand-text">
                1.240
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-secondary">
                → Từ điển học máy hỗ trợ
              </p>
            </div>
          </div>
        </section>

        <div
          id="dashboard-split"
          className="grid items-start gap-8 lg:grid-cols-12"
        >
          {/* Danh bạ */}
          <section
            id="contacts-column"
            className="flex flex-col overflow-hidden rounded-[24px] border border-brand-border bg-white shadow-sm lg:col-span-7"
          >
            <div className="flex flex-col items-center justify-between gap-4 border-b border-brand-border bg-brand-bg/50 p-5 sm:flex-row">
              <div className="flex rounded-xl border border-brand-border bg-brand-bg p-1">
                <button
                  id="contact-tab-all"
                  type="button"
                  onClick={() => setActiveTab('contacts')}
                  className={`cursor-pointer rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                    activeTab === 'contacts'
                      ? 'bg-brand-primary text-white shadow-md'
                      : 'text-brand-text-muted hover:text-brand-primary'
                  }`}
                >
                  Danh bạ ({mockContacts.length})
                </button>

                <button
                  id="contact-tab-recent"
                  type="button"
                  onClick={() => setActiveTab('recent')}
                  className={`cursor-pointer rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                    activeTab === 'recent'
                      ? 'bg-brand-primary text-white shadow-md'
                      : 'text-brand-text-muted hover:text-brand-primary'
                  }`}
                >
                  Gần đây ({mockCallLogs.length})
                </button>
              </div>

              <div className="relative w-full rounded-xl shadow-sm sm:w-48">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-brand-text-muted/70">
                  <Search className="h-3.5 w-3.5" />
                </div>

                <input
                  id="contacts-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  className="block w-full rounded-xl border border-brand-border bg-brand-bg py-2 pl-8 pr-3 text-xs font-bold outline-none transition-all focus:bg-white focus:ring-2 focus:ring-brand-primary"
                  placeholder="Tìm liên hệ..."
                />
              </div>
            </div>

            {activeTab === 'contacts' ? (
              <div className="max-h-[380px] divide-y divide-brand-border overflow-y-auto">
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-brand-bg/30"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={contact.avatar}
                            alt={contact.name}
                            className="h-11 w-11 rounded-full border border-brand-border object-cover"
                            referrerPolicy="no-referrer"
                          />

                          <span
                            className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
                              contact.status === 'online'
                                ? 'bg-brand-secondary'
                                : 'bg-brand-border-high'
                            }`}
                          />
                        </div>

                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-extrabold leading-tight text-brand-text">
                            {contact.name}
                          </h4>

                          <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-brand-text-muted">
                              {contact.role}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-brand-border" />
                            <span className="text-[10px] text-brand-text-muted/65">
                              Gọi gần nhất: {contact.lastCall}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        id={`call-contact-btn-${contact.id}`}
                        type="button"
                        onClick={() => onStartCall(contact)}
                        className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-brand-primary px-3.5 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-primary/10 transition-all hover:bg-brand-primary-hover active:scale-95"
                      >
                        <Video className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">
                          Gọi video
                        </span>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs font-bold text-brand-text-muted">
                    Không tìm thấy liên hệ trùng khớp.
                  </div>
                )}
              </div>
            ) : (
              <div className="max-h-[380px] divide-y divide-brand-border overflow-y-auto">
                {mockCallLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-brand-bg/30"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        src={log.avatar}
                        alt={log.contactName}
                        className="h-10 w-10 shrink-0 rounded-full border border-brand-border object-cover"
                        referrerPolicy="no-referrer"
                      />

                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-extrabold text-brand-text">
                          {log.contactName}
                        </h4>
                        <span className="text-xs text-brand-text-muted">
                          {log.date} • {log.duration}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                        log.type === 'incoming'
                          ? 'bg-brand-secondary-light text-brand-secondary'
                          : log.type === 'outgoing'
                            ? 'bg-brand-bg text-brand-text-muted'
                            : 'bg-brand-error-light text-brand-error'
                      }`}
                    >
                      {log.type === 'incoming'
                        ? 'Gọi nhận'
                        : log.type === 'outgoing'
                          ? 'Gọi đi'
                          : 'Bỏ lỡ'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Gọi nhanh */}
          <section
            id="config-column"
            className="space-y-6 lg:col-span-5"
          >
            <div className="space-y-5 rounded-[24px] border border-brand-border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-brand-border pb-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-brand-text">
                  <Phone className="h-4.5 w-4.5 text-brand-primary" />
                  Bắt đầu cuộc gọi nhanh
                </h3>

                <span className="rounded-full bg-brand-primary-light px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-brand-primary">
                  Pro dịch
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="quick-call-select-recipient"
                    className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-brand-text-muted"
                  >
                    Chọn người nghe
                  </label>

                  <select
                    id="quick-call-select-recipient"
                    defaultValue="1"
                    className="block w-full rounded-xl border border-brand-border bg-brand-bg px-3 py-2.5 text-xs font-bold text-brand-text outline-none transition-all focus:bg-white focus:ring-2 focus:ring-brand-primary"
                  >
                    {mockContacts.map((contact) => (
                      <option
                        key={contact.id}
                        value={contact.id}
                      >
                        {contact.name} ({contact.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={aiSignActive}
                      onChange={(event) =>
                        setAiSignActive(event.target.checked)
                      }
                      className="h-4.5 w-4.5 cursor-pointer rounded border-brand-border-high text-brand-primary focus:ring-brand-primary"
                    />
                    <span className="text-xs font-bold text-brand-text-muted">
                      Kích hoạt nhận diện ký hiệu tay AI
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={voiceToSignActive}
                      onChange={(event) =>
                        setVoiceToSignActive(event.target.checked)
                      }
                      className="h-4.5 w-4.5 cursor-pointer rounded border-brand-border-high text-brand-primary focus:ring-brand-primary"
                    />
                    <span className="text-xs font-bold text-brand-text-muted">
                      Bật loa dịch giọng nói → ký hiệu
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={avatar3dActive}
                      onChange={(event) =>
                        setAvatar3dActive(event.target.checked)
                      }
                      className="h-4.5 w-4.5 cursor-pointer rounded border-brand-border-high text-brand-primary focus:ring-brand-primary"
                    />
                    <span className="text-xs font-bold text-brand-text-muted">
                      Mở người dịch ảo Avatar 3D
                    </span>
                  </label>
                </div>

                <button
                  id="quick-start-call-btn"
                  type="button"
                  onClick={handleQuickCall}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-primary py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-brand-primary/10 transition-all hover:bg-brand-primary-hover"
                >
                  <Video className="h-4 w-4" />
                  Thực hiện cuộc gọi phiên dịch
                </button>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[24px] bg-brand-primary p-6 text-white shadow-md">
              <div className="pointer-events-none absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 opacity-10">
                <Sparkles className="h-40 w-40" />
              </div>

              <div className="space-y-2">
                <div className="mb-1 inline-flex items-center gap-1.5 rounded bg-brand-primary-light px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-brand-primary">
                  Thông tin kỹ thuật
                </div>

                <h4 className="text-base font-extrabold uppercase text-white">
                  Cơ chế dịch thuật Gemini
                </h4>

                <p className="text-xs font-medium leading-relaxed text-white/90">
                  Hệ thống nhận diện và diễn dịch hỗ trợ nhiều cử chỉ
                  ký hiệu, từ vựng giao tiếp và các biến thể ngôn ngữ
                  ký hiệu địa phương.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}