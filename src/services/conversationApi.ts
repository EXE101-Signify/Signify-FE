import { apiFetch } from './apiClient';

export type ConversationType = 'PRIVATE' | 'GROUP';
export type MessageType = 'TEXT' | 'FILE';
export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

export interface ConversationParticipant {
  userId: number;
  fullName: string;
  avatar: string | null;
  joinedAt: number | null;
}

export interface LastMessageResponse {
  messageId: number;
  senderId: number;
  content: string | null;
  messageType: MessageType;
  createdAt: number;
}

export interface ConversationSummary {
  conversationId: number;
  type: ConversationType;
  name: string | null;
  participants: ConversationParticipant[];
  lastMessage: LastMessageResponse | null;
  updatedAt: number;
}

export interface ConversationDetail extends Omit<ConversationSummary, 'lastMessage'> {
  creatorId: number;
  createdAt: number;
}

export interface MessageAttachment {
  attachmentId: number;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: number;
}

export interface ChatMessageResponse {
  messageId: number;
  conversationId: number;
  senderId: number;
  content: string | null;
  messageType: MessageType;
  createdAt: number;
  editedAt?: number | null;
  attachments?: MessageAttachment[];
}

export interface AttachmentMessageResponse {
  messageId: number;
  attachmentId: number;
  conversationId: number;
  senderId: number;
  content: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: number;
}

export interface AttachmentResponse extends MessageAttachment {
  messageId: number;
  url: string;
}

export interface MessageHistoryResponse {
  messages: ChatMessageResponse[];
  nextCursor: number | null;
  hasMore: boolean;
}

export interface ReactionSummaryResponse {
  messageId: number;
  reactions: Array<{
    reactionId: number;
    userId: number;
    reaction: ReactionType;
    createdAt: number;
    updatedAt: number | null;
  }>;
  counts: Partial<Record<ReactionType, number>>;
}

export interface UnreadCountResponse {
  conversationId: number;
  unreadCount: number;
}

export interface PeerPresenceResponse {
  conversationId: number;
  userId: number;
  status: 'ONLINE' | 'OFFLINE' | 'UNKNOWN';
  lastSeenAt: number | null;
}

export type ChatRealtimeEvent = {
  eventId: string;
  type:
    | 'MESSAGE_CREATED'
    | 'MESSAGE_UPDATED'
    | 'MESSAGE_DELETED'
    | 'TYPING_START'
    | 'TYPING_STOP'
    | 'READ_RECEIPT'
    | 'PRESENCE_ONLINE'
    | 'PRESENCE_OFFLINE';
  conversationId?: number;
  messageId?: number | null;
  senderId?: number;
  userId?: number;
  content?: string | null;
  messageType?: MessageType | null;
  createdAt?: number | null;
  editedAt?: number | null;
  attachmentId?: number | null;
  lastReadMessageId?: number;
  timestamp?: number;
};

function jsonOptions(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function requireData<T>(data: T | undefined, fallback: string): T {
  if (data === undefined || data === null) throw new Error(fallback);
  return data;
}

export const conversationApi = {
  async list(): Promise<ConversationSummary[]> {
    const response = await apiFetch<ConversationSummary[]>('/api/conversations');
    return response.data ?? [];
  },

  async create(type: ConversationType, participantIds: number[], name?: string): Promise<ConversationDetail> {
    const response = await apiFetch<ConversationDetail>('/api/conversations',
      jsonOptions('POST', { type, participantIds, ...(name ? { name } : {}) }));
    return requireData(response.data, 'Máy chủ không trả về cuộc trò chuyện vừa tạo.');
  },

  async detail(conversationId: number): Promise<ConversationDetail> {
    const response = await apiFetch<ConversationDetail>(`/api/conversations/${conversationId}`);
    return requireData(response.data, 'Không tìm thấy cuộc trò chuyện.');
  },

  async participants(conversationId: number): Promise<ConversationParticipant[]> {
    const response = await apiFetch<ConversationParticipant[]>(`/api/conversations/${conversationId}/participants`);
    return response.data ?? [];
  },

  async messages(conversationId: number, before?: number | null, limit = 30): Promise<MessageHistoryResponse> {
    const query = new URLSearchParams({ limit: String(limit) });
    if (before) query.set('before', String(before));
    const response = await apiFetch<MessageHistoryResponse>(`/api/conversations/${conversationId}/messages?${query}`);
    return requireData(response.data, 'Máy chủ không trả về lịch sử tin nhắn.');
  },

  async sendMessage(conversationId: number, content: string): Promise<ChatMessageResponse> {
    const response = await apiFetch<ChatMessageResponse>(`/api/conversations/${conversationId}/messages`,
      jsonOptions('POST', { content, messageType: 'TEXT' }));
    return requireData(response.data, 'Máy chủ không trả về tin nhắn vừa gửi.');
  },

  async sendAttachment(conversationId: number, file: File, content: string): Promise<AttachmentMessageResponse> {
    const form = new FormData();
    form.append('file', file);
    if (content) form.append('content', content);
    const response = await apiFetch<AttachmentMessageResponse>(
      `/api/conversations/${conversationId}/messages/attachment`,
      { method: 'POST', body: form },
    );
    return requireData(response.data, 'Máy chủ không trả về tệp vừa gửi.');
  },

  async attachment(attachmentId: number): Promise<AttachmentResponse> {
    const response = await apiFetch<AttachmentResponse>(`/api/conversations/attachments/${attachmentId}`);
    return requireData(response.data, 'Không thể lấy đường dẫn tệp.');
  },

  async editMessage(conversationId: number, messageId: number, content: string): Promise<ChatMessageResponse> {
    const response = await apiFetch<ChatMessageResponse>(
      `/api/conversations/${conversationId}/messages/${messageId}`,
      jsonOptions('PUT', { content }),
    );
    return requireData(response.data, 'Máy chủ không trả về tin nhắn đã sửa.');
  },

  async deleteMessage(conversationId: number, messageId: number): Promise<void> {
    await apiFetch(`/api/conversations/${conversationId}/messages/${messageId}`, { method: 'DELETE' });
  },

  async deleteAttachment(attachmentId: number): Promise<void> {
    await apiFetch(`/api/conversations/attachments/${attachmentId}`, { method: 'DELETE' });
  },

  async reactions(conversationId: number, messageId: number): Promise<ReactionSummaryResponse> {
    const response = await apiFetch<ReactionSummaryResponse>(
      `/api/conversations/${conversationId}/messages/${messageId}/reactions`,
    );
    return requireData(response.data, 'Không thể tải biểu cảm.');
  },

  async setReaction(conversationId: number, messageId: number, reaction: ReactionType): Promise<ReactionSummaryResponse> {
    const response = await apiFetch<ReactionSummaryResponse>(
      `/api/conversations/${conversationId}/messages/${messageId}/reactions`,
      jsonOptions('POST', { reaction }),
    );
    return requireData(response.data, 'Không thể cập nhật biểu cảm.');
  },

  async removeReaction(conversationId: number, messageId: number, reaction: ReactionType): Promise<ReactionSummaryResponse> {
    const response = await apiFetch<ReactionSummaryResponse>(
      `/api/conversations/${conversationId}/messages/${messageId}/reactions/${reaction}`,
      { method: 'DELETE' },
    );
    return requireData(response.data, 'Không thể gỡ biểu cảm.');
  },

  async markRead(conversationId: number, lastReadMessageId: number): Promise<void> {
    await apiFetch(`/api/conversations/${conversationId}/read`,
      jsonOptions('POST', { lastReadMessageId }));
  },

  async unreadCount(conversationId: number): Promise<UnreadCountResponse> {
    const response = await apiFetch<UnreadCountResponse>(`/api/conversations/${conversationId}/unread-count`);
    return requireData(response.data, 'Không thể tải số tin chưa đọc.');
  },

  async presence(conversationId: number): Promise<PeerPresenceResponse> {
    const response = await apiFetch<PeerPresenceResponse>(`/api/conversations/${conversationId}/presence`);
    return requireData(response.data, 'Không thể tải trạng thái hoạt động.');
  },
};
