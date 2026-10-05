export type ChatPresence = 'online' | 'offline' | 'unknown' | 'busy';

export type ChatReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

export interface ChatReactionItem {
  type: ChatReactionType;
  count: number;
  reactedByMe?: boolean;
}

export interface ChatAttachmentItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url?: string;
}

export interface ChatMessageItem {
  id: string;
  sender: 'me' | 'other';
  content: string;
  time: string;
  status?: 'sent' | 'seen';
  translatedText?: string;
  edited?: boolean;
  reactions?: ChatReactionItem[];
  attachments?: ChatAttachmentItem[];
}

export interface ChatConversationItem {
  id: string;
  name: string;
  role: string;
  avatar: string;
  presence: ChatPresence;
  lastSeen: string;
  lastMessage: string;
  time: string;
  unread: number;
  pinned?: boolean;
  typing?: boolean;
  hasMoreMessages?: boolean;
  messages: ChatMessageItem[];
  sharedFiles: Array<ChatAttachmentItem & { meta: string }>;
}
