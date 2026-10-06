import { useState } from 'react';
import { Ban, BellOff, ChevronRight, FileText, Search, ShieldCheck, UserCheck, X } from 'lucide-react';
import type { ChatConversationItem } from './types';

interface ConversationInfoProps {
  conversation: ChatConversationItem;
  open: boolean;
  blocked: boolean;
  onClose: () => void;
  onBlockChange: () => Promise<void>;
  onResolveAttachment: (attachmentId: string) => Promise<string>;
  onPreviewFeature: (message: string) => void;
}

export default function ConversationInfo({ conversation, open, blocked, onClose, onBlockChange, onResolveAttachment, onPreviewFeature }: ConversationInfoProps) {
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockPending, setBlockPending] = useState(false);

  if (!open) return null;

  const confirmBlockChange = async () => {
    setBlockPending(true);
    try {
      await onBlockChange();
      setBlockDialogOpen(false);
    } catch (error) {
      onPreviewFeature(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái chặn.');
    } finally {
      setBlockPending(false);
    }
  };

  const openAttachment = async (attachmentId: string) => {
    try {
      const url = await onResolveAttachment(attachmentId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      onPreviewFeature(error instanceof Error ? error.message : 'Không thể mở tệp đính kèm.');
    }
  };

  return (
    <aside className="auth-dot-surface hidden w-[310px] shrink-0 overflow-y-auto border-l-2 border-[#cfc5d8] bg-[#f3edf6] shadow-[-10px_0_30px_rgba(76,62,84,0.08)] xl:block">
      <div className="flex h-[88px] items-center justify-between border-b-2 border-[#d8cfdf] bg-[#ebe3f1]/90 px-5 backdrop-blur"><h2 className="text-sm font-extrabold text-[#263934]">Thông tin hội thoại</h2><button type="button" onClick={onClose} aria-label="Đóng thông tin" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/65 text-[#71817c] hover:bg-white"><X className="h-4 w-4" /></button></div>

      <div className="relative overflow-hidden border-b-2 border-[#ddd4e3] bg-[#f8f3f8]/75 px-5 py-7 text-center">
        <span className="pointer-events-none absolute left-1/2 top-5 h-32 w-32 -translate-x-1/2 rounded-full bg-[#eadcea]/55 blur-xl" />
        <span className="relative inline-block rounded-[30px] bg-white p-1.5 shadow-[0_18px_36px_rgba(82,67,89,0.13)]"><img src={conversation.avatar} alt={conversation.name} className="h-20 w-20 rounded-[25px] object-cover" referrerPolicy="no-referrer" /><i className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-[3px] border-white ${conversation.presence === 'online' ? 'bg-[#62ad8d]' : conversation.presence === 'busy' ? 'bg-[#d89b63]' : 'bg-[#b8c2be]'}`} /></span>
        <h3 className="mt-4 text-base font-extrabold text-[#20322d]">{conversation.name}</h3><p className="mt-1 text-xs font-semibold text-[#788781]">{conversation.role}</p>
        <div className="mt-5 grid grid-cols-3 gap-2.5" aria-label="Tùy chọn hội thoại">
          {[
            { icon: Search, label: 'Tìm tin nhắn', accent: 'border-[#a9cec3] text-[#39766c]', iconColor: 'bg-[#e2f1ec]' },
            { icon: BellOff, label: 'Tắt thông báo', accent: 'border-[#cec0d5] text-[#806d88]', iconColor: 'bg-[#f1e9f3]' },
            { icon: ShieldCheck, label: 'Quyền riêng tư', accent: 'border-[#e4c0b5] text-[#a05e4d]', iconColor: 'bg-[#fbe9e3]' },
          ].map(({ icon: Icon, label, accent, iconColor }) => (
            <button
              key={label}
              type="button"
              onClick={() => onPreviewFeature(`${label} sẽ hoàn thiện ở giai đoạn gắn API.`)}
              className={`group flex min-w-0 flex-col items-center rounded-[18px] border-2 bg-white/80 px-1.5 py-3 shadow-[0_8px_18px_rgba(73,84,80,0.06)] transition duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-[0_12px_24px_rgba(73,84,80,0.12)] ${accent}`}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-[13px] transition duration-200 group-hover:scale-105 ${iconColor}`}>
                <Icon className="h-[17px] w-[17px]" strokeWidth={2.2} />
              </span>
              <span className="mt-2 flex min-h-7 items-center justify-center text-center text-[10px] font-extrabold leading-[1.3]">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-b-2 border-[#ddd4e3] bg-white/45 p-5"><div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-extrabold text-[#30423d]">Tệp đã chia sẻ</h3><span className="text-[10px] font-bold text-[#3f7c72]">{conversation.sharedFiles.length} tệp</span></div>{conversation.sharedFiles.length ? <div className="space-y-2">{conversation.sharedFiles.map((file) => <button key={file.id} type="button" onClick={() => { void openAttachment(file.id); }} className="flex w-full items-center gap-3 rounded-2xl border border-[#e5ece9] p-3 text-left hover:bg-[#f7faf8]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f4e8f1] text-[#8b687f]"><FileText className="h-4 w-4" /></span><span className="min-w-0"><strong className="block truncate text-[11px] text-[#354741]">{file.name}</strong><small className="mt-0.5 block text-[9px] text-[#8a9893]">{file.meta}</small></span></button>)}</div> : <p className="rounded-2xl bg-[#f7f9f8] px-4 py-5 text-center text-[11px] text-[#87958f]">Chưa có tệp được chia sẻ.</p>}</div>

      <div className="border-t-2 border-[#ddd4e3] bg-[#fbf5f3] p-5">
        <button type="button" onClick={() => setBlockDialogOpen(true)} className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition ${blocked ? 'border-[#9fc1b7] bg-[#e5f1ed] text-[#356b61]' : 'border-[#dfb8ae] bg-white text-[#a05847] hover:bg-[#fff0ec]'}`}>
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${blocked ? 'bg-white/80' : 'bg-[#fae4de]'}`}>{blocked ? <UserCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}</span>
          <span className="min-w-0 flex-1"><strong className="block text-xs font-extrabold">{blocked ? `Bỏ chặn ${conversation.name}` : `Chặn ${conversation.name}`}</strong><small className="mt-1 block text-[9px] leading-4 opacity-75">{blocked ? 'Cho phép gửi tin nhắn mới trở lại.' : 'Ngăn tương tác trực tiếp mới từ người này.'}</small></span>
          <ChevronRight className="h-4 w-4 shrink-0" />
        </button>
      </div>

      {blockDialogOpen && <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[#18231f]/45 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" onMouseDown={() => !blockPending && setBlockDialogOpen(false)}><div className="w-full max-w-md overflow-hidden rounded-[28px] border-2 border-[#dfb8ae] bg-[#fffaf8] shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><div className="border-b-2 border-[#ead1ca] bg-gradient-to-r from-[#f9e5df] to-[#eee7f3] p-6"><span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ${blocked ? 'text-[#3f7c72]' : 'text-[#a65c49]'}`}>{blocked ? <UserCheck className="h-5 w-5" /> : <Ban className="h-5 w-5" />}</span><h3 className="mt-4 text-lg font-extrabold">{blocked ? `Bỏ chặn ${conversation.name}?` : `Chặn ${conversation.name}?`}</h3><p className="mt-2 text-xs leading-5 text-[#806860]">{blocked ? 'Hai bên có thể gửi tin nhắn mới sau khi bỏ chặn. Lịch sử cũ vẫn được giữ nguyên.' : 'Hai bên sẽ không thể gửi tin nhắn hoặc tệp mới. Lịch sử trò chuyện cũ không bị xóa.'}</p></div><div className="flex justify-end gap-3 p-5"><button type="button" disabled={blockPending} onClick={() => setBlockDialogOpen(false)} className="rounded-xl border-2 border-[#d7c5c0] bg-white px-4 py-2.5 text-xs font-extrabold text-[#6f5d58] disabled:opacity-50">Hủy</button><button type="button" disabled={blockPending} onClick={() => { void confirmBlockChange(); }} className={`rounded-xl px-4 py-2.5 text-xs font-extrabold text-white shadow-md disabled:opacity-50 ${blocked ? 'bg-[#3f7c72]' : 'bg-[#ad5847]'}`}>{blockPending ? 'Đang xử lý…' : blocked ? 'Xác nhận bỏ chặn' : 'Xác nhận chặn'}</button></div></div></div>}
    </aside>
  );
}
