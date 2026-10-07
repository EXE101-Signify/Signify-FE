import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import type { CallableContact, Screen } from '../types';
import { getStoredUser } from '../services/apiClient';
import {
  conversationApi,
  type ChatMessageResponse,
  type ChatRealtimeEvent,
  type ConversationSummary,
  type MessageAttachment,
  type ReactionSummaryResponse,
} from '../services/conversationApi';
import { publishToStomp, subscribeToStomp } from '../services/stompConnection';
import { userBlockApi } from '../services/userBlockApi';
import ConversationList from './chat/ConversationList';
import ChatPanel from './chat/ChatPanel';
import ConversationInfo from './chat/ConversationInfo';
import type {
  ChatAttachmentItem,
  ChatConversationItem,
  ChatMessageItem,
  ChatReactionItem,
  ChatReactionType,
} from './chat/types';

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

function epoch(value: number | null | undefined): number | null {
  if (!value || !Number.isFinite(value)) return null;
  return value < 1_000_000_000_000 ? value * 1000 : value;
}

function formatTime(value: number | null | undefined): string {
  const timestamp = epoch(value);
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatLastSeen(value: number | null | undefined): string {
  const timestamp = epoch(value);
  if (!timestamp) return 'Không hoạt động gần đây';
  return `Hoạt động lúc ${new Date(timestamp).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })}`;
}

function messagePreview(content: string | null | undefined, messageType?: string | null): string {
  return content?.trim() || (messageType === 'FILE' ? 'Đã gửi một tệp' : 'Chưa có tin nhắn');
}

function mapConversation(conversation: ConversationSummary, currentUserId: number | undefined): DashboardConversation | null {
  if (!Number.isSafeInteger(conversation.conversationId) || conversation.conversationId <= 0) return null;
  const peer = typeof currentUserId === 'number' && Number.isSafeInteger(currentUserId) && currentUserId > 0
    ? conversation.participants?.find((participant) => participant.userId !== currentUserId)
    : undefined;
  const name = conversation.type === 'PRIVATE'
    ? peer?.fullName || conversation.name || `Cuộc trò chuyện #${conversation.conversationId}`
    : conversation.name || `Nhóm #${conversation.conversationId}`;

  return {
    id: `conversation-${conversation.conversationId}`,
    conversationId: conversation.conversationId,
    userId: conversation.type === 'PRIVATE' && peer && Number.isSafeInteger(peer.userId) ? peer.userId : null,
    type: conversation.type,
    name,
    role: conversation.type === 'PRIVATE' ? 'Cuộc trò chuyện riêng' : 'Cuộc trò chuyện nhóm',
    avatar: peer?.avatar ?? '',
    presence: 'unknown',
    lastSeen: 'Đang tải trạng thái…',
    lastMessage: messagePreview(conversation.lastMessage?.content, conversation.lastMessage?.messageType),
    time: formatTime(conversation.lastMessage?.createdAt ?? conversation.updatedAt),
    unread: 0,
    messages: [],
    sharedFiles: [],
    messagesLoaded: false,
    loadingMessages: false,
    hasMoreMessages: false,
    nextMessageCursor: null,
  };
}

function mapAttachment(attachment: MessageAttachment, url?: string): ChatAttachmentItem {
  return {
    id: String(attachment.attachmentId),
    name: attachment.fileName,
    mimeType: attachment.mimeType,
    size: attachment.fileSize,
    createdAt: epoch(attachment.createdAt) ?? undefined,
    url,
  };
}

function mapMessage(message: ChatMessageResponse, currentUserId: number | undefined): ChatMessageItem {
  return {
    id: String(message.messageId),
    sender: message.senderId === currentUserId ? 'me' : 'other',
    content: message.content ?? '',
    time: formatTime(message.createdAt),
    createdAt: epoch(message.createdAt) ?? undefined,
    status: message.senderId === currentUserId ? 'sent' : undefined,
    edited: Boolean(message.editedAt),
    attachments: message.attachments?.map((attachment) => mapAttachment(attachment)) ?? [],
  };
}

function mapReactions(summary: ReactionSummaryResponse, currentUserId: number | undefined): ChatReactionItem[] {
  return Object.entries(summary.counts)
    .filter((entry): entry is [ChatReactionType, number] => Number(entry[1]) > 0)
    .map(([type, count]) => ({
      type,
      count: Number(count),
      reactedByMe: summary.reactions.some((reaction) => reaction.userId === currentUserId && reaction.reaction === type),
    }));
}

function sharedFiles(messages: ChatMessageItem[]): DashboardConversation['sharedFiles'] {
  return messages
    .flatMap((message) => message.attachments ?? [])
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    .map((file) => ({
      ...file,
      meta: `${formatFileSize(file.size)}${file.createdAt ? ` · ${new Date(file.createdAt).toLocaleDateString('vi-VN')}` : ''}`,
    }));
}

function sortMessages(messages: ChatMessageItem[]): ChatMessageItem[] {
  return [...messages].sort((a, b) => (a.createdAt ?? Number(a.id)) - (b.createdAt ?? Number(b.id)));
}

async function enrichMessages(
  conversationId: number,
  messages: ChatMessageResponse[],
  currentUserId: number | undefined,
): Promise<ChatMessageItem[]> {
  return Promise.all(messages.map(async (message) => {
    const item = mapMessage(message, currentUserId);
    const [reactionSummary, attachments] = await Promise.all([
      conversationApi.reactions(conversationId, message.messageId).catch(() => null),
      Promise.all((message.attachments ?? []).map(async (attachment) => {
        const detail = await conversationApi.attachment(attachment.attachmentId).catch(() => null);
        return mapAttachment(attachment, detail?.url);
      })),
    ]);
    return {
      ...item,
      reactions: reactionSummary ? mapReactions(reactionSummary, currentUserId) : [],
      attachments,
    };
  }));
}

function validId(value: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error('ID dữ liệu chat không hợp lệ.');
  return parsed;
}

export default function Dashboard({ onNavigate, onStartCall, callCreating, callError }: DashboardProps) {
  const currentUserId = getStoredUser()?.userId;
  const [conversations, setConversations] = useState<DashboardConversation[]>([]);
  const [activeId, setActiveId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [infoOpen, setInfoOpen] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const [blockedUserIds, setBlockedUserIds] = useState<Set<number>>(new Set());
  const activeIdRef = useRef(activeId);
  const seenEventIds = useRef(new Set<string>());

  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 3200);
  }, []);

  const updateConversation = useCallback((conversationId: number, update: (item: DashboardConversation) => DashboardConversation) => {
    setConversations((current) => current.map((item) => item.conversationId === conversationId ? update(item) : item));
  }, []);

  const upsertMessage = useCallback((conversationId: number, message: ChatMessageItem) => {
    updateConversation(conversationId, (conversation) => {
      const exists = conversation.messages.some((item) => item.id === message.id);
      const messages = sortMessages(exists
        ? conversation.messages.map((item) => item.id === message.id ? { ...item, ...message } : item)
        : [...conversation.messages, message]);
      return {
        ...conversation,
        messages,
        sharedFiles: sharedFiles(messages),
        lastMessage: messagePreview(message.content, message.attachments?.length ? 'FILE' : 'TEXT'),
        time: message.time,
      };
    });
  }, [updateConversation]);

  useEffect(() => {
    let active = true;
    Promise.all([conversationApi.list(), userBlockApi.list().catch(() => [])])
      .then(async ([items, blocked]) => {
        if (!active) return;
        const mapped = items
          .map((item) => mapConversation(item, currentUserId))
          .filter((item): item is DashboardConversation => item !== null);
        setConversations(mapped);
        setActiveId(mapped[0]?.id ?? '');
        setBlockedUserIds(new Set(blocked.map((item) => item.userId)));
        setConversationsError(null);

        const metadata = await Promise.all(mapped.map(async (item) => {
          if (item.type !== 'PRIVATE') return { id: item.conversationId };
          const [unread, presence] = await Promise.all([
            conversationApi.unreadCount(item.conversationId).catch(() => null),
            conversationApi.presence(item.conversationId).catch(() => null),
          ]);
          return { id: item.conversationId, unread, presence };
        }));
        if (!active) return;
        setConversations((current) => current.map((item) => {
          const data = metadata.find((entry) => entry.id === item.conversationId);
          if (!data || !('presence' in data)) return item;
          const presence = data.presence;
          return {
            ...item,
            unread: Number(data.unread?.unreadCount ?? item.unread),
            presence: presence?.status === 'ONLINE' ? 'online' : presence?.status === 'OFFLINE' ? 'offline' : 'unknown',
            lastSeen: presence?.status === 'ONLINE' ? 'Đang hoạt động' : formatLastSeen(presence?.lastSeenAt),
          };
        }));
      })
      .catch((error: unknown) => {
        if (active) setConversationsError(error instanceof Error ? error.message : 'Không thể tải cuộc trò chuyện.');
      })
      .finally(() => {
        if (active) setLoadingConversations(false);
      });
    return () => { active = false; };
  }, [currentUserId]);

  const activeConversation = conversations.find((item) => item.id === activeId);

  useEffect(() => {
    if (!activeConversation || activeConversation.type !== 'PRIVATE'
      || activeConversation.messagesLoaded || activeConversation.loadingMessages) return;
    let active = true;
    const conversationId = activeConversation.conversationId;
    updateConversation(conversationId, (item) => ({ ...item, loadingMessages: true }));
    conversationApi.messages(conversationId)
      .then(async (page) => ({ page, messages: await enrichMessages(conversationId, page.messages, currentUserId) }))
      .then(({ page, messages }) => {
        if (!active) return;
        updateConversation(conversationId, (item) => {
          const loadedIds = new Set(messages.map((message) => message.id));
          const merged = sortMessages([
            ...messages,
            ...item.messages.filter((message) => !loadedIds.has(message.id)),
          ]);
          return {
            ...item,
            messages: merged,
            sharedFiles: sharedFiles(merged),
            messagesLoaded: true,
            loadingMessages: false,
            hasMoreMessages: page.hasMore,
            nextMessageCursor: page.nextCursor,
            unread: 0,
          };
        });
        const ordered = sortMessages(messages);
        const latest = ordered.at(-1);
        if (latest) void conversationApi.markRead(conversationId, validId(latest.id)).catch(() => {});
      })
      .catch((error: unknown) => {
        if (!active) return;
        updateConversation(conversationId, (item) => ({ ...item, messagesLoaded: true, loadingMessages: false }));
        showNotice(error instanceof Error ? error.message : 'Không thể tải lịch sử tin nhắn.');
      });
    return () => { active = false; };
  }, [activeConversation?.conversationId, currentUserId, showNotice, updateConversation]);

  const realtimeConversationKey = useMemo(() => conversations
    .filter((item) => item.type === 'PRIVATE')
    .map((item) => item.conversationId)
    .sort((a, b) => a - b)
    .join(','), [conversations]);

  useEffect(() => {
    if (!realtimeConversationKey) return;
    const ids = realtimeConversationKey.split(',').map(Number).filter(Number.isSafeInteger);
    const stops = ids.map((conversationId) => subscribeToStomp(
      `/user/queue/conversations/${conversationId}`,
      (body) => {
        let event: ChatRealtimeEvent;
        try { event = JSON.parse(body) as ChatRealtimeEvent; } catch { return; }
        if (!event.eventId || seenEventIds.current.has(event.eventId)) return;
        seenEventIds.current.add(event.eventId);
        if (seenEventIds.current.size > 500) {
          seenEventIds.current = new Set([...seenEventIds.current].slice(-250));
        }

        if (event.type === 'MESSAGE_CREATED' && event.messageId && event.senderId && event.createdAt) {
          const apply = async () => {
            let attachments: ChatAttachmentItem[] = [];
            if (event.attachmentId) {
              const detail = await conversationApi.attachment(event.attachmentId).catch(() => null);
              if (detail) attachments = [mapAttachment(detail, detail.url)];
            }
            const message = mapMessage({
              messageId: event.messageId!,
              conversationId,
              senderId: event.senderId!,
              content: event.content ?? '',
              messageType: event.messageType === 'FILE' ? 'FILE' : 'TEXT',
              createdAt: event.createdAt!,
              attachments: attachments.map((file) => ({
                attachmentId: validId(file.id), fileName: file.name, mimeType: file.mimeType,
                fileSize: file.size, createdAt: file.createdAt ?? event.createdAt!,
              })),
            }, currentUserId);
            message.attachments = attachments;
            upsertMessage(conversationId, message);
            const isActive = activeIdRef.current === `conversation-${conversationId}`;
            if (event.senderId !== currentUserId && isActive) {
              void conversationApi.markRead(conversationId, event.messageId!).catch(() => {});
            } else if (event.senderId !== currentUserId) {
              updateConversation(conversationId, (item) => ({ ...item, unread: item.unread + 1 }));
            }
          };
          void apply();
          return;
        }

        if (event.type === 'MESSAGE_UPDATED' && event.messageId) {
          updateConversation(conversationId, (item) => {
            const messages = item.messages.map((message) => message.id === String(event.messageId)
              ? { ...message, content: event.content ?? '', edited: true, time: formatTime(event.createdAt) || message.time }
              : message);
            return { ...item, messages, lastMessage: item.messages.at(-1)?.id === String(event.messageId) ? event.content ?? '' : item.lastMessage };
          });
          return;
        }

        if (event.type === 'MESSAGE_DELETED' && event.messageId) {
          updateConversation(conversationId, (item) => {
            const messages = item.messages.filter((message) => message.id !== String(event.messageId));
            const latest = messages.at(-1);
            return {
              ...item,
              messages,
              sharedFiles: sharedFiles(messages),
              lastMessage: latest ? messagePreview(latest.content, latest.attachments?.length ? 'FILE' : 'TEXT') : 'Chưa có tin nhắn',
              time: latest?.time ?? '',
            };
          });
          return;
        }

        if (event.type === 'TYPING_START' || event.type === 'TYPING_STOP') {
          if (event.senderId !== currentUserId) {
            updateConversation(conversationId, (item) => ({ ...item, typing: event.type === 'TYPING_START' }));
          }
          return;
        }

        if (event.type === 'READ_RECEIPT' && event.userId !== currentUserId && event.lastReadMessageId) {
          updateConversation(conversationId, (item) => ({
            ...item,
            messages: item.messages.map((message) => message.sender === 'me' && validId(message.id) <= event.lastReadMessageId!
              ? { ...message, status: 'seen' }
              : message),
          }));
          return;
        }

        if (event.type === 'PRESENCE_ONLINE' || event.type === 'PRESENCE_OFFLINE') {
          updateConversation(conversationId, (item) => ({
            ...item,
            presence: event.type === 'PRESENCE_ONLINE' ? 'online' : 'offline',
            lastSeen: event.type === 'PRESENCE_ONLINE' ? 'Đang hoạt động' : formatLastSeen(event.timestamp),
          }));
        }
      },
    ));
    return () => stops.forEach((stop) => stop());
  }, [currentUserId, realtimeConversationKey, updateConversation, upsertMessage]);

  const visibleConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const matchesQuery = !query || conversation.name.toLowerCase().includes(query)
        || conversation.role.toLowerCase().includes(query)
        || conversation.lastMessage.toLowerCase().includes(query);
      return matchesQuery && (!unreadOnly || conversation.unread > 0);
    });
  }, [conversations, searchQuery, unreadOnly]);

  const selectConversation = (id: string) => {
    setActiveId(id);
    setInfoOpen(true);
    const selected = conversations.find((item) => item.id === id);
    if (selected) {
      updateConversation(selected.conversationId, (item) => ({ ...item, unread: 0 }));
      const latest = selected.messages.at(-1);
      if (latest) void conversationApi.markRead(selected.conversationId, validId(latest.id)).catch(() => {});
    }
  };

  const requireActivePrivateConversation = (): DashboardConversation => {
    const current = conversations.find((item) => item.id === activeId);
    if (!current || current.type !== 'PRIVATE') throw new Error('API tin nhắn hiện chỉ hỗ trợ hội thoại riêng.');
    return current;
  };

  const sendMessage = async (content: string) => {
    const current = requireActivePrivateConversation();
    const response = await conversationApi.sendMessage(current.conversationId, content);
    upsertMessage(current.conversationId, mapMessage(response, currentUserId));
  };

  const editMessage = async (messageId: string, content: string) => {
    const current = requireActivePrivateConversation();
    const response = await conversationApi.editMessage(current.conversationId, validId(messageId), content);
    upsertMessage(current.conversationId, { ...mapMessage(response, currentUserId), edited: true });
  };

  const deleteMessage = async (messageId: string) => {
    const current = requireActivePrivateConversation();
    await conversationApi.deleteMessage(current.conversationId, validId(messageId));
    updateConversation(current.conversationId, (item) => {
      const messages = item.messages.filter((message) => message.id !== messageId);
      const latest = messages.at(-1);
      return {
        ...item,
        messages,
        sharedFiles: sharedFiles(messages),
        lastMessage: latest ? messagePreview(latest.content, latest.attachments?.length ? 'FILE' : 'TEXT') : 'Chưa có tin nhắn',
        time: latest?.time ?? '',
      };
    });
    showNotice('Đã xóa tin nhắn.');
  };

  const toggleReaction = async (messageId: string, type: ChatReactionType) => {
    const current = requireActivePrivateConversation();
    const message = current.messages.find((item) => item.id === messageId);
    const reacted = message?.reactions?.some((reaction) => reaction.type === type && reaction.reactedByMe);
    const summary = reacted
      ? await conversationApi.removeReaction(current.conversationId, validId(messageId), type)
      : await conversationApi.setReaction(current.conversationId, validId(messageId), type);
    updateConversation(current.conversationId, (item) => ({
      ...item,
      messages: item.messages.map((entry) => entry.id === messageId
        ? { ...entry, reactions: mapReactions(summary, currentUserId) }
        : entry),
    }));
  };

  const sendAttachment = async (file: File, caption: string) => {
    const current = requireActivePrivateConversation();
    const response = await conversationApi.sendAttachment(current.conversationId, file, caption);
    const detail = await conversationApi.attachment(response.attachmentId).catch(() => null);
    const attachment: ChatAttachmentItem = {
      id: String(response.attachmentId),
      name: response.fileName,
      mimeType: response.mimeType,
      size: response.fileSize,
      createdAt: epoch(response.createdAt) ?? undefined,
      url: detail?.url,
    };
    const message = mapMessage({
      messageId: response.messageId,
      conversationId: response.conversationId,
      senderId: response.senderId,
      content: response.content,
      messageType: 'FILE',
      createdAt: response.createdAt,
    }, currentUserId);
    message.attachments = [attachment];
    upsertMessage(current.conversationId, message);
  };

  const deleteAttachment = async (messageId: string, attachmentId: string) => {
    const current = requireActivePrivateConversation();
    await conversationApi.deleteAttachment(validId(attachmentId));
    updateConversation(current.conversationId, (item) => {
      const messages = item.messages.map((message) => message.id === messageId
        ? { ...message, attachments: message.attachments?.filter((file) => file.id !== attachmentId) }
        : message);
      return { ...item, messages, sharedFiles: sharedFiles(messages) };
    });
    showNotice('Đã xóa tệp đính kèm.');
  };

  const loadOlderMessages = async () => {
    const current = requireActivePrivateConversation();
    if (!current.hasMoreMessages || !current.nextMessageCursor) return;
    const page = await conversationApi.messages(current.conversationId, current.nextMessageCursor);
    const older = await enrichMessages(current.conversationId, page.messages, currentUserId);
    updateConversation(current.conversationId, (item) => {
      const existingIds = new Set(item.messages.map((message) => message.id));
      const messages = sortMessages([...older.filter((message) => !existingIds.has(message.id)), ...item.messages]);
      return {
        ...item,
        messages,
        sharedFiles: sharedFiles(messages),
        hasMoreMessages: page.hasMore,
        nextMessageCursor: page.nextCursor,
      };
    });
  };

  const resolveAttachment = async (attachmentId: string): Promise<string> => {
    const detail = await conversationApi.attachment(validId(attachmentId));
    setConversations((current) => current.map((conversation) => {
      const messages = conversation.messages.map((message) => ({
        ...message,
        attachments: message.attachments?.map((attachment) => attachment.id === attachmentId
          ? { ...attachment, url: detail.url }
          : attachment),
      }));
      return { ...conversation, messages, sharedFiles: sharedFiles(messages) };
    }));
    return detail.url;
  };

  const typingConversationId = activeConversation?.type === 'PRIVATE' ? activeConversation.conversationId : null;
  const setTyping = useCallback((typing: boolean) => {
    if (!typingConversationId) return;
    publishToStomp(`/app/conversations/${typingConversationId}/typing`, {
      type: typing ? 'TYPING_START' : 'TYPING_STOP',
    });
  }, [typingConversationId]);

  const changeBlock = async () => {
    if (!activeConversation?.userId) throw new Error('Không xác định được người dùng trong cuộc trò chuyện.');
    const userId = activeConversation.userId;
    const blocked = blockedUserIds.has(userId);
    if (blocked) await userBlockApi.unblock(userId);
    else await userBlockApi.block(userId);
    setBlockedUserIds((current) => {
      const next = new Set(current);
      if (blocked) next.delete(userId); else next.add(userId);
      return next;
    });
    showNotice(blocked ? `Đã bỏ chặn ${activeConversation.name}.` : `Đã chặn ${activeConversation.name}.`);
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
            onResolveAttachment={resolveAttachment}
            onTypingChange={setTyping}
            onVideoCall={startVideoCall}
            videoCallPending={callCreating}
            onToggleInfo={() => setInfoOpen((value) => !value)}
            onPreviewFeature={showNotice}
          />
          <ConversationInfo
            conversation={activeConversation}
            open={infoOpen}
            blocked={activeConversation.userId ? blockedUserIds.has(activeConversation.userId) : false}
            onClose={() => setInfoOpen(false)}
            onBlockChange={changeBlock}
            onResolveAttachment={resolveAttachment}
            onPreviewFeature={showNotice}
          />
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
