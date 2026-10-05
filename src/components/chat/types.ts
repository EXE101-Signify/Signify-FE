export type ChatPresence = 'online' | 'offline' | 'busy';

export interface ChatMessageItem {
  id: string;
  sender: 'me' | 'other';
  content: string;
  time: string;
  status?: 'sent' | 'seen';
  translatedText?: string;
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
  messages: ChatMessageItem[];
  sharedFiles: Array<{ id: string; name: string; meta: string }>;
}
