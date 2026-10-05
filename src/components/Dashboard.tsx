import { useMemo, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import type { Contact, Screen } from '../types';
import ConversationList from './chat/ConversationList';
import ChatPanel from './chat/ChatPanel';
import ConversationInfo from './chat/ConversationInfo';
import { mockChatConversations } from './chat/mockChatData';
import type { ChatConversationItem, ChatReactionType } from './chat/types';

interface DashboardProps {
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  onStartCall: (contact: Contact) => void;
}

export default function Dashboard({ onNavigate, onStartCall }: DashboardProps) {
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

  const editMessage = (messageId: string, content: string) => {
    setConversations((current) => current.map((conversation) => conversation.id === activeId ? {
      ...conversation,
      lastMessage: conversation.messages.at(-1)?.id === messageId ? content : conversation.lastMessage,
      messages: conversation.messages.map((message) => message.id === messageId
        ? { ...message, content, edited: true }
        : message),
    } : conversation));
  };

  const deleteMessage = (messageId: string) => {
    setConversations((current) => current.map((conversation) => {
      if (conversation.id !== activeId) return conversation;
      const remainingMessages = conversation.messages.filter((message) => message.id !== messageId);
      const deletedAttachmentIds = new Set(
        conversation.messages.find((message) => message.id === messageId)?.attachments?.map((file) => file.id) ?? [],
      );
      const latestMessage = remainingMessages.at(-1);
      return {
        ...conversation,
        messages: remainingMessages,
        sharedFiles: conversation.sharedFiles.filter((file) => !deletedAttachmentIds.has(file.id)),
        lastMessage: latestMessage?.content || (latestMessage?.attachments?.length ? 'Đã gửi một tệp' : 'Chưa có tin nhắn'),
        time: latestMessage?.time ?? '',
      };
    }));
    showPreviewNotice('Đã xóa tin nhắn khỏi bản xem trước.');
  };

  const toggleReaction = (messageId: string, type: ChatReactionType) => {
    setConversations((current) => current.map((conversation) => conversation.id === activeId ? {
      ...conversation,
      messages: conversation.messages.map((message) => {
        if (message.id !== messageId) return message;
        const reactions = message.reactions ?? [];
        const mine = reactions.find((reaction) => reaction.reactedByMe);
        let next = reactions.map((reaction) => reaction.reactedByMe
          ? { ...reaction, count: reaction.count - 1, reactedByMe: false }
          : reaction).filter((reaction) => reaction.count > 0);
        if (mine?.type !== type) {
          const existing = next.find((reaction) => reaction.type === type);
          next = existing
            ? next.map((reaction) => reaction.type === type
              ? { ...reaction, count: reaction.count + 1, reactedByMe: true }
              : reaction)
            : [...next, { type, count: 1, reactedByMe: true }];
        }
        return { ...message, reactions: next };
      }),
    } : conversation));
  };

  const sendAttachment = (file: File, caption: string) => {
    const time = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date());
    const attachmentId = `local-file-${Date.now()}`;
    const attachment = {
      id: attachmentId,
      name: file.name,
      mimeType: file.type,
      size: file.size,
      url: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    };
    setConversations((current) => current.map((conversation) => conversation.id === activeId ? {
      ...conversation,
      lastMessage: caption || `Đã gửi ${file.name}`,
      time,
      messages: [...conversation.messages, {
        id: `local-message-${Date.now()}`,
        sender: 'me' as const,
        content: caption,
        time,
        status: 'sent' as const,
        attachments: [attachment],
      }],
      sharedFiles: [{ ...attachment, meta: `${formatFileSize(file.size)} · Vừa xong` }, ...conversation.sharedFiles],
    } : conversation));
  };

  const deleteAttachment = (messageId: string, attachmentId: string) => {
    setConversations((current) => current.map((conversation) => conversation.id === activeId ? {
      ...conversation,
      messages: conversation.messages.map((message) => message.id === messageId
        ? { ...message, attachments: message.attachments?.filter((file) => file.id !== attachmentId) }
        : message),
      sharedFiles: conversation.sharedFiles.filter((file) => file.id !== attachmentId),
    } : conversation));
    showPreviewNotice('Đã xóa tệp đính kèm khỏi bản xem trước.');
  };

  const loadOlderMessages = async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    setConversations((current) => current.map((conversation) => conversation.id === activeId ? {
      ...conversation,
      hasMoreMessages: false,
      messages: [
        { id: `older-${activeId}-1`, sender: 'other' as const, content: 'Chào bạn, mình vừa tham gia Signify.', time: '08:42' },
        { id: `older-${activeId}-2`, sender: 'me' as const, content: 'Rất vui được kết nối với bạn!', time: '08:45', status: 'seen' as const },
        ...conversation.messages,
      ],
    } : conversation));
  };

  const startVideoCall = () => {
    onStartCall({
      id: activeConversation.id,
      name: activeConversation.name,
      role: activeConversation.role,
      status: activeConversation.presence === 'unknown' ? 'offline' : activeConversation.presence,
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
        onOpenSettings={() => onNavigate('settings')}
        onOpenNotifications={() => onNavigate('notifications')}
      />
      <ChatPanel
        conversation={activeConversation}
        onSend={sendMessage}
        onEditMessage={editMessage}
        onDeleteMessage={deleteMessage}
        onToggleReaction={toggleReaction}
        onSendAttachment={sendAttachment}
        onDeleteAttachment={deleteAttachment}
        onLoadOlder={loadOlderMessages}
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

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}
