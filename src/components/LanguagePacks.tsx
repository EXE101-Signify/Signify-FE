import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Download, CheckCircle, RefreshCcw, Search, Sparkles, 
  HelpCircle, Sliders, Volume2, Moon, Eye, AlertCircle, BookOpen, Brain 
} from 'lucide-react';
import { LanguagePack, Screen } from '../types';

interface LanguagePacksProps {
  onNavigate: (screen: Screen) => void;
}

const initialPacks: LanguagePack[] = [
  { id: 'p1', name: 'Bộ Ký hiệu Miền Bắc (VSL-N)', description: 'Tối ưu cho giao tiếp tự nhiên tại Hà Nội và các tỉnh phía Bắc. Đầy đủ từ lóng địa phương.', status: 'installed', size: '142 MB', accuracy: '98.5%', vocabCount: 1250 },
  { id: 'p2', name: 'Bộ Ký hiệu Miền Nam (VSL-S)', description: 'Phiên bản bổ túc cử chỉ thông dụng tại TP. Hồ Chí Minh và miền Tây Nam Bộ.', status: 'not_installed', size: '128 MB', accuracy: '97.2%', vocabCount: 980 },
  { id: 'p3', name: 'Bộ Ký hiệu Miền Trung (VSL-C)', description: 'Bổ trợ khẩu hình, nhịp điệu tay đặc trưng khu vực miền Trung (Huế, Đà Nẵng).', status: 'not_installed', size: '94 MB', accuracy: '95.8%', vocabCount: 750 },
  { id: 'p4', name: 'Bảng Chữ Cái Ngón tay & Chữ Quốc Ngữ', description: 'Cấu trúc mặc định đi kèm nhân diện từng chữ cái bằng một bàn tay.', status: 'installed', size: '15 MB', accuracy: '99.9%', vocabCount: 26 },
  { id: 'p5', name: 'ASL - Ngôn ngữ ký hiệu Mỹ', description: 'Học tập và dịch song hành ngôn ngữ ký hiệu thông dụng quốc tế ASL.', status: 'not_installed', size: '310 MB', accuracy: '96.4%', vocabCount: 3200 },
];

export default function LanguagePacks({ onNavigate }: LanguagePacksProps) {
  const [packs, setPacks] = useState<LanguagePack[]>(initialPacks);
  const [searchText, setSearchText] = useState('');
  const [searchDictWord, setSearchDictWord] = useState('');
  const [dictResult, setDictResult] = useState<any>(null);
  const [searchingDict, setSearchingDict] = useState(false);
  const [accessibilityMode, setAccessibilityMode] = useState('normal');

  // filter downloadable files
  const filteredPacks = packs.filter(p => p.name.toLowerCase().includes(searchText.toLowerCase()) || p.description.toLowerCase().includes(searchText.toLowerCase()));

  // Simulate download starting and completing
  const handleDownloadPack = (id: string) => {
    setPacks(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, status: 'updating' };
      }
      return p;
    }));

    setTimeout(() => {
      setPacks(prev => prev.map(p => {
        if (p.id === id) {
          return { ...p, status: 'installed' };
        }
        return p;
      }));
    }, 2000);
  };

  // Queries our real backend Gemini to lookup a sign language word description
  const handleDictLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchDictWord.trim()) return;

    setSearchingDict(true);
    setDictResult(null);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: searchDictWord,
          mode: 'text_to_sign'
        })
      });

      if (!response.ok) {
        throw new Error('Dịch từ vựng từ máy chủ thất bại.');
      }

      const data = await response.json();
      setDictResult(data);
    } catch (err) {
      console.error(err);
      setDictResult({
        translated: `Từ [${searchDictWord.toUpperCase()}]`,
        explanation: 'Không có kết nối mạng hoặc lỗi máy chủ, hiển thị mô tả mô phỏng: Cử động hai ngón tay trỏ hướng chéo nhau tạo góc chữ V, đưa cao ngang tầm mắt ra hiệu đồng thuận.'
      });
    } finally {
      setSearchingDict(false);
    }
  };

  return (
    <div id="languages-page-root" className="min-h-screen bg-brand-bg text-brand-text font-sans flex flex-col">
      {/* Top sticky header */}
      <header id="languages-header" className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-brand-border/40 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            id="back-to-dash-btn"
            onClick={() => onNavigate('dashboard')}
            className="p-2.5 bg-brand-surface-dim/30 hover:bg-brand-surface-dim/60 text-brand-text rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-brand-primary" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-brand-text leading-tight flex items-center gap-2">
              Giói <span className="text-brand-primary">Ngôn ngữ</span> & Trợ năng
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-[#464554]/70 font-black">Quản lý cơ sở dữ liệu ngoại tuyến và hỗ trợ</p>
          </div>
        </div>

        <button 
          id="ready-to-call-btn"
          onClick={() => onNavigate('dashboard')} 
          className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md shadow-brand-primary/10"
        >
          Trở về Bảng điều khiển
        </button>
      </header>

      {/* Grid Canvas */}
      <main id="languages-body-grid" className="p-8 max-w-7xl mx-auto w-full grid lg:grid-cols-12 gap-8 items-start flex-1">
        
        {/* Left Column: List of localized language packages */}
        <section id="languages-list-panel" className="lg:col-span-8 bg-white border border-brand-border/40 rounded-[24px] p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/40 pb-5">
            <div>
              <h3 className="font-extrabold text-sm text-brand-text uppercase tracking-wider">Từ điển dịch ngoại tuyến</h3>
              <p className="text-xs text-[#464554] mt-0.5 font-medium">Tải về máy giúp ứng dụng dịch nhanh ngay cả khi không có Wifi/Mạng</p>
            </div>
            
            <div className="relative w-full sm:w-52 rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-text/50">
                <Search className="w-3.5 h-3.5 text-brand-primary" />
              </div>
              <input
                id="search-packs-input"
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="block w-full pl-8.5 pr-3 py-2 bg-brand-bg border border-brand-border rounded-xl text-xs font-bold text-brand-text focus:bg-white focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                placeholder="Tìm gói ngôn ngữ..."
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredPacks.map(pack => (
              <div 
                key={pack.id} 
                className="p-5 border border-brand-border/40 bg-brand-surface-light hover:bg-[#eceef0]/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:shadow-sm transition-all"
              >
                <div className="space-y-2 max-w-md">
                  <div className="flex items-center gap-2.5">
                    <h4 className="font-extrabold text-sm text-brand-text leading-tight">{pack.name}</h4>
                    <span className="text-[9px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded font-mono font-black">{pack.size}</span>
                  </div>
                  <p className="text-xs text-[#464554] leading-relaxed font-semibold">{pack.description}</p>
                  
                  {/* Meta indices */}
                  <div className="flex items-center gap-4 text-[11px] text-[#464554]/70 font-bold">
                    <span>Số từ: {pack.vocabCount} cụm chính</span>
                    <span>•</span>
                    <span>Độ chính xác: <strong className="text-brand-secondary font-black">{pack.accuracy}</strong></span>
                  </div>
                </div>

                {/* State modifiers */}
                <div className="shrink-0 w-full sm:w-auto">
                  {pack.status === 'installed' ? (
                    <div className="px-4 py-2 bg-brand-secondary/15 text-brand-secondary text-xs font-black uppercase tracking-widest rounded-xl flex items-center gap-1.5 justify-center border border-brand-secondary/30 shadow-sm shadow-brand-secondary/5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      ĐÃ CÀI ĐẶT
                    </div>
                  ) : pack.status === 'updating' ? (
                    <div className="px-4 py-2 bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-widest rounded-xl flex items-center gap-1.5 justify-center border border-amber-200">
                      <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                      ĐANG TẢI...
                    </div>
                  ) : (
                    <button
                      id={`download-pack-btn-${pack.id}`}
                      onClick={() => handleDownloadPack(pack.id)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-black uppercase tracking-widest rounded-xl flex items-center gap-1.5 justify-center shadow-md shadow-brand-primary/10 cursor-pointer transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      TẢI NGOẠI TUYẾN
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: Interactive Sign Language Dictionary Lookup */}
        <section id="dict-lookup-panel" className="lg:col-span-4 space-y-6">
          
          {/* Lookup Panel */}
          <div className="bg-white border border-brand-border/40 rounded-[24px] p-6 shadow-sm space-y-5">
            <div className="border-b border-brand-border/40 pb-3">
              <h3 className="font-extrabold text-sm text-brand-text flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5 text-brand-primary" />
                Từ Điển Ký Hiệu AI Trực Tuyến
              </h3>
              <p className="text-[10px] text-[#464554] mt-0.5 font-bold">Tra nhanh điệu bộ ký hiệu của ngôn ngữ tự nhiên</p>
            </div>

            <form onSubmit={handleDictLookup} className="space-y-4">
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-text/50">
                  <Search className="w-4 h-4 text-brand-primary" />
                </div>
                <input
                  id="dict-word-search-input"
                  type="text"
                  value={searchDictWord}
                  onChange={(e) => setSearchDictWord(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-brand-bg border border-brand-border rounded-xl text-xs font-extrabold focus:bg-white focus:ring-2 focus:ring-brand-primary text-brand-text outline-none transition-all"
                  placeholder="Ví dụ: Xin chào, Cảm ơn, Ăn cơm..."
                />
              </div>

              <button
                id="dict-search-trigger"
                type="submit"
                disabled={searchingDict || !searchDictWord.trim()}
                className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary-hover disabled:bg-neutral-200 text-white font-black rounded-xl text-xs tracking-widest uppercase transition-all shadow-md shadow-brand-primary/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                {searchingDict ? (
                  <>
                    <RefreshCcw className="w-4 h-4 animate-spin" />
                    ĐANG TRA CỨU AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-brand-secondary" />
                    Tra cứu điệu bộ ký hiệu
                  </>
                )}
              </button>
            </form>

            {/* Translation description results block */}
            {dictResult && (
              <div id="dict-results-card" className="bg-brand-bg border border-brand-border/50 p-4.5 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-brand-primary font-black text-xs">
                  <Brain className="w-4 h-4" />
                  KÝ HIỆU AI PHÂN TÍCH THÀ THÔNG
                </div>
                
                {dictResult.sequence && dictResult.sequence.length > 0 && (
                  <div>
                    <span className="text-[9px] font-black text-[#464554] tracking-widest uppercase block mb-1">Chuỗi ký hiệu:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {dictResult.sequence.map((seq: string, idx: number) => (
                        <span key={idx} className="bg-brand-primary text-white font-mono text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
                          {seq}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-brand-secondary tracking-widest uppercase block">Hướng dẫn thực hiện:</span>
                  <p className="text-xs text-brand-text leading-relaxed font-bold font-sans">{dictResult.explanation}</p>
                </div>
              </div>
            )}

            {!dictResult && !searchingDict && (
              <div className="p-4 bg-brand-bg border border-brand-border rounded-2xl text-center text-xs text-[#464554]/70 font-semibold leading-relaxed">
                Nhập một từ tiếng Việt bất kỳ, công nghệ AI thông minh sẽ chỉ bạn cách thực hiện ngôn ngữ ký hiệu.
              </div>
            )}
          </div>

          {/* Quick Accessibility Settings */}
          <div className="bg-white border border-brand-border/40 rounded-[24px] p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-xs text-brand-text uppercase tracking-widest">TÙY CHỈNH TRỢ NĂNG</h3>
            
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Chế độ hiển thị</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setAccessibilityMode('normal')}
                    className={`py-1.5 border rounded-lg text-[10px] pb-2 font-black cursor-pointer transition-all ${accessibilityMode === 'normal' ? 'bg-brand-primary border-brand-primary text-white shadow-sm shadow-brand-primary/10' : 'border-brand-border hover:bg-brand-bg text-[#464554]'}`}
                  >
                    Bình thường
                  </button>
                  <button 
                    onClick={() => setAccessibilityMode('mono')}
                    className={`py-1.5 border rounded-lg text-[10px] pb-2 font-black cursor-pointer transition-all ${accessibilityMode === 'mono' ? 'bg-brand-primary border-brand-primary text-white shadow-sm shadow-brand-primary/10' : 'border-brand-border hover:bg-brand-bg text-[#464554]'}`}
                  >
                    Tương phản
                  </button>
                  <button 
                    onClick={() => setAccessibilityMode('deuteranopia')}
                    className={`py-1.5 border rounded-lg text-[10px] pb-2 font-black cursor-pointer transition-all ${accessibilityMode === 'deuteranopia' ? 'bg-brand-primary border-brand-primary text-white shadow-sm shadow-brand-primary/10' : 'border-brand-border hover:bg-brand-bg text-[#464554]'}`}
                  >
                    Mù màu
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-brand-border/40">
                <span className="text-xs text-brand-text/85 font-bold pb-0.5">Rung phản hồi haptic khi dịch</span>
                <input type="checkbox" defaultChecked className="h-4.5 w-4.5 accent-brand-primary rounded" />
              </div>
              <div className="flex items-center justify-between py-2 border-t border-brand-border/40">
                <span className="text-xs text-brand-text/85 font-bold pb-0.5">Tự dịch không lời</span>
                <input type="checkbox" className="h-4.5 w-4.5 accent-brand-primary rounded" />
              </div>
            </div>
          </div>

        </section>

      </main>
    </div>
  );
}
