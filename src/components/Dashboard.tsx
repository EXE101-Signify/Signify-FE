import { useMemo, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import type { Contact, Screen } from '../types';
import ConversationList from './chat/ConversationList';
import ChatPanel from './chat/ChatPanel';
import ConversationInfo from './chat/ConversationInfo';
import { mockChatConversations } from './chat/mockChatData';
import type { ChatConversationItem } from './chat/types';

interface DashboardProps {
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  onStartCall: (contact: Contact) => void;
}

export default function Dashboard({ onStartCall }: DashboardProps) {
  const [conversations, setConversations] = useState<ChatConversationItem[]>(mockChatConversations);
  const [activeId, setActiveId] = useState(mockChatConversations[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [infoOpen, setInfoOpen] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const activeConversation = conversations.find((item) => item.id === activeId) ?? conversations[0];
  const visibleConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const matchesQuery = !query || conversation.name.toLowerCase().includes(query) || conversation.role.toLowerCase().includes(query) || conversation.lastMessage.toLowerCase().includes(query);
      return matchesQuery && (!unreadOnly || conversation.unread > 0);
    });
  }, [conversations, searchQuery, unreadOnly]);

  const selectConversation = (id: string) => {
    setActiveId(id);
    setInfoOpen(true);
    setConversations((current) => current.map((conversation) => conversation.id === id ? { ...conversation, unread: 0 } : conversation));
  };

  const sendMessage = (content: string) => {
    const time = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date());
    setConversations((current) => current.map((conversation) => conversation.id === activeId ? {
      ...conversation,
      lastMessage: content,
      time,
      messages: [...conversation.messages, { id: `local-${Date.now()}`, sender: 'me', content, time, status: 'sent' }],
    } : conversation));
  };

  const startVideoCall = () => {
    onStartCall({
      id: activeConversation.id,
      name: activeConversation.name,
      role: activeConversation.role,
      status: activeConversation.presence,
      avatar: activeConversation.avatar,
      lastCall: activeConversation.lastSeen,
    });
  };

  const showPreviewNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 3200);
  };

  return (
    <main className="relative flex h-screen min-h-[680px] overflow-hidden bg-[#f7f5f9] text-[#1f2d2a]">
      <ConversationList
        conversations={visibleConversations}
        activeId={activeId}
        searchQuery={searchQuery}
        unreadOnly={unreadOnly}
        onSearchChange={setSearchQuery}
        onUnreadOnlyChange={setUnreadOnly}
        onSelect={selectConversation}
      />
      <ChatPanel
        conversation={activeConversation}
        onSend={sendMessage}
        onVideoCall={startVideoCall}
        onToggleInfo={() => setInfoOpen((value) => !value)}
        onPreviewFeature={showPreviewNotice}
      />
      <ConversationInfo conversation={activeConversation} open={infoOpen} onClose={() => setInfoOpen(false)} onPreviewFeature={showPreviewNotice} />

      {notice && (
        <div role="status" className="absolute bottom-5 left-1/2 z-50 flex max-w-lg -translate-x-1/2 items-start gap-3 rounded-2xl border border-[#cfe0da] bg-white px-4 py-3 text-xs font-semibold text-[#40564f] shadow-[0_18px_45px_rgba(45,72,64,0.18)]">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#3f7c72]" />
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Đóng thông báo" className="ml-2 text-[#87958f]"><X className="h-4 w-4" /></button>
        </div>
      )}
    </main>
  );
}
