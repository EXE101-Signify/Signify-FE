import { apiFetch } from './apiClient';

export interface FriendUser {
  id: string;
  userId: number;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar: string;
  status: 'online' | 'offline' | 'busy' | 'unknown';
  sourceHint?: string;
  isFriend?: boolean;
  requestStatus?: 'NONE' | 'SENT' | 'RECEIVED';
  requestId?: string;
  addedAt?: string;
}

export interface FriendRequest {
  id: string;
  senderId: number;
  receiverId: number;
  sender: FriendUser;
  receiver: FriendUser;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

interface Page<T> { content: T[]; }
interface ApiFriendUser { userId: number; username: string; fullName: string; avatar?: string | null; }
interface ApiFriend { relationshipId: number; user: ApiFriendUser; friendsSince: number; }
interface ApiFriendRequest { requestId: number; user: ApiFriendUser; createdAt: number; }
interface ApiSearchUser extends ApiFriendUser { relationshipStatus: 'NONE' | 'OUTGOING_PENDING' | 'INCOMING_PENDING' | 'FRIEND'; }

function mapUser(user: ApiFriendUser): FriendUser {
  return {
    id: String(user.userId), userId: user.userId, username: user.username,
    fullName: user.fullName, email: '', avatar: user.avatar || '', status: 'unknown',
  };
}

function mapRequest(request: ApiFriendRequest, direction: 'incoming' | 'outgoing'): FriendRequest {
  const user = mapUser(request.user);
  const emptyUser: FriendUser = { id: '', userId: 0, username: '', fullName: '', email: '', avatar: '', status: 'unknown' };
  return {
    id: String(request.requestId), senderId: direction === 'incoming' ? user.userId : 0,
    receiverId: direction === 'outgoing' ? user.userId : 0,
    sender: direction === 'incoming' ? user : emptyUser,
    receiver: direction === 'outgoing' ? user : emptyUser,
    status: 'PENDING', createdAt: new Date(request.createdAt).toISOString(),
  };
}

async function page<T>(path: string): Promise<T[]> {
  const response = await apiFetch<Page<T>>(path);
  return response.data?.content ?? [];
}

export const friendApi = {
  async getFriends(query = '', sort: 'asc' | 'desc' = 'asc'): Promise<FriendUser[]> {
    const rows = await page<ApiFriend>('/api/friends?page=0&size=100');
    const needle = query.trim().toLocaleLowerCase();
    return rows.map((row) => mapUser(row.user))
      .filter((user) => !needle || user.fullName.toLocaleLowerCase().includes(needle) || user.username.toLocaleLowerCase().includes(needle))
      .sort((a, b) => (sort === 'asc' ? 1 : -1) * a.fullName.localeCompare(b.fullName, 'vi', { sensitivity: 'base' }));
  },
  async getSuggestions(): Promise<FriendUser[]> { return []; },
  async searchUsers(query: string): Promise<FriendUser[]> {
    const needle = query.trim();
    if (!needle) return [];
    const rows = await page<ApiSearchUser>(`/api/friends/search?q=${encodeURIComponent(needle)}&page=0&size=20`);
    return rows.map((user) => ({
      ...mapUser(user), isFriend: user.relationshipStatus === 'FRIEND',
      requestStatus: user.relationshipStatus === 'OUTGOING_PENDING' ? 'SENT' : user.relationshipStatus === 'INCOMING_PENDING' ? 'RECEIVED' : 'NONE',
    }));
  },
  async getFriendRequests(): Promise<{ received: FriendRequest[]; sent: FriendRequest[] }> {
    const [received, sent] = await Promise.all([
      page<ApiFriendRequest>('/api/friends/requests/incoming?page=0&size=100'),
      page<ApiFriendRequest>('/api/friends/requests/outgoing?page=0&size=100'),
    ]);
    return {
      received: received.map((item) => mapRequest(item, 'incoming')),
      sent: sent.map((item) => mapRequest(item, 'outgoing')),
    };
  },
  async sendFriendRequest(targetUser: FriendUser): Promise<void> {
    await apiFetch(`/api/friends/requests/${targetUser.userId}`, { method: 'POST' });
  },
  async acceptFriendRequest(requestId: string): Promise<void> {
    await apiFetch(`/api/friends/requests/${encodeURIComponent(requestId)}/accept`, { method: 'POST' });
  },
  async rejectFriendRequest(requestId: string): Promise<void> {
    await apiFetch(`/api/friends/requests/${encodeURIComponent(requestId)}/reject`, { method: 'POST' });
  },
  async cancelFriendRequest(requestId: string): Promise<void> {
    await apiFetch(`/api/friends/requests/${encodeURIComponent(requestId)}`, { method: 'DELETE' });
  },
  async removeFriend(userId: number): Promise<void> {
    await apiFetch(`/api/friends/${userId}`, { method: 'DELETE' });
  },
};
