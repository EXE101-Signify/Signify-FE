import { CheckCheck, MessageSquarePlus, Pin, Search, SlidersHorizontal } from 'lucide-react';
import type { ChatConversationItem } from './types';

interface ConversationListProps {
  conversations: ChatConversationItem[];
  activeId: string;
  searchQuery: string;
  unreadOnly: boolean;
  onSearchChange: (value: string) => void;
  onUnreadOnlyChange: (value: boolean) => void;
  onSelect: (id: string) => void;
}

export default function ConversationList({ conversations, activeId, searchQuery, unreadOnly, onSearchChange, onUnreadOnlyChange, onSelect }: ConversationListProps) {
  return (
    <section className="relative z-20 flex w-[365px] shrink-0 flex-col border-r-2 border-[#b8cec7] bg-[#f2eff6] shadow-[12px_0_34px_rgba(57,86,78,0.11)]">
      <header className="auth-dot-surface relative overflow-hidden border-b-2 border-[#cadbd5] bg-gradient-to-br from-[#dfede8] via-[#f0edf5] to-[#f3dcd4] px-6 pb-5 pt-6">
        <span className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#d2c5e3]/70" />
        <div className="flex items-center justify-between">
          <div className="relative">
            <img src="/signify-logo-transparent.png" alt="Signify" className="h-9 w-auto object-contain object-left" />
            <h1 className="mt-1 text-[27px] font-extrabold tracking-[-0.035em] text-[#21322e]">Tin nhắn</h1>
          </div>
          <button type="button" title="Tạo hội thoại (chờ API tìm kiếm người dùng)" aria-label="Tạo hội thoại" className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f2d8cf] text-[#9a5f4d] shadow-[0_10px_24px_rgba(176,105,82,0.12)] transition hover:-translate-y-0.5 hover:bg-[#efcfc3]"><MessageSquarePlus className="h-5 w-5" /></button>
        </div>

        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#82918c]" />
          <input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Tìm cuộc trò chuyện" className="w-full rounded-[18px] border border-[#c8d8d3] bg-white/90 py-3.5 pl-10 pr-10 text-xs font-semibold text-[#263934] shadow-[0_10px_28px_rgba(58,79,72,0.11)] outline-none transition focus:border-[#6e9f94] focus:bg-white focus:ring-4 focus:ring-[#6e9f94]/15" />
          <SlidersHorizontal className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#82918c]" />
        </div>

        <div className="mt-4 flex gap-2 text-[11px] font-bold">
          <button type="button" onClick={() => onUnreadOnlyChange(false)} className={`rounded-full border px-3.5 py-1.5 transition ${!unreadOnly ? 'border-[#3f7c72] bg-[#3f7c72] text-white shadow-md shadow-[#3f7c72]/20' : 'border-[#76a397] bg-white/75 text-[#45675f] hover:border-[#3f7c72] hover:bg-white'}`}>Tất cả</button>
          <button type="button" onClick={() => onUnreadOnlyChange(true)} className={`rounded-full border px-3.5 py-1.5 transition ${unreadOnly ? 'border-[#3f7c72] bg-[#3f7c72] text-white shadow-md shadow-[#3f7c72]/20' : 'border-[#76a397] bg-white/75 text-[#45675f] hover:border-[#3f7c72] hover:bg-white'}`}>Chưa đọc</button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-[#f4f1f7] to-[#edf5f2] p-3.5">
        {conversations.length ? conversations.map((conversation) => {
          const active = conversation.id === activeId;
          return (
            <button key={conversation.id} type="button" onClick={() => onSelect(conversation.id)} className={`relative mb-2 flex w-full items-center gap-3 overflow-hidden rounded-[20px] border px-3.5 py-3.5 text-left transition ${active ? 'border-[#a8c9bf] bg-[#e1efea] shadow-[0_12px_30px_rgba(63,106,94,0.15)]' : 'border-white/50 bg-white/35 hover:border-[#d4dfdb] hover:bg-white/80'}`}>
              {active && <span className="absolute inset-y-2.5 left-0 w-1.5 rounded-r-full bg-[#c5745b]" />}
              <span className="relative shrink-0"><img src={conversation.avatar} alt="" className="h-12 w-12 rounded-2xl object-cover" referrerPolicy="no-referrer" /><i className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${conversation.presence === 'online' ? 'bg-[#62ad8d]' : conversation.presence === 'busy' ? 'bg-[#d89b63]' : 'bg-[#b8c2be]'}`} /></span>
              <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><strong className="truncate text-sm text-[#23342f]">{conversation.name}</strong><small className={`shrink-0 text-[10px] ${conversation.unread ? 'font-bold text-[#3f7c72]' : 'text-[#96a29e]'}`}>{conversation.time}</small></span><span className="mt-1 flex items-center gap-1.5"><span className={`truncate text-xs ${conversation.unread ? 'font-bold text-[#40534d]' : 'text-[#7a8984]'}`}>{conversation.lastMessage}</span>{conversation.pinned && <Pin className="h-3 w-3 shrink-0 rotate-45 text-[#869690]" />}</span></span>
              {conversation.unread > 0 ? <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#c77b64] px-1.5 text-[10px] font-extrabold text-white">{conversation.unread}</span> : <CheckCheck className="h-3.5 w-3.5 shrink-0 text-[#7ba99e]" />}
            </button>
          );
        }) : <div className="px-5 py-16 text-center"><p className="text-sm font-bold text-[#536660]">Không tìm thấy hội thoại</p><p className="mt-2 text-xs leading-5 text-[#8a9893]">Thử tìm bằng tên hoặc xem lại bộ lọc.</p></div>}
      </div>
    </section>
  );
}
