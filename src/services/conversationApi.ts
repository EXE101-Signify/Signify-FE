import { apiFetch } from './apiClient';

export interface ConversationParticipant {
  userId: number;
  fullName: string;
  avatar: string | null;
  joinedAt: number | null;
}

export interface ConversationSummary {
  conversationId: number;
  type: 'PRIVATE' | 'GROUP';
  name: string | null;
  participants: ConversationParticipant[];
  updatedAt: number;
}

export const conversationApi = {
  async list(): Promise<ConversationSummary[]> {
    const response = await apiFetch<ConversationSummary[]>('/api/conversations');
    return response.data ?? [];
  },
};
