import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import type { CallableContact, Screen } from '../types';
import { getStoredUser } from '../services/apiClient';
import { conversationApi, type ConversationSummary } from '../services/conversationApi';
import ConversationList from './chat/ConversationList';
import ChatPanel from './chat/ChatPanel';
import ConversationInfo from './chat/ConversationInfo';
import type { ChatConversationItem, ChatReactionType } from './chat/types';

interface DashboardConversation extends ChatConversationItem {
  conversationId: number;
  userId: number | null;
  type: ConversationSummary['type'];
}

interface DashboardProps {
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  onStartCall: (contact: CallableContact) => void;
  callCreating: boolean;
  callError: string | null;
}

function mapConversation(conversation: ConversationSummary, currentUserId: number | undefined): DashboardConversation | null {
  if (!Number.isSafeInteger(conversation.conversationId) || conversation.conversationId <= 0) return null;
  const peer = typeof currentUserId === 'number' && Number.isSafeInteger(currentUserId) && currentUserId > 0
    ? conversation.participants?.find((participant) => participant.userId !== currentUserId)
    : undefined;
  const name = conversation.type === 'PRIVATE'
    ? peer?.fullName || conversation.name || `Cuộc trò chuyện #${conversation.conversationId}`
    : conversation.name || `Nhóm #${conversation.conversationId}`;
  const updatedAt = Number.isSafeInteger(conversation.updatedAt) && conversation.updatedAt > 0
    ? conversation.updatedAt : null;
  const date = updatedAt === null ? null : new Date(updatedAt < 1_000_000_000_000 ? updatedAt * 1000 : updatedAt);

  return {
    id: `conversation-${conversation.conversationId}`,
    conversationId: conversation.conversationId,
    userId: conversation.type === 'PRIVATE' && peer && Number.isSafeInteger(peer.userId) ? peer.userId : null,
    type: conversation.type,
    name,
    role: conversation.type === 'PRIVATE' ? 'Cuộc trò chuyện riêng' : 'Cuộc trò chuyện nhóm',
    avatar: peer?.avatar ?? '',
    presence: 'unknown',
    lastSeen: 'Chưa có dữ liệu trạng thái',
    lastMessage: 'Chưa có tin nhắn được tải',
    time: date && !Number.isNaN(date.getTime())
      ? date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '',
    unread: 0,
    messages: [],
    sharedFiles: [],
  };
}

export default function Dashboard({ onNavigate, onStartCall, callCreating, callError }: DashboardProps) {
  const [conversations, setConversations] = useState<DashboardConversation[]>([]);
  const [activeId, setActiveId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [infoOpen, setInfoOpen] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [conversationsError, setConversationsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    conversationApi.list()
      .then((items) => {
        if (!active) return;
        const currentUserId = getStoredUser()?.userId;
        const mapped = items
          .map((item) => mapConversation(item, currentUserId))
          .filter((item): item is DashboardConversation => item !== null);
        setConversations(mapped);
        setActiveId(mapped[0]?.id ?? '');
        setConversationsError(null);
      })
      .catch((error: unknown) => {
        if (active) setConversationsError(error instanceof Error ? error.message : 'Không thể tải cuộc trò chuyện.');
      })
      .finally(() => {
        if (active) setLoadingConversations(false);
      });
    return () => { active = false; };
  }, []);

  const activeConversation = conversations.find((item) => item.id === activeId);
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
    if (!activeConversation) {
      setNotice('Chọn một cuộc trò chuyện trước khi gọi.');
      return;
    }
    if (activeConversation.type !== 'PRIVATE' || !Number.isSafeInteger(activeConversation.userId)
      || activeConversation.userId === null || !Number.isSafeInteger(activeConversation.conversationId)
      || activeConversation.conversationId <= 0) {
      setNotice('Chỉ có thể gọi từ cuộc trò chuyện riêng hợp lệ.');
      return;
    }
    onStartCall({
      id: String(activeConversation.userId),
      userId: activeConversation.userId,
      conversationId: activeConversation.conversationId,
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
      {activeConversation ? (
        <>
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
            videoCallPending={callCreating}
            onToggleInfo={() => setInfoOpen((value) => !value)}
            onPreviewFeature={showPreviewNotice}
          />
          <ConversationInfo conversation={activeConversation} open={infoOpen} onClose={() => setInfoOpen(false)} onPreviewFeature={showPreviewNotice} />
        </>
      ) : (
        <section className="flex min-w-0 flex-1 items-center justify-center bg-[#f7f5f9] px-8 text-center">
          <div>
            <h2 className="text-lg font-extrabold text-[#263934]">{loadingConversations ? 'Đang tải cuộc trò chuyện…' : 'Chưa có cuộc trò chuyện'}</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[#71817c]">{conversationsError || (loadingConversations ? 'Đang kết nối với danh sách conversation của bạn.' : 'Các cuộc trò chuyện sẽ xuất hiện tại đây khi có dữ liệu từ máy chủ.')}</p>
          </div>
        </section>
      )}

      {(conversationsError || callError) && (
        <div role="alert" className="absolute bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-800 shadow-xl">
          {callError || `Không thể tải cuộc trò chuyện: ${conversationsError}`}
        </div>
      )}

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
