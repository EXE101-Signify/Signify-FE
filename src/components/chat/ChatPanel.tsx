import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import {
  Check,
  Download,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  Languages,
  Mic,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Phone,
  Save,
  SendHorizontal,
  Smile,
  Sparkles,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import type {
  ChatAttachmentItem,
  ChatConversationItem,
  ChatMessageItem,
  ChatReactionType,
} from './types';

interface ChatPanelProps {
  conversation: ChatConversationItem;
  onSend: (content: string) => void;
  onEditMessage: (messageId: string, content: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onToggleReaction: (messageId: string, type: ChatReactionType) => void;
  onSendAttachment: (file: File, caption: string) => void;
  onDeleteAttachment: (messageId: string, attachmentId: string) => void;
  onLoadOlder: () => Promise<void>;
  onVideoCall: () => void;
  onToggleInfo: () => void;
  onPreviewFeature: (message: string) => void;
}

const REACTIONS: Array<{ type: ChatReactionType; emoji: string; label: string }> = [
  { type: 'LIKE', emoji: '👍', label: 'Thích' },
  { type: 'LOVE', emoji: '❤️', label: 'Yêu thích' },
  { type: 'HAHA', emoji: '😆', label: 'Haha' },
  { type: 'WOW', emoji: '😮', label: 'Wow' },
  { type: 'SAD', emoji: '😢', label: 'Buồn' },
  { type: 'ANGRY', emoji: '😠', label: 'Phẫn nộ' },
];

const FILE_LIMIT = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

function reactionEmoji(type: ChatReactionType) {
  return REACTIONS.find((reaction) => reaction.type === type)?.emoji ?? '👍';
}

export default function ChatPanel({
  conversation,
  onSend,
  onEditMessage,
  onDeleteMessage,
  onToggleReaction,
  onSendAttachment,
  onDeleteAttachment,
  onLoadOlder,
  onVideoCall,
  onToggleInfo,
  onPreviewFeature,
}: ChatPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [actionMessageId, setActionMessageId] = useState<string | null>(null);
  const [reactionMessageId, setReactionMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [deletingMessage, setDeletingMessage] = useState<ChatMessageItem | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<ChatAttachmentItem | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const loadOlder = async () => {
    setLoadingOlder(true);
    try { await onLoadOlder(); } finally { setLoadingOlder(false); }
  };

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const content = draft.trim();
    if (!content && !pendingFile) return;
    if (pendingFile) onSendAttachment(pendingFile, content);
    else onSend(content);
    setDraft('');
    setPendingFile(null);
    setShowEmoji(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      onPreviewFeature('Signify chỉ hỗ trợ JPG, PNG, WebP, GIF hoặc PDF.');
      event.target.value = '';
      return;
    }
    if (file.size > FILE_LIMIT) {
      onPreviewFeature('Tệp vượt quá giới hạn 5 MB của backend.');
      event.target.value = '';
      return;
    }
    setPendingFile(file);
  };

  const beginEdit = (message: ChatMessageItem) => {
    setEditingMessageId(message.id);
    setEditDraft(message.content);
    setActionMessageId(null);
  };

  const saveEdit = () => {
    const content = editDraft.trim();
    if (!editingMessageId || !content) return;
    onEditMessage(editingMessageId, content);
    setEditingMessageId(null);
    setEditDraft('');
  };

  const react = (messageId: string, type: ChatReactionType) => {
    onToggleReaction(messageId, type);
    setReactionMessageId(null);
  };

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-[#f8faf8]">
      <header className="flex h-[88px] shrink-0 items-center justify-between border-b-2 border-[#d1dfda] bg-[#f7fbf9]/95 px-6 shadow-[0_8px_24px_rgba(59,78,72,0.07)] backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative shrink-0"><img src={conversation.avatar} alt={conversation.name} className="h-12 w-12 rounded-2xl object-cover" referrerPolicy="no-referrer" /><i className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${conversation.presence === 'online' ? 'bg-[#62ad8d]' : conversation.presence === 'busy' ? 'bg-[#d89b63]' : 'bg-[#b8c2be]'}`} /></span>
          <span className="min-w-0"><strong className="block truncate text-base font-extrabold text-[#20322d]">{conversation.name}</strong><small className={`mt-0.5 block truncate text-xs font-semibold ${conversation.presence === 'online' ? 'text-[#438273]' : 'text-[#72827c]'}`}>{conversation.typing ? 'Đang nhập...' : conversation.presence === 'unknown' ? 'Không xác định trạng thái' : conversation.lastSeen}</small></span>
        </div>

        <div className="flex items-center gap-1.5 text-[#4e746c]">
          <button type="button" onClick={() => onPreviewFeature('Cuộc gọi thoại sẽ được nối khi backend call sẵn sàng.')} title="Gọi thoại" className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f4f7f5] transition hover:bg-[#e8f1ed]"><Phone className="h-[18px] w-[18px]" /></button>
          <button type="button" onClick={onVideoCall} title="Gọi video" className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e5f1ed] text-[#326b62] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#d6e8e2]"><Video className="h-[18px] w-[18px]" /></button>
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
          {conversation.hasMoreMessages && <div className="mb-6 flex justify-center"><button type="button" disabled={loadingOlder} onClick={loadOlder} className="flex items-center gap-2 rounded-full border-2 border-[#b8d0c8] bg-white/85 px-4 py-2 text-[10px] font-extrabold text-[#4b7067] shadow-sm transition hover:bg-white disabled:opacity-60">{loadingOlder && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}{loadingOlder ? 'Đang tải...' : 'Tải tin nhắn cũ hơn'}</button></div>}
          <div className="space-y-5">
            {conversation.messages.map((message) => {
              const mine = message.sender === 'me';
              const editing = editingMessageId === message.id;
              return (
                <div key={message.id} className={`group flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`relative flex max-w-[76%] flex-col ${mine ? 'items-end' : 'items-start'}`}>
                    <div className={`absolute top-1 z-20 flex items-center gap-1 opacity-0 transition group-hover:opacity-100 ${mine ? 'right-full mr-2' : 'left-full ml-2'}`}>
                      <button type="button" title="Bày tỏ cảm xúc" onClick={() => { setReactionMessageId(reactionMessageId === message.id ? null : message.id); setActionMessageId(null); }} className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#d9e4e0] bg-white text-[#64766f] shadow-md hover:bg-[#edf6f2]"><Smile className="h-3.5 w-3.5" /></button>
                      {mine && <button type="button" title="Thao tác tin nhắn" onClick={() => { setActionMessageId(actionMessageId === message.id ? null : message.id); setReactionMessageId(null); }} className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#d9e4e0] bg-white text-[#64766f] shadow-md hover:bg-[#edf6f2]"><MoreHorizontal className="h-4 w-4" /></button>}
                    </div>

                    {reactionMessageId === message.id && (
                      <div className={`absolute -top-12 z-30 flex gap-1 rounded-2xl border-2 border-[#d7e3df] bg-white p-1.5 shadow-[0_14px_35px_rgba(50,72,65,0.18)] ${mine ? 'right-0' : 'left-0'}`}>
                        {REACTIONS.map((reaction) => <button key={reaction.type} type="button" title={reaction.label} onClick={() => react(message.id, reaction.type)} className="flex h-8 w-8 items-center justify-center rounded-xl text-lg transition hover:-translate-y-1 hover:bg-[#edf6f2]">{reaction.emoji}</button>)}
                      </div>
                    )}

                    {actionMessageId === message.id && (
                      <div className="absolute right-full top-10 z-30 mr-2 w-36 overflow-hidden rounded-2xl border-2 border-[#d7e3df] bg-white p-1.5 text-xs font-bold text-[#4f655e] shadow-[0_14px_35px_rgba(50,72,65,0.18)]">
                        {message.content && <button type="button" onClick={() => beginEdit(message)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-[#edf6f2]"><Pencil className="h-3.5 w-3.5" />Chỉnh sửa</button>}
                        <button type="button" onClick={() => { setDeletingMessage(message); setActionMessageId(null); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[#a65343] hover:bg-[#fff0ec]"><Trash2 className="h-3.5 w-3.5" />Xóa tin nhắn</button>
                      </div>
                    )}

                    <div className={`w-full rounded-[22px] px-4 py-3 text-sm leading-6 ${mine ? 'rounded-br-md bg-[#3f7c72] text-white shadow-[0_10px_24px_rgba(63,124,114,0.18)]' : 'rounded-bl-md border border-white bg-white/95 text-[#2b3b37] shadow-[0_10px_26px_rgba(58,76,70,0.08)]'}`}>
                      {editing ? (
                        <div className="min-w-[280px]">
                          <textarea autoFocus rows={2} value={editDraft} onChange={(event) => setEditDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); saveEdit(); } }} className="w-full resize-none rounded-xl bg-white/95 px-3 py-2 text-sm leading-5 text-[#263934] outline-none ring-2 ring-white/35" />
                          <div className="mt-2 flex justify-end gap-2"><button type="button" onClick={() => setEditingMessageId(null)} className="rounded-lg bg-white/15 px-2.5 py-1 text-[10px] font-bold">Hủy</button><button type="button" disabled={!editDraft.trim()} onClick={saveEdit} className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[10px] font-bold text-[#32665e] disabled:opacity-50"><Save className="h-3 w-3" />Lưu</button></div>
                        </div>
                      ) : (
                        <>
                          {message.attachments?.map((attachment) => (
                            <div key={attachment.id} className={`mb-2 overflow-hidden rounded-2xl border ${mine ? 'border-white/25 bg-white/10' : 'border-[#dce7e3] bg-[#f6faf8]'}`}>
                              {attachment.mimeType.startsWith('image/') && attachment.url ? <button type="button" onClick={() => setPreviewAttachment(attachment)} className="block w-full"><img src={attachment.url} alt={attachment.name} className="max-h-52 w-full object-cover" /></button> : null}
                              <div className="flex items-center gap-3 p-3">
                                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${mine ? 'bg-white/15' : 'bg-[#e7f1ee] text-[#3f7c72]'}`}>{attachment.mimeType.startsWith('image/') ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}</span>
                                <button type="button" onClick={() => setPreviewAttachment(attachment)} className="min-w-0 flex-1 text-left"><strong className="block truncate text-[11px]">{attachment.name}</strong><small className={`block text-[9px] ${mine ? 'text-white/65' : 'text-[#81908b]'}`}>{formatFileSize(attachment.size)}</small></button>
                                <button type="button" onClick={() => setPreviewAttachment(attachment)} aria-label="Xem tệp"><Download className="h-4 w-4" /></button>
                                {mine && <button type="button" onClick={() => onDeleteAttachment(message.id, attachment.id)} aria-label="Xóa tệp"><Trash2 className="h-4 w-4" /></button>}
                              </div>
                            </div>
                          ))}
                          {message.content && <span>{message.content}</span>}
                        </>
                      )}
                    </div>
                    {message.translatedText && <div className="mt-1.5 flex items-center gap-1 rounded-xl bg-[#f5e9f2] px-2.5 py-1 text-[10px] font-semibold text-[#806176]"><Languages className="h-3 w-3" />{message.translatedText}</div>}
                    {!!message.reactions?.length && <div className={`-mt-1.5 flex flex-wrap gap-1 ${mine ? 'mr-2' : 'ml-2'}`}>{message.reactions.map((reaction) => <button key={reaction.type} type="button" onClick={() => react(message.id, reaction.type)} className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold shadow-sm ${reaction.reactedByMe ? 'border-[#72a397] bg-[#e1f0eb] text-[#315f57]' : 'border-[#dde6e3] bg-white text-[#63756f]'}`}><span>{reactionEmoji(reaction.type)}</span>{reaction.count}</button>)}</div>}
                    <span className="mt-1.5 flex items-center gap-1 px-1 text-[10px] text-[#86948f]">{message.time}{message.edited ? ' · Đã chỉnh sửa' : ''}{mine && message.status === 'seen' ? <><span>·</span><Check className="h-3 w-3" /><span>Đã xem</span></> : mine ? ' · Đã gửi' : ''}</span>
                  </div>
                </div>
              );
            })}
            {conversation.typing && <div className="flex justify-start"><div className="flex items-center gap-1 rounded-[20px] rounded-bl-md border border-white bg-white/95 px-4 py-3 shadow-[0_10px_26px_rgba(58,76,70,0.08)]"><span className="h-2 w-2 animate-bounce rounded-full bg-[#7fa69b] [animation-delay:-0.3s]" /><span className="h-2 w-2 animate-bounce rounded-full bg-[#9b87a5] [animation-delay:-0.15s]" /><span className="h-2 w-2 animate-bounce rounded-full bg-[#c58a76]" /><span className="ml-2 text-[10px] font-bold text-[#758680]">{conversation.name} đang nhập</span></div></div>}
          </div>
        </div>
      </div>

      <footer className="relative shrink-0 border-t-2 border-[#d1dfda] bg-[#eef6f2]/95 px-5 py-4 shadow-[0_-10px_30px_rgba(59,78,72,0.08)] backdrop-blur">
        {showEmoji && <div className="absolute bottom-[82px] left-16 flex gap-2 rounded-2xl border border-[#dfe8e4] bg-white p-3 shadow-xl">{['😊', '👍', '❤️', '👏', '✨'].map((emoji) => <button key={emoji} type="button" onClick={() => setDraft((value) => `${value}${emoji}`)} className="text-xl transition hover:scale-125">{emoji}</button>)}</div>}
        {pendingFile && <div className="mx-auto mb-3 flex max-w-3xl items-center gap-3 rounded-2xl border-2 border-[#c5d9d2] bg-white p-3 shadow-sm"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f1ee] text-[#3f7c72]">{pendingFile.type.startsWith('image/') ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}</span><span className="min-w-0 flex-1"><strong className="block truncate text-xs text-[#30423d]">{pendingFile.name}</strong><small className="text-[10px] text-[#81908b]">{formatFileSize(pendingFile.size)} · Sẵn sàng gửi</small></span><button type="button" onClick={() => { setPendingFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="flex h-8 w-8 items-center justify-center rounded-xl text-[#8b6b65] hover:bg-[#fff0ec]"><X className="h-4 w-4" /></button></div>}
        <form onSubmit={submit} className="mx-auto flex max-w-3xl items-end gap-2">
          <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.gif,.pdf" onChange={selectFile} className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} title="Đính kèm ảnh hoặc PDF" className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[#60756e] transition hover:bg-[#dfece7]"><Paperclip className="h-[18px] w-[18px]" /></button>
          <div className="flex min-w-0 flex-1 items-end rounded-[24px] border border-[#d8e4df] bg-[#f7faf8] px-3 shadow-inner shadow-[#4e756d]/[0.02] focus-within:border-[#77a89d] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#77a89d]/10">
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleKeyDown} rows={1} maxLength={5000} placeholder={pendingFile ? 'Thêm chú thích cho tệp...' : `Nhắn tin cho ${conversation.name}`} className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-1 py-3 text-sm text-[#263934] outline-none" />
            <button type="button" onClick={() => setShowEmoji((value) => !value)} title="Biểu cảm" className="mb-1 flex h-9 w-9 items-center justify-center text-[#71847d]"><Smile className="h-[18px] w-[18px]" /></button>
            <button type="button" onClick={() => onPreviewFeature('Backend hiện chưa có API gửi ghi âm.')} title="Ghi âm" className="mb-1 flex h-9 w-9 items-center justify-center text-[#71847d]"><Mic className="h-[18px] w-[18px]" /></button>
          </div>
          <button type="submit" disabled={!draft.trim() && !pendingFile} title="Gửi tin nhắn" className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#3f7c72] text-white shadow-lg shadow-[#3f7c72]/20 transition hover:bg-[#32665e] disabled:cursor-not-allowed disabled:opacity-40"><SendHorizontal className="h-[18px] w-[18px]" /></button>
        </form>
      </footer>

      {deletingMessage && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#24332f]/35 p-4 backdrop-blur-sm" onMouseDown={() => setDeletingMessage(null)}><div className="w-full max-w-sm overflow-hidden rounded-[26px] border-2 border-[#e0b8ae] bg-[#fffaf8] shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><div className="border-b-2 border-[#ead1ca] bg-[#f9e5df] p-5"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#ad5847]"><Trash2 className="h-5 w-5" /></span><h3 className="mt-4 text-lg font-extrabold text-[#633c34]">Xóa tin nhắn này?</h3><p className="mt-1 text-xs leading-5 text-[#8a655d]">Tin nhắn và các tệp đi kèm sẽ biến mất khỏi cuộc trò chuyện.</p></div><div className="flex justify-end gap-2 p-4"><button type="button" onClick={() => setDeletingMessage(null)} className="rounded-xl border-2 border-[#d9c8c3] bg-white px-4 py-2.5 text-xs font-bold text-[#6d5d59]">Giữ lại</button><button type="button" onClick={() => { onDeleteMessage(deletingMessage.id); setDeletingMessage(null); }} className="rounded-xl bg-[#ad5847] px-4 py-2.5 text-xs font-bold text-white shadow-md">Xóa tin nhắn</button></div></div></div>}

      {previewAttachment && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#17231f]/70 p-5 backdrop-blur-sm" onMouseDown={() => setPreviewAttachment(null)}><div className="w-full max-w-2xl overflow-hidden rounded-[28px] border-2 border-white/60 bg-[#f8fbfa] shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b-2 border-[#d2e0db] bg-white px-5 py-4"><div className="min-w-0"><h3 className="truncate text-sm font-extrabold text-[#263934]">{previewAttachment.name}</h3><p className="mt-0.5 text-[10px] text-[#7c8d87]">{formatFileSize(previewAttachment.size)}</p></div><button type="button" onClick={() => setPreviewAttachment(null)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf4f1] text-[#526a63]"><X className="h-4 w-4" /></button></div><div className="flex min-h-72 items-center justify-center bg-[#eef3f1] p-6">{previewAttachment.mimeType.startsWith('image/') && previewAttachment.url ? <img src={previewAttachment.url} alt={previewAttachment.name} className="max-h-[65vh] max-w-full rounded-2xl object-contain shadow-lg" /> : <div className="text-center"><span className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#f2e8f4] text-[#786184]"><FileText className="h-9 w-9" /></span><p className="mt-4 text-sm font-bold text-[#41554f]">Bản xem trước PDF</p><p className="mt-1 text-xs text-[#7e8d88]">Nội dung thật sẽ được tải bằng signed URL khi gắn API.</p></div>}</div></div></div>}
    </section>
  );
}
