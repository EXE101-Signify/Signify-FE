import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  PhoneOff, Mic, MicOff, Video, VideoOff, Type, Sliders,
  Send, Brain, Clock, HelpCircle, CheckCircle, Languages, AlertCircle 
} from 'lucide-react';
import { Contact, Screen, Message } from '../types';
import { getStoredUser } from '../services/apiClient';
import { videoCallApi, type VideoCallRecord } from '../services/videoCallApi';
import { subscribeToAiCallEvents, type AiConnectionState } from '../services/aiPredictionStream';
import { sendAiTextCommand, type AiTextCommand } from '../services/aiTextApi';
import type { AiPredictionEvent } from '../services/aiPrediction';
import { useWebRtcCall } from '../hooks/useWebRtcCall';
import { useAiFrameCapture } from '../hooks/useAiFrameCapture';
import {
  DEFAULT_SUBTITLE_SETTINGS,
  loadSubtitleSettings,
  saveSubtitleSettings,
  subtitleBackgroundColor,
  subtitleTextStyle,
  type SubtitleSettings,
  type SubtitlePosition,
} from '../utils/subtitleSettings';

type AiCallRole = 'SIGNER' | 'VIEWER';

interface VideoCallProps {
  contact: Contact;
  callId: number;
  call: VideoCallRecord;
  role: AiCallRole;
  onCallUpdated: (call: VideoCallRecord) => void;
  onEndCall: () => void;
}

const callStatusLabels: Record<VideoCallRecord['status'], string> = {
  CALLING: 'Đang gọi',
  ACCEPTED: 'Đã kết nối',
  COMPLETED: 'Đã kết thúc',
  REJECTED: 'Đã từ chối',
  MISSED: 'Cuộc gọi nhỡ',
  BUSY: 'Người nhận đang bận',
};

const SUBTITLE_TEXT_COLORS = [
  { label: 'Trắng', value: '#FFFFFF' },
  { label: 'Vàng', value: '#FDE047' },
  { label: 'Đen', value: '#000000' },
];

const SUBTITLE_POSITIONS: Array<{ value: SubtitlePosition; label: string }> = [
  { value: 'top', label: 'Trên' },
  { value: 'center', label: 'Giữa' },
  { value: 'bottom', label: 'Dưới' },
];

const SUBTITLE_POSITION_CLASSES: Record<SubtitlePosition, string> = {
  top: 'top-32 sm:top-28',
  center: 'inset-y-0 items-center',
  bottom: 'bottom-32 sm:bottom-6',
};

const SUBTITLE_PREVIEW_POSITION_CLASSES: Record<SubtitlePosition, string> = {
  top: 'top-2',
  center: 'inset-y-0 items-center',
  bottom: 'bottom-2',
};

export default function VideoCall({ contact, callId, call, role, onCallUpdated, onEndCall }: VideoCallProps) {
  const [micActive, setMicActive] = useState(true);
  const [cameraActive, setCameraActive] = useState(true);
  const [localVideoReady, setLocalVideoReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [subtitleSettings, setSubtitleSettings] = useState<SubtitleSettings>(loadSubtitleSettings);
  const [translationSpeed, setTranslationSpeed] = useState<string>('normal');
  const [inputMessage, setInputMessage] = useState('');
  const [chatLog, setChatLog] = useState<Message[]>([
    { id: '1', sender: 'other', senderName: contact.name, text: 'Chào buổi sáng! Bạn cứu rỗi dự án thiết kế nộp trưa nay chưa?', timestamp: '14:20' },
    { id: '2', sender: 'user', senderName: 'Tôi', text: 'Tôi đang rà soát đây. Mọi thứ có vẻ rất tốt.', timestamp: '14:22' },
    { id: '3', sender: 'other', senderName: contact.name, text: 'Chào bạn, hôm nay thế nào rồi?', timestamp: 'Vừa xong', isAISignRecognition: true }
  ]);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [callActionBusy, setCallActionBusy] = useState(false);
  const [callActionError, setCallActionError] = useState<string | null>(null);
  const [latestPrediction, setLatestPrediction] = useState<AiPredictionEvent | null>(null);
  const [aiText, setAiText] = useState<string | null>(null);
  const [textActionBusy, setTextActionBusy] = useState(false);
  const [textActionError, setTextActionError] = useState<string | null>(null);
  const [aiConnectionState, setAiConnectionState] = useState<AiConnectionState | 'idle'>('idle');
  const isReceiver = getStoredUser()?.userId === call.receiverId;
  const { localVideoRef, remoteVideoRef, localStreamRef, state: mediaState, error: mediaError, remoteVideoReady } =
    useWebRtcCall(call, getStoredUser()?.userId, cameraActive, micActive);
  // MVP call roles: the receiver signs and the caller views. Only the signer's local camera is sent to AI.
  const aiSource = { videoRef: localVideoRef, streamRef: localStreamRef };
  const aiCaptureActive = role === 'SIGNER' && call.status === 'ACCEPTED'
    && mediaState === 'connected' && localVideoReady && remoteVideoReady && cameraActive;
  const { unavailable: aiUnavailable } = useAiFrameCapture({
    callId,
    active: aiCaptureActive,
    ...aiSource,
  });

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (role === 'VIEWER') console.debug('[AI] capture disabled for viewer');
    else if (aiCaptureActive) console.debug('[AI] role=SIGNER capture started');
  }, [role, aiCaptureActive]);

  const updateSubtitleSettings = (update: Partial<SubtitleSettings>) => {
    setSubtitleSettings((current) => ({ ...current, ...update }));
  };

  const resetSubtitleSettings = () => setSubtitleSettings({ ...DEFAULT_SUBTITLE_SETTINGS });

  const subtitleBackgroundStyle = {
    backgroundColor: subtitleBackgroundColor(subtitleSettings.backgroundColor, subtitleSettings.backgroundOpacity),
    borderRadius: `${subtitleSettings.borderRadius}px`,
  };
  const subtitleTextAppearance = subtitleTextStyle(subtitleSettings);

  useEffect(() => {
    saveSubtitleSettings(subtitleSettings);
  }, [subtitleSettings]);

  useEffect(() => {
    setLatestPrediction(null);
    setAiText(null);
    setTextActionError(null);
    if (call.status !== 'ACCEPTED' || !Number.isSafeInteger(callId) || callId <= 0) {
      setAiConnectionState('idle');
      return;
    }
    let active = true;
    const unsubscribe = subscribeToAiCallEvents(callId, (prediction) => {
      if (!active) return;
      if (import.meta.env.DEV) console.debug(`[AI] Accepted letter: ${prediction.letter}`);
      setLatestPrediction(prediction);
    }, (update) => {
      if (active) setAiText(update.text);
    }, setAiConnectionState);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [callId, call.status]);

  const performTextAction = async (command: AiTextCommand) => {
    if (role !== 'SIGNER' || call.status !== 'ACCEPTED' || textActionBusy) return;
    setTextActionBusy(true);
    setTextActionError(null);
    try {
      await sendAiTextCommand(callId, command);
    } catch (error) {
      setTextActionError(error instanceof Error ? error.message : 'Không thể cập nhật văn bản AI.');
    } finally {
      setTextActionBusy(false);
    }
  };

  const performCallAction = async (action: 'accept' | 'reject' | 'end') => {
    if (callActionBusy) return;
    setCallActionBusy(true);
    setCallActionError(null);
    try {
      const updated = await videoCallApi[action](callId);
      if (updated.id !== callId) throw new Error('Máy chủ trả về mã cuộc gọi không khớp.');
      onCallUpdated(updated);
      if (action !== 'accept') onEndCall();
    } catch (error) {
      const status = (error as { status?: number })?.status;
      const message = status === 401 ? 'Phiên đăng nhập đã hết hạn.'
        : status === 403 ? 'Bạn không có quyền thực hiện thao tác này.'
        : status === 404 ? 'Không tìm thấy cuộc gọi.'
        : status === 409 ? 'Trạng thái cuộc gọi đã thay đổi. Vui lòng thử lại.'
        : error instanceof Error ? error.message : 'Không thể cập nhật cuộc gọi.';
      setCallActionError(message);
    } finally {
      setCallActionBusy(false);
    }
  };

  // Subtitle custom adjustments
  const availableSpeeds = [
    { value: 'slow', label: 'Chậm (0.75x)' },
    { value: 'normal', label: 'Bình thường (1.0x)' },
    { value: 'fast', label: 'Nhanh (1.5x)' }
  ];

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
    <div id="videocall-room-root" className="h-screen bg-neutral-900 text-white font-sans flex flex-col md:flex-row overflow-y-auto md:overflow-hidden relative">
      
      {/* 1. Main Video call stage (Left & Center) */}
      <div id="video-stage" className="flex-1 flex flex-col justify-between p-6 relative">
        
        {/* Floating Connection Status info */}
        <div id="call-status-bar" className="flex items-center justify-between z-10 bg-neutral-900/60 backdrop-blur-md p-3.5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-brand-primary shadow-lg">
              {contact.avatar ? <img
                src={contact.avatar}
                alt={contact.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              /> : <span className="flex h-full w-full items-center justify-center bg-brand-primary text-sm font-bold">{contact.name.charAt(0)}</span>}
            </div>
            <div>
              <h3 className="font-extrabold text-sm leading-tight text-white">{contact.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 bg-brand-secondary rounded-full animate-pulse"></span>
                <span className="text-[10px] text-brand-secondary font-mono tracking-widest uppercase font-extrabold">{callStatusLabels[call.status]} · Cuộc gọi #{callId}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="bg-brand-primary text-white px-3.5 py-1.5 rounded-xl border border-brand-primary-light/10 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-primary/10">
              <Brain className="w-4 h-4" />
              {callStatusLabels[call.status]}
            </div>
          </div>
        </div>

        {/* Remote participant media */}
        <div id="call-video-grid" className="my-4 flex-1 bg-neutral-950 rounded-[24px] overflow-hidden relative border border-white/5 shadow-2xl flex items-center justify-center min-h-[460px]">
          <div id="ai-sign-prediction" aria-live="polite" className="absolute left-6 top-6 z-20 rounded-xl border border-white/10 bg-neutral-900/90 px-4 py-3 text-white shadow-lg backdrop-blur-md">
            <span className="block text-[10px] font-bold tracking-widest text-brand-secondary">AI SIGN</span>
            <span className="block text-2xl font-black">{latestPrediction?.letter ?? '—'}</span>
            <span className="block text-[10px] text-neutral-300">{latestPrediction ? `Confidence: ${Math.round(latestPrediction.confidence * 100)}%` : 'Đang chờ nhận diện'}</span>
            {aiUnavailable && <span className="block text-[10px] text-amber-300">AI tạm thời không khả dụng</span>}
            {latestPrediction && aiConnectionState === 'offline' && <span className="block text-[10px] text-amber-300">AI tạm ngắt kết nối</span>}
          </div>
          
          <video
            id="remote-call-video"
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
          {!remoteVideoReady && <div className="absolute inset-0 flex items-center justify-center bg-neutral-950 text-sm text-neutral-300">
            {mediaError || (call.status !== 'ACCEPTED' ? 'Chờ cuộc gọi được chấp nhận' : 'Đang chờ video từ người bên kia')}
          </div>}
          <div role="status" aria-live="polite" className="absolute right-4 bottom-4 z-20 rounded-lg bg-neutral-900/85 px-3 py-1.5 text-xs text-white">
            {mediaState === 'connected' ? 'Đã kết nối' : mediaState === 'failed' ? 'Kết nối thất bại'
              : mediaState === 'disconnected' ? 'Mất kết nối' : mediaState === 'connecting' ? 'Đang kết nối...' : 'Chưa kết nối'}
          </div>

          {/* Floating Subtitle Overlay Card */}
          <div className={`absolute inset-x-8 z-20 flex justify-center ${SUBTITLE_POSITION_CLASSES[subtitleSettings.position]}`}>
            <div style={subtitleBackgroundStyle} className="max-w-lg border border-white/10 px-6 py-4 text-center shadow-2xl backdrop-blur-md">
              <p style={subtitleTextAppearance} className="font-extrabold tracking-wide leading-relaxed whitespace-pre-wrap">
                "{call.status === 'ACCEPTED' ? (aiText !== null ? (aiText || 'Đang chờ nhận diện') : (currentSubtitle || 'Đang chờ nhận diện')) : 'Đang chờ nhận diện'}"
              </p>
            </div>
          </div>

          {/* Local webcam uses the stream already attached by useWebRtcCall. */}
          <div id="pip-user-webcam" className="absolute bottom-3 left-3 z-20 aspect-video w-32 overflow-hidden rounded-2xl border border-white/20 bg-neutral-900 shadow-xl sm:bottom-6 sm:left-6 sm:w-[200px] md:w-[224px]">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              onLoadedData={() => setLocalVideoReady(true)}
              onEmptied={() => setLocalVideoReady(false)}
              className={`h-full w-full object-cover -scale-x-100 ${cameraActive && localVideoReady && !mediaError ? '' : 'invisible'}`}
            />
            {(!cameraActive || !localVideoReady || mediaError) && (
              <span className="absolute inset-0 flex items-center justify-center bg-neutral-900 px-2 text-center text-[11px] text-neutral-300 sm:text-xs">
                Camera chưa bật
              </span>
            )}
            <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
              Bạn
            </span>
          </div>

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

          {role === 'SIGNER' && call.status === 'ACCEPTED' && (
            <div className="flex flex-wrap items-center gap-2" aria-label="Điều khiển văn bản AI">
              {(['space', 'delete', 'clear'] as const).map((command) => (
                <button
                  key={command}
                  type="button"
                  disabled={textActionBusy}
                  onClick={() => void performTextAction(command)}
                  className="rounded-xl bg-neutral-900 px-3 py-2 text-xs font-bold text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {command.toUpperCase()}
                </button>
              ))}
              {textActionError && <span role="alert" className="text-xs text-red-300">{textActionError}</span>}
            </div>
          )}

          <div className="flex items-center gap-2">
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
          {callActionError && <span role="alert" className="text-xs text-red-300">{callActionError}</span>}
          {call.status === 'CALLING' && isReceiver && <div className="flex gap-2">
            <button type="button" disabled={callActionBusy} onClick={() => performCallAction('accept')} className="rounded-xl bg-brand-secondary px-4 py-2 text-xs font-bold text-white">Chấp nhận</button>
            <button type="button" disabled={callActionBusy} onClick={() => performCallAction('reject')} className="rounded-xl bg-brand-error px-4 py-2 text-xs font-bold text-white">Từ chối</button>
          </div>}
          <button 
            id="call-end-phone-btn"
            disabled={callActionBusy}
            onClick={() => call.status === 'ACCEPTED' ? performCallAction('end') : onEndCall()}
            className="px-6 py-3.5 bg-brand-error hover:bg-brand-error/95 text-white rounded-2xl text-xs font-black tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-brand-error/10"
          >
            <PhoneOff className="w-4.5 h-4.5" />
            {call.status === 'ACCEPTED' ? 'GÁC MÁY' : 'ĐÓNG MÀN HÌNH'}
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
          <section id="call-subsettings-pop" aria-label="Cấu hình phụ đề" className="relative max-h-[48vh] space-y-3 overflow-y-auto overscroll-contain border-b border-white/5 bg-neutral-900 p-4 shadow-2xl sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h4 className="flex items-center gap-1.5 font-sans text-xs font-black tracking-wider text-white">
                <Sliders className="h-4 w-4" /> CẤU HÌNH PHỤ ĐỀ
              </h4>
              <button type="button" onClick={resetSubtitleSettings} className="shrink-0 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-bold text-neutral-300 transition hover:border-white/25 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-secondary">
                Đặt lại mặc định
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="col-span-2">
                <label htmlFor="sub-font-slider" className="mb-1 flex items-center justify-between text-[10px] font-bold text-neutral-300">
                  <span>Cỡ chữ phụ đề</span><output htmlFor="sub-font-slider" className="text-xs tabular-nums text-white">{subtitleSettings.fontSize}px</output>
                </label>
                <input
                  id="sub-font-slider"
                  type="range"
                  min="12"
                  max="22"
                  step="1"
                  value={subtitleSettings.fontSize}
                  aria-label="Cỡ chữ phụ đề"
                  onChange={(event) => updateSubtitleSettings({ fontSize: Number(event.target.value) })}
                  className="h-1.5 w-full cursor-pointer accent-brand-primary"
                />
              </div>

              <div className="col-span-2">
                <label htmlFor="sub-background-opacity" className="mb-1 flex items-center justify-between text-[10px] font-bold text-neutral-300">
                  <span>Độ mờ nền</span><output htmlFor="sub-background-opacity" className="text-xs tabular-nums text-white">{subtitleSettings.backgroundOpacity}%</output>
                </label>
                <input
                  id="sub-background-opacity"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={subtitleSettings.backgroundOpacity}
                  aria-label="Độ mờ nền"
                  onChange={(event) => updateSubtitleSettings({ backgroundOpacity: Number(event.target.value) })}
                  className="h-1.5 w-full cursor-pointer accent-brand-primary"
                />
              </div>

              <fieldset className="col-span-2 min-w-0">
                <legend className="mb-1.5 text-[10px] font-bold text-neutral-300">Màu chữ</legend>
                <div className="grid grid-cols-3 gap-2">
                  {SUBTITLE_TEXT_COLORS.map((color) => {
                    const selected = subtitleSettings.textColor === color.value;
                    return (
                      <button
                        key={color.value}
                        type="button"
                        aria-label={`Màu chữ ${color.label}`}
                        aria-pressed={selected}
                        onClick={() => updateSubtitleSettings({ textColor: color.value })}
                        className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[10px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-secondary ${selected ? 'border-brand-secondary bg-white/10 text-white ring-1 ring-brand-secondary' : 'border-white/10 text-neutral-300 hover:border-white/25'}`}
                      >
                        <span aria-hidden="true" className="h-3 w-3 rounded-full border border-white/30" style={{ backgroundColor: color.value }} />
                        {color.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="col-span-2 min-w-0">
                <legend className="mb-1.5 text-[10px] font-bold text-neutral-300">Màu nền</legend>
                <div className="flex flex-wrap items-center gap-2">
                  {[{ label: 'Đen', value: '#000000' }, { label: 'Trắng', value: '#FFFFFF' }].map((color) => {
                    const selected = subtitleSettings.backgroundColor === color.value;
                    return (
                      <button
                        key={color.value}
                        type="button"
                        aria-label={`Màu nền ${color.label}`}
                        aria-pressed={selected}
                        onClick={() => updateSubtitleSettings({ backgroundColor: color.value })}
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[10px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-secondary ${selected ? 'border-brand-secondary bg-white/10 text-white ring-1 ring-brand-secondary' : 'border-white/10 text-neutral-300 hover:border-white/25'}`}
                      >
                        <span aria-hidden="true" className="h-3 w-3 rounded-full border border-white/30" style={{ backgroundColor: color.value }} />
                        {color.label}
                      </button>
                    );
                  })}
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-neutral-300 transition hover:border-white/25 focus-within:outline focus-within:outline-2 focus-within:outline-brand-secondary">
                    <span aria-hidden="true" className="h-4 w-4 rounded border border-white/30" style={{ backgroundColor: subtitleSettings.backgroundColor }} />
                    Tùy chỉnh
                    <input
                      type="color"
                      value={subtitleSettings.backgroundColor}
                      aria-label="Chọn màu nền tùy chỉnh"
                      onChange={(event) => updateSubtitleSettings({ backgroundColor: event.target.value.toUpperCase() })}
                      className="sr-only"
                    />
                  </label>
                </div>
              </fieldset>

              <div>
                <label htmlFor="sub-edge-style" className="mb-1.5 block text-[10px] font-bold text-neutral-300">Kiểu viền chữ</label>
                <select id="sub-edge-style" value={subtitleSettings.edgeStyle} aria-label="Kiểu viền chữ" onChange={(event) => updateSubtitleSettings({ edgeStyle: event.target.value as SubtitleSettings['edgeStyle'] })} className="w-full rounded-lg border border-white/10 bg-neutral-950 px-2.5 py-2 text-xs text-white focus:border-brand-secondary focus:outline-none">
                  <option value="none">Không</option>
                  <option value="shadow">Bóng</option>
                  <option value="outline">Viền</option>
                </select>
              </div>

              <div>
                <label htmlFor="sub-border-radius" className="mb-1 flex items-center justify-between text-[10px] font-bold text-neutral-300">
                  <span>Bo góc nền</span><output htmlFor="sub-border-radius" className="text-xs tabular-nums text-white">{subtitleSettings.borderRadius}px</output>
                </label>
                <input id="sub-border-radius" type="range" min="0" max="16" step="1" value={subtitleSettings.borderRadius} aria-label="Bo góc nền" onChange={(event) => updateSubtitleSettings({ borderRadius: Number(event.target.value) })} className="h-1.5 w-full cursor-pointer accent-brand-primary" />
              </div>

              <div className="col-span-2">
                <label htmlFor="sub-position" className="mb-1.5 block text-[10px] font-bold text-neutral-300">Vị trí phụ đề</label>
                <select id="sub-position" value={subtitleSettings.position} aria-label="Vị trí phụ đề" onChange={(event) => updateSubtitleSettings({ position: event.target.value as SubtitlePosition })} className="w-full rounded-lg border border-white/10 bg-neutral-950 px-2.5 py-2 text-xs text-white focus:border-brand-secondary focus:outline-none">
                  {SUBTITLE_POSITIONS.map((position) => <option key={position.value} value={position.value}>{position.label}</option>)}
                </select>
              </div>

              <div className="col-span-2">
                <span className="mb-1.5 block text-[10px] font-bold text-neutral-300">Xem trước</span>
                <div className="relative h-24 overflow-hidden rounded-xl border border-white/10 bg-neutral-950 p-2">
                  <div className={`absolute inset-x-2 flex justify-center ${SUBTITLE_PREVIEW_POSITION_CLASSES[subtitleSettings.position]}`}>
                    <p style={{ ...subtitleBackgroundStyle, ...subtitleTextAppearance }} className="max-w-full px-3 py-1 text-center font-extrabold leading-relaxed">
                      Chào bạn, hôm nay thế nào rồi?
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
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
