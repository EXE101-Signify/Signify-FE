import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  PhoneOff, Mic, MicOff, Video, VideoOff, Type, UserSquare, Sliders, 
  Send, Brain, Clock, HelpCircle, CheckCircle, Languages, AlertCircle 
} from 'lucide-react';
import { Contact, Screen, Message } from '../types';

interface VideoCallProps {
  contact: Contact;
  onEndCall: () => void;
}

export default function VideoCall({ contact, onEndCall }: VideoCallProps) {
  const [micActive, setMicActive] = useState(true);
  const [cameraActive, setCameraActive] = useState(true);
  const [avatarActive, setAvatarActive] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState<number>(14);
  const [translationSpeed, setTranslationSpeed] = useState<string>('normal');
  const [inputMessage, setInputMessage] = useState('');
  const [chatLog, setChatLog] = useState<Message[]>([
    { id: '1', sender: 'other', senderName: contact.name, text: 'Chào buổi sáng! Bạn cứu rỗi dự án thiết kế nộp trưa nay chưa?', timestamp: '14:20' },
    { id: '2', sender: 'user', senderName: 'Tôi', text: 'Tôi đang rà soát đây. Mọi thứ có vẻ rất tốt.', timestamp: '14:22' },
    { id: '3', sender: 'other', senderName: contact.name, text: 'Chào bạn, hôm nay thế nào rồi?', timestamp: 'Vừa xong', isAISignRecognition: true }
  ]);
  const [currentSubtitle, setCurrentSubtitle] = useState('Chào bạn, hôm nay thế nào rồi?');
  const [isTranslating, setIsTranslating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Webcam reference
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // joint coordinate simulation variables
  const [skeletonWave, setSkeletonWave] = useState(0);

  // Subtitle custom adjustments
  const availableSpeeds = [
    { value: 'slow', label: 'Chậm (0.75x)' },
    { value: 'normal', label: 'Bình thường (1.0x)' },
    { value: 'fast', label: 'Nhanh (1.5x)' }
  ];

  // Request webcam access safely with fallback for sandboxed iframes
  useEffect(() => {
    if (cameraActive && typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.warn('Real webcam not found or permission denied, using mock stream representation', err);
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraActive]);

  // Handle CSS-animated skeleton joint dots
  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      setSkeletonWave(prev => (prev + 0.05) % (Math.PI * 2));
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Post translation prompt to server-side Gemini gateway
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsgText = inputMessage;
    // Append user message
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      senderName: 'Tôi',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatLog(prev => [...prev, newMsg]);
    setInputMessage('');
    setIsTranslating(true);
    setAiError(null);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: userMsgText,
          mode: 'text_to_sign'
        })
      });

      if (!response.ok) {
        const errVal = await response.json();
        throw new Error(errVal.error || 'Dịch thuật thất bại hoặc máy chủ bận.');
      }

      const data = await response.json();
      
      // Append translated response as an AI transcript helper
      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'system',
        senderName: 'SignBridge AI',
        text: `Phiên dịch chuỗi ký hiệu cử chỉ: ${data.translated || ''}\n\n${data.explanation || ''}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isTranscribedSignSeq: true
      };
      setChatLog(prev => [...prev, aiReply]);
      
      // Set the dynamic subtitle too mirroring what is translating!
      setCurrentSubtitle(userMsgText);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Lỗi hệ thống trong lúc dịch thuật.');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div id="videocall-room-root" className="min-h-screen bg-neutral-900 text-white font-sans flex flex-col md:flex-row overflow-hidden relative">
      
      {/* 1. Main Video call stage (Left & Center) */}
      <div id="video-stage" className="flex-1 flex flex-col justify-between p-6 relative">
        
        {/* Floating Connection Status info */}
        <div id="call-status-bar" className="flex items-center justify-between z-10 bg-neutral-900/60 backdrop-blur-md p-3.5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-brand-primary shadow-lg">
              <img 
                src={contact.avatar} 
                alt={contact.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="font-extrabold text-sm leading-tight text-white">{contact.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 bg-brand-secondary rounded-full animate-pulse"></span>
                <span className="text-[10px] text-brand-secondary font-mono tracking-widest uppercase font-extrabold">ĐANG DỊCH TRỰC TIẾP • HD 1080p</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="bg-brand-primary text-white px-3.5 py-1.5 rounded-xl border border-brand-primary-light/10 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-primary/10">
              <Brain className="w-4 h-4" />
              NHẬN DIỆN KÝ HIỆU: HOẠT ĐỘNG
            </div>
          </div>
        </div>

        {/* Video feed core canvas overlay with mockup signing lady */}
        <div id="call-video-grid" className="my-4 flex-1 bg-neutral-950 rounded-[24px] overflow-hidden relative border border-white/5 shadow-2xl flex items-center justify-center min-h-[460px]">
          
          {/* Main Feed: Deaf caller signing */}
          <img 
            id="deaf-caller-main-video"
            src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=640" 
            alt="Deaf signer caller" 
            className="absolute inset-0 w-full h-full object-cover opacity-80"
            referrerPolicy="no-referrer"
          />

          {/* AI Finger-mesh landmark mockup mapping points (Interactive canvas effect) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            {/* Draw nodes linking fingers to imitate real hand mesh scanning */}
            <g transform="translate(180, 200)">
              {/* Wrist node */}
              <circle cx="100" cy="200" r="5" fill="#ffffff" className="animate-ping" />
              {/* Joint links paths */}
              <path d="M 100 200 L 70 150 L 50 110" stroke="#a1a1aa" strokeWidth="2" strokeDasharray="3" fill="none" opacity="0.8" />
              <path d="M 100 200 L 95 130 L 90 80" stroke="#a1a1aa" strokeWidth="2" strokeDasharray="3" fill="none" opacity="0.8" />
              <path d="M 100 200 L 120 135 L 130 90" stroke="#a1a1aa" strokeWidth="2" strokeDasharray="3" fill="none" opacity="0.8" />
              {/* Finger Tips nodes */}
              <circle cx="50" cy="110" r="4.5" fill="#34d399" />
              <circle cx="90" cy="80" r="4.5" fill="#34d399" />
              <circle cx="130" cy="90" r="4.5" fill="#34d399" />
              {/* Face landmarks mock */}
              <circle cx="100" cy="-60" r="3.5" fill="#ffffff" />
              <circle cx="85" cy="-70" r="2.5" fill="#ffffff" />
              <circle cx="115" cy="-70" r="2.5" fill="#ffffff" />
              <path d="M 85 -50 Q 100 -40 115 -50" stroke="#ffffff" strokeWidth="1.5" fill="none" />
            </g>
          </svg>

          {/* Floating Subtitle Overlay Card */}
          <div className="absolute inset-x-8 bottom-6 z-20 flex justify-center">
            <div className="bg-neutral-900/95 backdrop-blur-md px-6 py-4 rounded-xl border border-white/10 text-center shadow-2xl max-w-lg">
              <span className="text-[9px] font-black text-brand-secondary tracking-widest uppercase block mb-1">
                DỊCH THỨC THÌ (VSL ➔ TV)
              </span>
              <p style={{ fontSize: `${fontSize}px` }} className="font-extrabold text-white tracking-wide leading-relaxed">
                "{currentSubtitle}"
              </p>
            </div>
          </div>

          {/* Floating Picture-In-Picture for 3D Avatar Interpreter or User Camera */}
          {avatarActive && (
            <div id="pip-interpreter-avatar" className="absolute bottom-6 left-6 w-36 sm:w-44 aspect-[3/4] bg-neutral-900/90 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col justify-between p-3.5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="bg-brand-primary/20 text-brand-primary-light font-mono text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-widest">
                  AVATAR 3D
                </span>
                <span className="w-1.5 h-1.5 bg-brand-secondary rounded-full animate-pulse"></span>
              </div>

              {/* Animated skeleton SVG reproducing signing gestures */}
              <div className="flex-1 flex items-center justify-center py-2">
                <svg className="w-24 h-24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Spine & Head */}
                  <circle cx="50" cy="25" r="10" fill="#ffffff" />
                  <line x1="50" y1="35" x2="50" y2="65" stroke="#ffffff" strokeWidth="3" />
                  {/* Left Shoulder -> Elbow -> Hand */}
                  <line 
                  x1="50" y1="40" 
                  x2="30" y2="45" 
                  stroke="#a1a1aa" strokeWidth="3.5" 
                  />
                  <line 
                  x1="30" y1="45" 
                  x2="20" y2={(Math.sin(skeletonWave) * 15 + 40)} 
                  stroke="#a1a1aa" strokeWidth="3" 
                  />
                  {/* Left Hand node */}
                  <circle cx="20" cy={(Math.sin(skeletonWave) * 15 + 40)} r="4" fill="#34d399" />

                  {/* Right Shoulder -> Elbow -> Hand */}
                  <line 
                  x1="50" y1="40" 
                  x2="70" y2="45" 
                  stroke="#a1a1aa" strokeWidth="3.5" 
                  />
                  <line 
                  x1="70" y1="45" 
                  x2="80" y2={(Math.cos(skeletonWave * 1.5) * 12 + 40)} 
                  stroke="#a1a1aa" strokeWidth="3" 
                  />
                  {/* Right Hand node */}
                  <circle cx="80" cy={(Math.cos(skeletonWave * 1.5) * 12 + 40)} r="4" fill="#34d399" />
                </svg>
              </div>

              <div className="text-center">
                <span className="text-[10px] text-white font-bold tracking-wider uppercase leading-tight block">Kính Phiên Dịch</span>
              </div>
            </div>
          )}

          {/* User's PIP (Live WebCam Stream if active) */}
          {cameraActive && (
            <div id="pip-user-webcam" className="absolute top-6 right-6 w-32 sm:w-40 aspect-[4/3] bg-neutral-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <span className="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono">
                Tôi (Webcam)
              </span>
            </div>
          )}

        </div>

        {/* Action Controls Toolbar */}
        <div id="call-control-toolbar" className="flex items-center justify-between bg-neutral-950/80 border border-white/5 p-4 rounded-3xl z-10 gap-3">
          
          <div className="flex items-center gap-2">
            {/* Mic button */}
            <button 
              id="call-toggle-mic-btn"
              onClick={() => setMicActive(!micActive)}
              className={`p-3.5 rounded-2xl transition-all cursor-pointer ${micActive ? 'bg-neutral-900 hover:bg-neutral-800 text-white' : 'bg-brand-error text-white animate-pulse'}`}
            >
              {micActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            {/* Camera button */}
            <button 
              id="call-toggle-camera-btn"
              onClick={() => setCameraActive(!cameraActive)}
              className={`p-3.5 rounded-2xl transition-all cursor-pointer ${cameraActive ? 'bg-neutral-900 hover:bg-neutral-800 text-white' : 'bg-brand-error text-white animate-pulse'}`}
            >
              {cameraActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* 3D Avatar Toggle */}
            <button 
              id="call-toggle-avatar-btn"
              onClick={() => setAvatarActive(!avatarActive)}
              className={`px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${avatarActive ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/10' : 'bg-neutral-900 text-neutral-400'}`}
            >
              <UserSquare className="w-4.5 h-4.5" />
              Avatar 3D: {avatarActive ? 'MỞ' : 'TẤT'}
            </button>

            {/* Subtitles custom control */}
            <button 
              id="call-toggle-sub-panel-btn"
              onClick={() => setShowSettings(!showSettings)}
              className={`px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${showSettings ? 'bg-brand-secondary text-white' : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'}`}
            >
              <Sliders className="w-4.5 h-4.5" />
              Tùy chỉnh dịch
            </button>
          </div>

          {/* End Call Button */}
          <button 
            id="call-end-phone-btn"
            onClick={onEndCall}
            className="px-6 py-3.5 bg-brand-error hover:bg-brand-error/95 text-white rounded-2xl text-xs font-black tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-brand-error/10"
          >
            <PhoneOff className="w-4.5 h-4.5" />
            GÁC MÁY
          </button>
        </div>

      </div>

      {/* 2. Right Sidebar: Gemini SignBridge chat log & real-time translation portal */}
      <aside id="chat-translation-sidebar" className="w-full md:w-96 bg-neutral-950 border-l border-white/5 flex flex-col justify-between shrink-0">
        
        {/* Title sidebar */}
        <div className="border-b border-white/5 p-5 flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-sm tracking-tight text-white uppercase flex items-center gap-2 font-sans">
              <Brain className="w-5 h-5 text-brand-primary" />
              Nhật ký Phiên dịch AI
            </h2>
            <span className="text-[10px] text-neutral-400 font-bold">Thời gian thực kết nối với Gemini</span>
          </div>
        </div>

        {/* Subtitle adjustment Popover overlay inline inside sidebar to maximize vertical screen efficiency */}
        {showSettings && (
          <div id="call-subsettings-pop" className="bg-neutral-900 border-b border-white/5 p-5 space-y-4 shadow-2xl relative">
            <h4 className="text-xs font-black tracking-wider text-white uppercase flex items-center gap-1.5 font-sans">
              <Sliders className="w-4 h-4" /> cấu hình phụ đề
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Cỡ chữ phụ đề</label>
                <div className="flex items-center gap-2">
                  <input 
                    id="sub-font-slider"
                    type="range" 
                    min="12" 
                    max="22" 
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-brand-primary h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-mono">{fontSize}px</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Tốc độ dịch thuật</label>
                <select 
                  id="sub-speed-select"
                  value={translationSpeed}
                  onChange={(e) => setTranslationSpeed(e.target.value)}
                  className="block w-full py-1.5 px-3 bg-neutral-800 border border-white/10 rounded-lg text-xs font-bold text-white outline-none"
                >
                  {availableSpeeds.map(spd => (
                    <option key={spd.value} value={spd.value}>{spd.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Chat Logs Area */}
        <div id="chat-logs-viewport" className="flex-1 p-5 overflow-y-auto space-y-4">
          
          {aiError && (
            <div className="p-4 bg-brand-error/10 border border-brand-error/30 rounded-2xl flex items-start gap-2 text-rose-300 text-xs shadow-inner">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-brand-error" />
              <div>
                <span className="font-bold">Lỗi kết nối dịch thuật:</span> {aiError}
              </div>
            </div>
          )}

          {chatLog.map(msg => (
            <div 
              key={msg.id} 
              className={`flex flex-col space-y-1.5 ${
                msg.sender === 'user' ? 'items-end' : 
                msg.sender === 'system' ? 'items-stretch' : 'items-start'
              }`}
            >
              {/* Header metadata tag */}
              <div className="flex items-center gap-1.5 px-1">
                <span className="text-[10px] font-bold text-neutral-400">{msg.senderName}</span>
                <span className="text-[9px] text-neutral-500 font-bold">• {msg.timestamp}</span>
              </div>

              {/* Chat bubble body */}
              <div className={`p-3.5 rounded-2xl text-xs max-w-[85%] whitespace-pre-wrap font-bold ${
                msg.sender === 'user' 
                  ? 'bg-brand-primary text-white rounded-tr-none' 
                  : msg.sender === 'system'
                  ? 'bg-neutral-900 border border-white/5 text-neutral-200 rounded-2xl shadow-inner'
                  : 'bg-neutral-800 text-neutral-200 rounded-tl-none'
              }`}>
                {msg.text}

                {/* Badges signifying AI identification active */}
                {msg.isAISignRecognition && (
                  <span className="inline-flex items-center gap-1 mt-2.5 text-[9px] bg-brand-secondary/10 text-brand-secondary px-2.5 py-1 rounded font-black tracking-widest uppercase border border-brand-secondary/20 block w-fit">
                    • AI Nhận Diện Hoạt Động
                  </span>
                )}
                {msg.isTranscribedSignSeq && (
                  <span className="inline-flex items-center gap-1 mt-2 text-[9px] bg-brand-primary/10 text-brand-primary-light px-2.5 py-1 rounded font-black tracking-widest uppercase border border-brand-primary/20 block w-fit">
                    • Ký Hiệu Dịch thuật
                  </span>
                )}
              </div>
            </div>
          ))}

          {isTranslating && (
            <div className="flex items-center gap-2 p-3 bg-neutral-900 border border-white/5 rounded-2xl text-xs text-neutral-400">
              <Brain className="w-4 h-4 text-brand-primary animate-spin" />
              <span>Trợ lý AI đang phân tích ngôn ngữ ký hiệu...</span>
            </div>
          )}
        </div>

        {/* Input box to post translations */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-neutral-900">
          <div className="relative flex items-center bg-neutral-950 border border-white/10 rounded-2xl px-3.5 py-1">
            <input
              id="call-chat-input"
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-transparent border-none text-white placeholder-neutral-500 font-medium text-xs py-3.5 focus:outline-none"
              placeholder="Nhập tin nhắn để dịch sang Ký hiệu..."
            />
            <button 
              id="call-chat-submit"
              type="submit" 
              disabled={isTranslating}
              className="p-2.5 bg-brand-primary hover:bg-brand-primary-hover disabled:bg-neutral-800 text-white rounded-xl transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-neutral-500 text-center mt-2.5 font-bold">
            Tin nhắn bạn gửi đi sẽ được chuyển sang dạng ký hiệu trên Avatar hoặc phát âm thoại.
          </p>
        </form>

      </aside>

    </div>
  );
}
