import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Video, Languages, HelpCircle, Check, Play, UserCheck, Accessibility } from 'lucide-react';
import { Screen } from '../types';

interface LandingPageProps {
  onNavigate: (screen: Screen) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div id="landing-page-root" className="min-h-screen bg-brand-bg text-brand-text font-sans bg-dot-grid">
      {/* Navigation Header */}
      <header id="landing-header" className="sticky top-0 z-50 glass-panel border-b border-brand-border px-6 py-4 flex items-center justify-between max-w-7xl mx-auto rounded-b-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-sm shadow-brand-primary/10">
            <Accessibility className="w-5 h-5" />
          </div>
          <span className="font-sans font-extrabold text-2xl text-brand-primary tracking-tight">SignBridge</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-brand-text-muted">
          <a href="#features" className="hover:text-brand-primary transition-colors">Tính năng</a>
          <a href="#pricing" className="hover:text-brand-primary transition-colors">Bảng giá</a>
        </nav>
        <div className="flex items-center gap-3">
          <button 
            id="nav-login-btn"
            onClick={() => onNavigate('login')} 
            className="text-xs font-bold uppercase tracking-wider px-4 py-2 text-brand-text hover:text-brand-primary transition-colors"
          >
            Đăng nhập
          </button>
          <button 
            id="nav-register-btn"
            onClick={() => onNavigate('dashboard')} 
            className="text-xs font-bold uppercase tracking-widest px-5 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl transition-all shadow-md shadow-brand-primary/10 cursor-pointer"
          >
            Sử dụng ngay
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero-section" className="px-6 pt-16 pb-20 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-brand-primary-light/50 border border-brand-primary-light text-brand-primary px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide">
            <span className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></span>
            Đột phá Công nghệ Hỗ trợ Cộng đồng Khiếm thính
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-brand-text leading-tight uppercase">
            Xóa bỏ rào cản <br />
            <span className="text-brand-primary">Kết nối yêu thương</span>
          </h1>
          <p className="text-brand-text-muted text-base max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
            Hệ thống dịch thuật cuộc gọi video bằng Trí tuệ Nhân tạo thế hệ mới. Chuyển đổi ngôn ngữ ký hiệu Việt Nam (VSL) thành văn bản, giọng nói trực tiếp và ngược lại thông qua hình đại diện 3D hỗ trợ đắc lực.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <button 
              id="hero-start-btn"
              onClick={() => onNavigate('dashboard')}
              className="w-full sm:w-auto px-8 py-4 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/15 transition-all group cursor-pointer"
            >
              Trải nghiệm Miễn phí 
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <a 
              href="#pricing"
              className="w-full sm:w-auto px-8 py-4 bg-white border border-brand-border hover:bg-brand-bg text-brand-text text-xs font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all text-center"
            >
              Xem bảng giá dịch vụ
            </a>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-brand-border max-w-md mx-auto lg:mx-0">
            <div>
              <div className="text-3xl font-black text-brand-primary">98%</div>
              <span className="text-[10px] uppercase tracking-wider text-brand-text-muted font-bold">Nhận diện chính xác</span>
            </div>
            <div>
              <div className="text-3xl font-black text-brand-primary">30ms</div>
              <span className="text-[10px] uppercase tracking-wider text-brand-text-muted font-bold">Độ trễ tối thiểu</span>
            </div>
            <div>
              <div className="text-3xl font-black text-brand-primary">10k+</div>
              <span className="text-[10px] uppercase tracking-wider text-brand-text-muted font-bold">Cuộc gọi kết nối</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive Mockup */}
        <div className="flex-1 w-full relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary-light to-brand-border rounded-[32px] -rotate-1 blur-xl opacity-50"></div>
          <div className="relative bg-white border border-brand-border rounded-[32px] p-5 shadow-lg">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between pb-4 border-b border-brand-border mb-4 px-2">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-brand-border-high rounded-full"></span>
                <span className="w-3 h-3 bg-brand-border-high rounded-full"></span>
                <span className="w-3 h-3 bg-brand-primary-light rounded-full"></span>
              </div>
              <div className="text-[10px] bg-brand-secondary-light text-brand-secondary px-3.5 py-1.5 rounded-full font-bold tracking-wide uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 bg-brand-secondary rounded-full animate-ping"></span>
                AI Đang Nhận Diện Thời Gian Thực
              </div>
            </div>

            {/* Simulated Live Call Video Frame */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-950 flex items-center justify-center group shadow-inner">
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=640" 
                alt="Live Video Signer Demo" 
                className="absolute inset-0 w-full h-full object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
              
              {/* Floating Mesh Mapping Points Overlay */}
              <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
                <div>
                  <span className="bg-brand-text/95 text-white text-[9px] uppercase font-mono tracking-widest px-2.5 py-1 rounded-lg border border-brand-border/15 shadow">
                    Hand Keypoints: ACTIVE
                  </span>
                </div>
                {/* Live Subtitle Overlay */}
                <div className="bg-brand-primary text-white font-bold text-center text-xs py-3 px-4 rounded-xl shadow-lg border border-brand-primary-light/20 backdrop-blur-sm mx-auto max-w-sm leading-relaxed">
                  "Chào bạn, tôi có thể hỗ trợ gì cho bạn hôm nay?"
                </div>
              </div>
            </div>

            {/* Bottom mini bar */}
            <div className="pt-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-bg flex items-center justify-center text-brand-primary">
                  <Video className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-brand-text">Minh Nguyễn</div>
                  <div className="text-[10px] text-brand-text-muted font-medium">Giao tiếp qua ngôn ngữ ký hiệu</div>
                </div>
              </div>
              <button 
                id="landing-try-call"
                onClick={() => onNavigate('dashboard')} 
                className="px-4 py-2.5 bg-brand-bg hover:bg-brand-border text-brand-primary text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                Giao tiếp thử
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="bg-brand-surface-container py-20 px-6 border-y border-brand-border">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-black tracking-tight text-brand-text sm:text-4xl uppercase">
              Tính năng đột phá <span className="text-brand-primary">hỗ trợ tối đa</span>
            </h2>
            <p className="text-brand-text-muted text-sm font-medium">
              Cung cấp giải pháp phiên dịch trọn gói phù hợp cả trong y tế, giáo dục, công sở và cuộc sống hàng ngày.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 border border-brand-border bg-white rounded-[24px] space-y-4 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-brand-primary-light text-brand-primary rounded-xl flex items-center justify-center shadow-inner">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-brand-text uppercase">Dịch Cuộc Gọi Thời Gian Thực</h3>
              <p className="text-xs text-brand-text-muted leading-relaxed font-medium">
                Tự động nhận dạng từng chuyển động tay, cử chỉ cơ thể và nét mặt từ webcam đầu dây khiếm thính để phát âm tiếng Việt chuẩn xác hoặc phụ đề tức thì.
              </p>
            </div>

            <div className="p-8 border border-brand-border bg-white rounded-[24px] space-y-4 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-brand-primary-light text-brand-primary rounded-xl flex items-center justify-center shadow-inner">
                <Languages className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-brand-text uppercase">Biểu Diễn Bằng Ký Hiệu 3D</h3>
              <p className="text-xs text-brand-text-muted leading-relaxed font-medium">
                Người nói thường chỉ cần nói qua mic, hệ thống nhận dạng giọng nói và chuyển đổi sang hình ảnh nhân vật ảo 3D chuyển động mượt mà.
              </p>
            </div>

            <div className="p-8 border border-brand-border bg-white rounded-[24px] space-y-4 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-brand-primary-light text-brand-primary rounded-xl flex items-center justify-center shadow-inner">
                <Accessibility className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-brand-text uppercase">Gói Từ Điển Vùng Miền</h3>
              <p className="text-xs text-brand-text-muted leading-relaxed font-medium">
                Sở hữu bộ ngữ pháp chuyên sâu cho cả Ngôn ngữ Ký hiệu miền Bắc, Trung, Nam kết hợp bộ dấu gõ thông minh giúp dịch sát nghĩa và đúng ngữ cảnh văn hóa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl font-black tracking-tight text-brand-text sm:text-4xl uppercase">
            Các gói dịch vụ <span className="text-brand-primary">phù hợp lý tưởng</span>
          </h2>
          <p className="text-brand-text-muted text-sm font-medium">
            Bắt đầu hoàn toàn miễn phí hoặc chọn các gói nâng cao để sử dụng không giới hạn phút gọi thời gian thực và huấn luyện từ điển riêng biệt.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white border border-brand-border rounded-[24px] p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="space-y-6">
              <div>
                <h3 className="text-brand-text-muted text-xs font-bold uppercase tracking-wider">Cá Nhân Cơ Bản</h3>
                <div className="mt-4 flex items-baseline text-brand-text">
                  <span className="text-4xl font-extrabold">0đ</span>
                  <span className="ml-1 text-xs text-brand-text-muted">/mãi mãi</span>
                </div>
                <p className="mt-2 text-xs text-brand-text-muted">Dành cho cá nhân trải nghiệm giao tiếp cơ bản</p>
              </div>
              <ul className="border-t border-brand-border pt-6 space-y-4 text-xs text-brand-text-muted">
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-brand-secondary shrink-0" />
                  Dịch tối sầu 30 phút cuộc gọi/tháng
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-brand-secondary shrink-0" />
                  Nhận diện bộ chữ cái ngón tay cơ bản
                </li>
                <li className="flex items-center gap-3 text-brand-text-muted/40 line-through">
                  Không hỗ trợ Hình đại diện 3D (Avatar)
                </li>
                <li className="flex items-center gap-3 text-brand-text-muted/40 line-through">
                  Không hỗ trợ tải lưu trữ gói ngoại tuyến
                </li>
              </ul>
            </div>
            <button 
              id="pricing-free-btn"
              onClick={() => onNavigate('dashboard')} 
              className="mt-8 w-full py-3.5 border border-brand-border hover:bg-brand-bg text-brand-text text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              Chọn gói Miễn phí
            </button>
          </div>

          {/* Premium Tier (Recommended) */}
          <div className="bg-brand-primary text-white rounded-[24px] p-8 flex flex-col justify-between shadow-lg relative overflow-hidden border border-brand-primary">
            <div className="absolute top-0 right-0 bg-brand-secondary text-white text-[9px] px-5 py-1.5 rounded-bl-xl font-extrabold tracking-widest uppercase">
              ƯU CHUỘNG
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-white/80 text-xs font-bold uppercase tracking-wider">Cá Nhân Cao Cấp</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-black">180K</span>
                  <span className="ml-1 text-xs text-white/70">/tháng</span>
                </div>
                <p className="mt-2 text-xs text-white/80">Dành cho cộng đồng kết nối thường xuyên và gia đình</p>
              </div>
              <ul className="border-t border-brand-primary-light/20 pt-6 space-y-4 text-xs text-white/90">
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-brand-secondary-light shrink-0" />
                  Dịch cuộc gọi video không giới hạn phút
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-brand-secondary-light shrink-0" />
                  Nhận dạng chuỗi ký hiệu VSL Bắc-Trung-Nam
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-brand-secondary-light shrink-0" />
                  Kích hoạt Avatar 3D phản hồi song song
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-brand-secondary-light shrink-0" />
                  Tải gói ngôn ngữ sử dụng ngoại tuyến
                </li>
              </ul>
            </div>
            <button 
              id="pricing-premium-btn"
              onClick={() => onNavigate('dashboard')} 
              className="mt-8 w-full py-4 bg-white hover:bg-brand-primary-light text-brand-primary text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
            >
              Nâng cấp Premium ngay
            </button>
          </div>

          {/* Enterprise Tier */}
          <div className="bg-white border border-brand-border rounded-[24px] p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="space-y-6">
              <div>
                <h3 className="text-brand-text-muted text-xs font-bold uppercase tracking-wider">Chuyên Nghiệp / Tổ Chức</h3>
                <div className="mt-4 flex items-baseline text-brand-text">
                  <span className="text-3xl font-black">Cá nhân hóa</span>
                </div>
                <p className="mt-2 text-xs text-brand-text-muted">Dành cho trường chuyên biệt, bệnh viện, cơ quan hành chính</p>
              </div>
              <ul className="border-t border-brand-border pt-6 space-y-4 text-xs text-brand-text-muted">
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-brand-secondary shrink-0" />
                  Tích hợp SDK/API vào phần mềm quản lý riêng
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-brand-secondary shrink-0" />
                  Tùy chỉnh thuật ngữ chuyên ngành Y tế/Pháp luật
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-brand-secondary shrink-0" />
                  Tận hưởng hạ tầng riêng độ trễ dưới 20ms
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-brand-secondary shrink-0" />
                  Hỗ trợ kỹ thuật 24/7 trực tiếp chuyên nghiệp
                </li>
              </ul>
            </div>
            <button 
              id="pricing-enterprise-btn"
              onClick={() => onNavigate('dashboard')} 
              className="mt-8 w-full py-3.5 border border-brand-primary hover:bg-brand-bg text-brand-primary text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              Liên hệ chúng tôi
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="landing-footer" className="bg-brand-surface-container text-brand-text-muted py-12 px-6 border-t border-brand-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white">
              <Accessibility className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-xl text-brand-primary">SignBridge</span>
          </div>
          <p className="text-[11px] text-center md:text-left font-medium">
            © {new Date().getFullYear()} SignBridge Việt Nam - Vì cộng đồng không rào cản giao tiếp. Powered by AI Studio.
          </p>
          <div className="flex gap-6 text-[11px] font-bold">
            <a href="#" className="hover:text-brand-primary transition-colors">Điều khoản dịch vụ</a>
            <a href="#" className="hover:text-brand-primary transition-colors">Chính sách bảo mật</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
