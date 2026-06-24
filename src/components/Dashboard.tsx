import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Phone, Video, ShieldAlert, BadgeCheck, Users, Clock, Languages, Settings, 
  Search, Bell, Plus, Volume2, Sparkles, MessageSquare, BookOpen, AlertTriangle, LogOut, CheckCircle2 
} from 'lucide-react';
import { Contact, Screen, CallLog } from '../types';

interface DashboardProps {
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  onStartCall: (contact: Contact) => void;
}

const mockContacts: Contact[] = [
  { id: '1', name: 'Minh Anh', role: 'Bạn thân', status: 'online', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150', lastCall: 'Hôm qua' },
  { id: '2', name: 'Bác sĩ Linh', role: 'Bác sĩ gia đình', status: 'online', avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150', lastCall: '3 ngày trước' },
  { id: '3', name: 'Thầy Hùng', role: 'Giáo viên ký hiệu', status: 'offline', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150', lastCall: 'Tuần trước' },
  { id: '4', name: 'Nam Phong', role: 'Đồng nghiệp', status: 'online', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150', lastCall: '2 giờ trước' },
  { id: '5', name: 'SignBridge Support', role: 'Hỗ trợ kỹ thuật', status: 'online', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150', lastCall: 'Chưa từng' },
  { id: '6', name: 'Lan Hương', role: 'Gia đình', status: 'offline', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150', lastCall: '5 ngày trước' },
];

const mockCallLogs: CallLog[] = [
  { id: '101', contactName: 'Minh Anh', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150', duration: '12 phút', date: '30/05/2026 - 10:14', type: 'incoming' },
  { id: '102', contactName: 'Nam Phong', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150', duration: '28 phút', date: '30/05/2026 - 08:32', type: 'outgoing' },
  { id: '103', contactName: 'Bác sĩ Linh', avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150', duration: '0 phút', date: '29/05/2026', type: 'missed' },
];

export default function Dashboard({ onNavigate, onLogout, onStartCall }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'contacts' | 'recent' | 'groups'>('contacts');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiSignActive, setAiSignActive] = useState(true);
  const [voiceToSignActive, setVoiceToSignActive] = useState(true);
  const [avatar3dActive, setAvatar3dActive] = useState(true);
  const [sosActivated, setSosActivated] = useState(false);

  const filteredContacts = mockContacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSosTrigger = () => {
    setSosActivated(true);
    setTimeout(() => {
      // Find emergency contact or use support
      const emergencyContact = mockContacts.find(c => c.name === 'SignBridge Support') || mockContacts[0];
      onStartCall(emergencyContact);
      setSosActivated(false);
    }, 1800);
  };

  return (
    <div id="dashboard-root" className="min-h-screen bg-brand-bg flex font-sans text-brand-text bg-dot-grid">
      
      {/* 1. Left Sidebar */}
      <aside id="dashboard-sidebar" className="w-66 bg-white border-r border-brand-border flex flex-col justify-between shrink-0 p-5 rounded-r-[24px] shadow-sm">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-brand-primary/10">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-sans font-black text-xl text-brand-primary block tracking-tight">SignBridge</span>
              <span className="text-[9px] text-brand-text-muted font-bold tracking-widest uppercase block mt-0.5">AI INTERPRETER</span>
            </div>
          </div>

          {/* Sidebar Menu */}
          <nav className="space-y-1.5">
            <button 
              id="sidebar-menu-dashboard"
              onClick={() => onNavigate('dashboard')}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl bg-brand-primary text-white font-bold text-xs uppercase tracking-wider transition-all text-left shadow-md shadow-brand-primary/15"
            >
              <Volume2 className="w-4 h-4" />
              Tổng quan
            </button>
            <button 
              id="sidebar-menu-languages"
              onClick={() => onNavigate('languages')}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-brand-text-muted hover:text-brand-primary hover:bg-brand-primary-light/40 font-bold text-xs uppercase tracking-wider transition-all text-left"
            >
              <Languages className="w-4 h-4" />
              Gói Ngôn ngữ
            </button>
            <button 
              id="sidebar-menu-contacts"
              onClick={() => setActiveTab('contacts')}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-brand-text-muted hover:text-brand-primary hover:bg-brand-primary-light/40 font-bold text-xs uppercase tracking-wider transition-all text-left"
            >
              <Users className="w-4 h-4" />
              Danh bạ liên kết
            </button>
            <a 
              href="#pricing"
              onClick={(e) => { e.preventDefault(); onNavigate('landing'); }}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-brand-text-muted hover:text-brand-primary hover:bg-brand-primary-light/40 font-bold text-xs uppercase tracking-wider transition-all text-left"
            >
              <BookOpen className="w-4 h-4" />
              Bảng giá & Gói cước
            </a>
          </nav>
        </div>

        {/* User Card */}
        <div id="sidebar-user-card" className="bg-brand-bg border border-brand-border p-4 rounded-2xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150" 
                alt="User Profile Pic" 
                className="w-9 h-9 rounded-full object-cover border border-brand-border-high"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-brand-secondary border-2 border-white rounded-full"></span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-brand-text truncate">Thanh Liêm</div>
              <span className="inline-flex items-center gap-1 text-[8px] bg-brand-secondary text-white px-2 py-0.5 rounded font-extrabold tracking-widest uppercase mt-1">
                <BadgeCheck className="w-2.5 h-2.5" />
                Pro
              </span>
            </div>
          </div>
          <button 
            id="sidebar-logout-btn"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-700 hover:text-white hover:bg-rose-600 rounded-xl border border-rose-100 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* 2. Main Content Canvas */}
      <main id="dashboard-main-content" className="flex-1 flex flex-col min-w-0">
        
        {/* Header toolbar */}
        <header id="dashboard-header" className="bg-white border-b border-brand-border px-8 py-5 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-brand-text leading-tight uppercase">
              Chào <span className="text-brand-primary">Thanh Liêm</span>, chúc ngày tốt lành!
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-brand-text-muted font-bold">Bảng điều khiển ➔ Thứ Bảy, ngày 30 tháng 5, 2026</p>
          </div>
          <div className="flex items-center gap-3">
            
            {/* Quick SOS Emergency Action */}
            <button 
              id="emergency-sos-action-btn"
              onClick={handleSosTrigger}
              disabled={sosActivated}
              className={`px-5 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all shadow-md ${
                sosActivated 
                ? 'bg-brand-error animate-bounce text-white' 
                : 'bg-brand-error-light hover:bg-brand-error hover:text-white text-brand-error border border-brand-error-light cursor-pointer'
              }`}
            >
              <ShieldAlert className={`w-4 h-4 ${sosActivated ? 'animate-spin' : ''}`} />
              {sosActivated ? 'ĐANG KẾT NỐI SOS...' : 'KHẨN CẤP (SOS)'}
            </button>

            {/* Notification triggers */}
            <div className="relative">
              <button id="noti-bell-btn" className="p-3 bg-brand-bg hover:bg-brand-border text-brand-text rounded-xl transition-colors relative cursor-pointer">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand-primary rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Inner Scroll Container */}
        <div id="dashboard-body" className="p-8 space-y-8 overflow-y-auto flex-1">
          
          {/* Quick AI status strip banner */}
          <div id="ai-status-row" className="bg-white border border-brand-border p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
            <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> TRẠNG THÁI AI KẾT NỐI
            </span>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${aiSignActive ? 'bg-brand-secondary animate-pulse' : 'bg-brand-border-high'}`}></div>
                <span className="text-xs font-bold text-brand-text-muted">Nhận diện cử chỉ: {aiSignActive ? 'KÍCH HOẠT' : 'TẮT'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${voiceToSignActive ? 'bg-brand-secondary animate-pulse' : 'bg-brand-border-high'}`}></div>
                <span className="text-xs font-bold text-brand-text-muted">Giọng nói {"➔"} Ký hiệu: {voiceToSignActive ? 'SẴN SÀNG' : 'TẮT'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${avatar3dActive ? 'bg-brand-secondary' : 'bg-brand-border-high'}`}></div>
                <span className="text-xs font-bold text-brand-text-muted">Nhân vật ảo 3D: {avatar3dActive ? 'CHUẨN BỊ' : 'TẮT'}</span>
              </div>
            </div>
          </div>

          {/* Stats count panel cards */}
          <section id="stats-counter-cards" className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-brand-border p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">Cuộc gọi tháng này</span>
                <div className="p-2 bg-brand-primary-light text-brand-primary rounded-xl">
                  <Phone className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-brand-text">47</div>
                <p className="text-[10px] text-brand-secondary font-bold uppercase tracking-wider">➔ +12% so với tháng trước</p>
              </div>
            </div>

            <div className="bg-white border border-brand-border p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">Giờ giao tiếp (h)</span>
                <div className="p-2 bg-brand-primary-light text-brand-primary rounded-xl">
                  <Clock className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-brand-text">18.5h</div>
                <p className="text-[10px] text-brand-secondary font-bold uppercase tracking-wider">➔ Không lỗi kết nối</p>
              </div>
            </div>

            <div className="bg-white border border-brand-border p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">Danh bạ liên kết</span>
                <div className="p-2 bg-brand-primary-light text-brand-primary rounded-xl">
                  <Users className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-brand-text">24</div>
                <p className="text-[10px] text-brand-secondary font-bold uppercase tracking-wider">➔ Thêm 2 liên hệ tuần này</p>
              </div>
            </div>

            <div className="bg-white border border-brand-border p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">Ký hiệu nhận dạng</span>
                <div className="p-2 bg-brand-primary-light text-brand-primary rounded-xl">
                  <Languages className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-brand-text">1.240</div>
                <p className="text-[10px] text-brand-secondary font-bold uppercase tracking-wider">➔ Từ điển nâng học máy hỗ trợ</p>
              </div>
            </div>
          </section>

          {/* Split grid area: Contacts List (Left) & Quick Connect / Configuration (Right) */}
          <div id="dashboard-split" className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Left side: Tab contacts content */}
            <section id="contacts-column" className="lg:col-span-7 bg-white border border-brand-border rounded-[24px] shadow-sm overflow-hidden flex flex-col">
              {/* Header Tab panel */}
              <div className="border-b border-brand-border p-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-brand-bg/50">
                <div className="flex bg-brand-bg p-1 rounded-xl border border-brand-border">
                  <button 
                    id="contact-tab-all"
                    onClick={() => setActiveTab('contacts')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'contacts' ? 'bg-brand-primary text-white shadow-md' : 'text-brand-text-muted hover:text-brand-primary'}`}
                  >
                    Danh bạ ({mockContacts.length})
                  </button>
                  <button 
                    id="contact-tab-recent"
                    onClick={() => setActiveTab('recent')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'recent' ? 'bg-brand-primary text-white shadow-md' : 'text-brand-text-muted hover:text-brand-primary'}`}
                  >
                    Gần đây ({mockCallLogs.length})
                  </button>
                </div>
                <div className="relative w-full sm:w-48 rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-text-muted/70">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    id="contacts-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-8 pr-3 py-2 bg-brand-bg border border-brand-border rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                    placeholder="Tìm liên hệ..."
                  />
                </div>
              </div>

              {/* Contacts Tab Content */}
              {activeTab === 'contacts' ? (
                <div className="divide-y divide-brand-border max-h-[380px] overflow-y-auto">
                  {filteredContacts.length > 0 ? (
                    filteredContacts.map(contact => (
                      <div 
                        key={contact.id} 
                        className="p-4 hover:bg-brand-bg/30 transition-colors flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img 
                              src={contact.avatar || "placeholder"} 
                              alt={contact.name} 
                              className="w-11 h-11 rounded-full object-cover border border-brand-border"
                              referrerPolicy="no-referrer"
                            />
                            <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white rounded-full ${contact.status === 'online' ? 'bg-brand-secondary' : 'bg-brand-border-high'}`}></span>
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-brand-text leading-tight">{contact.name}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-brand-text-muted font-bold">{contact.role}</span>
                              <span className="w-1 h-1 bg-brand-border rounded-full"></span>
                              <span className="text-[10px] text-brand-text-muted/65">Gọi gần nhất: {contact.lastCall}</span>
                            </div>
                          </div>
                        </div>

                        {/* Dial interaction */}
                        <div className="flex items-center gap-2">
                          <button 
                            id={`call-contact-btn-${contact.id}`}
                            onClick={() => onStartCall(contact)}
                            className="p-2 bg-brand-primary hover:bg-brand-primary-hover active:scale-95 text-white rounded-xl transition-all shadow-md shadow-brand-primary/10 flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold cursor-pointer"
                          >
                            <Video className="w-3.5 h-3.5" />
                            GỌI VIDEO
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-brand-text-muted text-xs font-bold">
                      Không tìm thấy liên hệ trùng khớp.
                    </div>
                  )}
                </div>
              ) : (
                /* Recent Tab Logs */
                <div className="divide-y divide-brand-border max-h-[380px] overflow-y-auto">
                  {mockCallLogs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-brand-bg/30 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={log.avatar} 
                          alt={log.contactName} 
                          className="w-10 h-10 rounded-full object-cover border border-brand-border"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="font-extrabold text-sm text-brand-text">{log.contactName}</h4>
                          <span className="text-xs text-brand-text-muted font-mono">{log.date} • {log.duration}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2.5 py-1.5 rounded-full font-bold uppercase tracking-wider ${
                        log.type === 'incoming' ? 'bg-brand-secondary-light text-brand-secondary' :
                        log.type === 'outgoing' ? 'bg-brand-bg text-brand-text-muted' :
                        'bg-brand-error-light text-brand-error'
                      }`}>
                        {log.type === 'incoming' ? 'Gọi nhận' : log.type === 'outgoing' ? 'Gọi đi' : 'Bỏ lỡ'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Right side: Quick connect & toggle AI adjustments */}
            <section id="config-column" className="lg:col-span-5 space-y-6">
              
              {/* Quick Call Panel context */}
              <div className="bg-white border border-brand-border rounded-[24px] p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-brand-border pb-3">
                  <h3 className="font-bold text-sm text-brand-text flex items-center gap-2">
                    <Phone className="w-4.5 h-4.5 text-brand-primary" />
                    Bắt đầu Cuộc gọi Nhanh
                  </h3>
                  <span className="text-[9px] bg-brand-primary-light text-brand-primary px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wider">PRO DỊCH</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Chọn người nghe</label>
                    <select 
                      id="quick-call-select-recipient"
                      defaultValue="1"
                      className="block w-full py-2.5 px-3 bg-brand-bg border border-brand-border rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-brand-primary outline-none transition-all text-brand-text"
                    >
                      {mockContacts.map(c => (
                        <option key={c.id} value={c.id} className="text-brand-text">{c.name} ({c.role})</option>
                      ))}
                    </select>
                  </div>

                  {/* Options checkbox */}
                  <div className="space-y-3 pt-2">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={aiSignActive}
                        onChange={(e) => setAiSignActive(e.target.checked)}
                        className="h-4.5 w-4.5 text-brand-primary focus:ring-brand-primary border-brand-border-high rounded cursor-pointer"
                      />
                      <span className="text-xs text-brand-text-muted font-bold">Kích hoạt Nhận diện ký hiệu tay AI</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={voiceToSignActive}
                        onChange={(e) => setVoiceToSignActive(e.target.checked)}
                        className="h-4.5 w-4.5 text-brand-primary focus:ring-brand-primary border-brand-border-high rounded cursor-pointer"
                      />
                      <span className="text-xs text-brand-text-muted font-bold">Bật loa dịch Giọng nói {"➔"} Ký hiệu</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={avatar3dActive}
                        onChange={(e) => setAvatar3dActive(e.target.checked)}
                        className="h-4.5 w-4.5 text-brand-primary focus:ring-brand-primary border-brand-border-high rounded cursor-pointer"
                      />
                      <span className="text-xs text-brand-text-muted font-bold">Mở hình người dịch ảo Avatar 3D</span>
                    </label>
                  </div>

                  <button
                    id="quick-start-call-btn"
                    onClick={() => {
                      const selId = (document.getElementById('quick-call-select-recipient') as HTMLSelectElement)?.value || '1';
                      const selected = mockContacts.find(c => c.id === selId) || mockContacts[0];
                      onStartCall(selected);
                    }}
                    className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-xl text-xs tracking-wider uppercase transition-all shadow-md shadow-brand-primary/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Video className="w-4 h-4" />
                    Thực hiện cuộc gọi phiên dịch
                  </button>
                </div>
              </div>

              {/* Technical Notice Banner */}
              <div className="bg-brand-primary text-white rounded-[24px] p-6 shadow-md relative overflow-hidden">
                <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 opacity-10 pointer-events-none">
                  <Sparkles className="w-40 h-40" />
                </div>
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 bg-brand-primary-light text-brand-primary text-[9px] px-2.5 py-1 rounded font-bold tracking-widest uppercase mb-1">
                    Thông tin kĩ thuật
                  </div>
                  <h4 className="font-extrabold text-white text-base uppercase">Cơ chế dịch thuật Gemini 2.0</h4>
                  <p className="text-xs text-white/90 leading-relaxed font-medium">
                    Hệ thống nhận diện và diễn dịch có khả năng phân biệt hơn 5.000 cử chỉ ký hiệu, hỗ trợ đặc biệt cả các từ lóng địa phương nhờ bộ nhớ AI đệm biên thế hệ mới.
                  </p>
                </div>
              </div>

            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
