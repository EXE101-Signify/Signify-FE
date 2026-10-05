import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { Languages, Mic, MoreHorizontal, Paperclip, Phone, SendHorizontal, Smile, Sparkles, Video } from 'lucide-react';
import type { ChatConversationItem } from './types';

interface ChatPanelProps {
  conversation: ChatConversationItem;
  onSend: (content: string) => void;
  onVideoCall: () => void;
  onToggleInfo: () => void;
  onPreviewFeature: (message: string) => void;
}

export default function ChatPanel({ conversation, onSend, onVideoCall, onToggleInfo, onPreviewFeature }: ChatPanelProps) {
  const [draft, setDraft] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const content = draft.trim();
    if (!content) return;
    onSend(content);
    setDraft('');
    setShowEmoji(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-[#f8faf8]">
      <header className="flex h-[88px] shrink-0 items-center justify-between border-b-2 border-[#d1dfda] bg-[#f7fbf9]/95 px-6 shadow-[0_8px_24px_rgba(59,78,72,0.07)] backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative shrink-0"><img src={conversation.avatar} alt={conversation.name} className="h-12 w-12 rounded-2xl object-cover" referrerPolicy="no-referrer" /><i className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${conversation.presence === 'online' ? 'bg-[#62ad8d]' : conversation.presence === 'busy' ? 'bg-[#d89b63]' : 'bg-[#b8c2be]'}`} /></span>
          <span className="min-w-0"><strong className="block truncate text-base font-extrabold text-[#20322d]">{conversation.name}</strong><small className="mt-0.5 block truncate text-xs font-semibold text-[#72827c]">{conversation.lastSeen}</small></span>
        </div>

        <div className="flex items-center gap-1.5 text-[#4e746c]">
          <button type="button" onClick={() => onPreviewFeature('Cuộc gọi thoại sẽ được nối khi backend call sẵn sàng.')} title="Gọi thoại" className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f4f7f5] transition hover:bg-[#e8f1ed]"><Phone className="h-4.5 w-4.5" /></button>
          <button type="button" onClick={onVideoCall} title="Gọi video" className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e5f1ed] text-[#326b62] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#d6e8e2]"><Video className="h-4.5 w-4.5" /></button>
          <button type="button" onClick={onToggleInfo} title="Thông tin hội thoại" className="flex h-10 w-10 items-center justify-center rounded-2xl transition hover:bg-[#edf4f1]"><MoreHorizontal className="h-5 w-5" /></button>
        </div>
      </header>

      <div className="flex items-center justify-between gap-3 border-b border-[#d9cfdf] bg-[#eae2f0] px-6 py-2.5 shadow-inner">
        <span className="flex items-center gap-2 text-[11px] font-bold text-[#705f77]"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/80 text-[#b36f5b]"><Sparkles className="h-3.5 w-3.5" /></span>Trợ lý phiên dịch Signify đang sẵn sàng</span>
        <span className="hidden rounded-full bg-[#fff8f4] px-3 py-1 text-[10px] font-bold text-[#936553] ring-1 ring-[#efd9d0] lg:inline">Ký hiệu ↔ Văn bản</span>
      </div>

      <div className="signify-chat-pattern relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-6 py-7">
        <span className="pointer-events-none absolute -left-20 top-12 h-64 w-64 rounded-full bg-[#d9ebe5]/45 blur-2xl" />
        <span className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-[#ead7e5]/35 blur-2xl" />
        <div className="relative mx-auto max-w-3xl">
          <div className="mb-6 flex justify-center"><span className="rounded-full border border-white/80 bg-white/80 px-3 py-1 text-[10px] font-bold text-[#7a8984] shadow-sm backdrop-blur">Hôm nay</span></div>
          <div className="space-y-4">
            {conversation.messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[72%] ${message.sender === 'me' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`rounded-[22px] px-4 py-3 text-sm leading-6 ${message.sender === 'me' ? 'rounded-br-md bg-[#3f7c72] text-white shadow-[0_10px_24px_rgba(63,124,114,0.18)]' : 'rounded-bl-md border border-white bg-white/95 text-[#2b3b37] shadow-[0_10px_26px_rgba(58,76,70,0.08)]'}`}>{message.content}</div>
                  {message.translatedText && <div className="mt-1.5 flex items-center gap-1 rounded-xl bg-[#f5e9f2] px-2.5 py-1 text-[10px] font-semibold text-[#806176]"><Languages className="h-3 w-3" />{message.translatedText}</div>}
                  <span className="mt-1.5 px-1 text-[10px] text-[#86948f]">{message.time}{message.sender === 'me' && message.status === 'seen' ? ' · Đã xem' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="relative shrink-0 border-t-2 border-[#d1dfda] bg-[#eef6f2]/95 px-5 py-4 shadow-[0_-10px_30px_rgba(59,78,72,0.08)] backdrop-blur">
        {showEmoji && <div className="absolute bottom-[82px] left-16 flex gap-2 rounded-2xl border border-[#dfe8e4] bg-white p-3 shadow-xl">{['😊', '👍', '❤️', '👏', '✨'].map((emoji) => <button key={emoji} type="button" onClick={() => setDraft((value) => `${value}${emoji}`)} className="text-xl transition hover:scale-125">{emoji}</button>)}</div>}
        <form onSubmit={submit} className="mx-auto flex max-w-3xl items-end gap-2">
          <button type="button" onClick={() => onPreviewFeature('Gửi tệp sẽ được kích hoạt khi gắn API chat.')} title="Đính kèm" className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[#60756e] transition hover:bg-[#edf4f1]"><Paperclip className="h-4.5 w-4.5" /></button>
          <div className="flex min-w-0 flex-1 items-end rounded-[24px] border border-[#d8e4df] bg-[#f7faf8] px-3 shadow-inner shadow-[#4e756d]/[0.02] focus-within:border-[#77a89d] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#77a89d]/10">
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleKeyDown} rows={1} placeholder={`Nhắn tin cho ${conversation.name}`} className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-1 py-3 text-sm text-[#263934] outline-none" />
            <button type="button" onClick={() => setShowEmoji((value) => !value)} title="Biểu cảm" className="mb-1 flex h-9 w-9 items-center justify-center text-[#71847d]"><Smile className="h-4.5 w-4.5" /></button>
            <button type="button" onClick={() => onPreviewFeature('Ghi âm sẽ được kích hoạt ở giai đoạn tích hợp API.')} title="Ghi âm" className="mb-1 flex h-9 w-9 items-center justify-center text-[#71847d]"><Mic className="h-4.5 w-4.5" /></button>
          </div>
          <button type="submit" disabled={!draft.trim()} title="Gửi tin nhắn" className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#3f7c72] text-white shadow-lg shadow-[#3f7c72]/20 transition hover:bg-[#32665e] disabled:cursor-not-allowed disabled:opacity-40"><SendHorizontal className="h-4.5 w-4.5" /></button>
        </form>
      </footer>
    </section>
  );
}
