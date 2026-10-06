import { apiFetch } from './apiClient';

export interface BlockedUserResponse {
  userId: number;
  fullName: string;
  avatar: string | null;
  blockedAt: number;
}

export const userBlockApi = {
  async list(): Promise<BlockedUserResponse[]> {
    const response = await apiFetch<BlockedUserResponse[]>('/api/users/blocked');
    return response.data ?? [];
  },

  async block(userId: number): Promise<void> {
    await apiFetch(`/api/users/${userId}/block`, { method: 'POST' });
  },

  async unblock(userId: number): Promise<void> {
    await apiFetch(`/api/users/${userId}/block`, { method: 'DELETE' });
  },
};
