import { BellOff, ChevronRight, FileText, Languages, Search, ShieldCheck, X } from 'lucide-react';
import type { ChatConversationItem } from './types';

interface ConversationInfoProps {
  conversation: ChatConversationItem;
  open: boolean;
  onClose: () => void;
  onPreviewFeature: (message: string) => void;
}

export default function ConversationInfo({ conversation, open, onClose, onPreviewFeature }: ConversationInfoProps) {
  if (!open) return null;

  return (
    <aside className="auth-dot-surface hidden w-[310px] shrink-0 overflow-y-auto border-l-2 border-[#cfc5d8] bg-[#f3edf6] shadow-[-10px_0_30px_rgba(76,62,84,0.08)] xl:block">
      <div className="flex h-[88px] items-center justify-between border-b-2 border-[#d8cfdf] bg-[#ebe3f1]/90 px-5 backdrop-blur"><h2 className="text-sm font-extrabold text-[#263934]">Thông tin hội thoại</h2><button type="button" onClick={onClose} aria-label="Đóng thông tin" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/65 text-[#71817c] hover:bg-white"><X className="h-4 w-4" /></button></div>

      <div className="relative overflow-hidden border-b-2 border-[#ddd4e3] bg-[#f8f3f8]/75 px-5 py-7 text-center">
        <span className="pointer-events-none absolute left-1/2 top-5 h-32 w-32 -translate-x-1/2 rounded-full bg-[#eadcea]/55 blur-xl" />
        <span className="relative inline-block rounded-[30px] bg-white p-1.5 shadow-[0_18px_36px_rgba(82,67,89,0.13)]"><img src={conversation.avatar} alt={conversation.name} className="h-20 w-20 rounded-[25px] object-cover" referrerPolicy="no-referrer" /><i className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-[3px] border-white ${conversation.presence === 'online' ? 'bg-[#62ad8d]' : conversation.presence === 'busy' ? 'bg-[#d89b63]' : 'bg-[#b8c2be]'}`} /></span>
        <h3 className="mt-4 text-base font-extrabold text-[#20322d]">{conversation.name}</h3><p className="mt-1 text-xs font-semibold text-[#788781]">{conversation.role}</p>
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[{ icon: Search, label: 'Tìm kiếm', color: 'bg-[#e3f0ec] text-[#3f7c72]' }, { icon: BellOff, label: 'Tắt báo', color: 'bg-[#f3eaf2] text-[#886d84]' }, { icon: ShieldCheck, label: 'Bảo mật', color: 'bg-[#fae9e3] text-[#a96652]' }].map(({ icon: Icon, label, color }) => <button key={label} type="button" onClick={() => onPreviewFeature(`${label} sẽ hoàn thiện ở giai đoạn gắn API.`)} className={`flex flex-col items-center gap-2 rounded-[18px] px-2 py-3 text-[9px] font-bold transition hover:-translate-y-0.5 ${color}`}><Icon className="h-4 w-4" />{label}</button>)}
        </div>
      </div>

      <div className="border-b-2 border-[#ddd4e3] bg-[#f5f0f7]/70 p-5">
        <div className="rounded-[22px] border border-white bg-gradient-to-br from-[#e5f1ed] via-[#f1edf5] to-[#faeae4] p-4 shadow-[0_12px_28px_rgba(78,89,83,0.08)]"><div className="flex items-center gap-2 text-xs font-extrabold text-[#355f57]"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/80"><Languages className="h-4 w-4" /></span>Hỗ trợ phiên dịch</div><p className="mt-3 text-[11px] leading-5 text-[#667a73]">Tin nhắn có thể được chuyển đổi giữa văn bản, giọng nói và ngôn ngữ ký hiệu.</p><button type="button" onClick={() => onPreviewFeature('Tùy chọn phiên dịch sẽ được nối với dịch vụ AI sau.')} className="mt-3 flex w-full items-center justify-between rounded-xl bg-white/85 px-3 py-2.5 text-[10px] font-bold text-[#3f6d64] shadow-sm">Thiết lập phiên dịch <ChevronRight className="h-3.5 w-3.5" /></button></div>
      </div>

      <div className="p-5"><div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-extrabold text-[#30423d]">Tệp đã chia sẻ</h3><button type="button" className="text-[10px] font-bold text-[#3f7c72]">Xem tất cả</button></div>{conversation.sharedFiles.length ? <div className="space-y-2">{conversation.sharedFiles.map((file) => <button key={file.id} type="button" onClick={() => onPreviewFeature('Xem tệp sẽ hoạt động khi API attachment được gắn.')} className="flex w-full items-center gap-3 rounded-2xl border border-[#e5ece9] p-3 text-left hover:bg-[#f7faf8]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f4e8f1] text-[#8b687f]"><FileText className="h-4 w-4" /></span><span className="min-w-0"><strong className="block truncate text-[11px] text-[#354741]">{file.name}</strong><small className="mt-0.5 block text-[9px] text-[#8a9893]">{file.meta}</small></span></button>)}</div> : <p className="rounded-2xl bg-[#f7f9f8] px-4 py-5 text-center text-[11px] text-[#87958f]">Chưa có tệp được chia sẻ.</p>}</div>
    </aside>
  );
}
