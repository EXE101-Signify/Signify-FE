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

interface Page<T> { content: T[]; totalPages: number; }
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

async function allPages<T>(path: string): Promise<T[]> {
  const rows: T[] = [];
  let index = 0;
  let totalPages = 1;
  do {
    const separator = path.includes('?') ? '&' : '?';
    const response = await apiFetch<Page<T>>(`${path}${separator}page=${index}&size=100`);
    if (!response.data) throw new Error('Máy chủ không trả về dữ liệu danh bạ.');
    rows.push(...response.data.content);
    totalPages = response.data.totalPages;
    index += 1;
  } while (index < totalPages);
  return rows;
}

export const friendApi = {
  async getFriends(query = '', sort: 'asc' | 'desc' = 'asc'): Promise<FriendUser[]> {
    const rows = await allPages<ApiFriend>('/api/friends');
    const needle = query.trim().toLocaleLowerCase();
    return rows.map((row) => mapUser(row.user))
      .filter((user) => !needle || user.fullName.toLocaleLowerCase().includes(needle) || user.username.toLocaleLowerCase().includes(needle))
      .sort((a, b) => (sort === 'asc' ? 1 : -1) * a.fullName.localeCompare(b.fullName, 'vi', { sensitivity: 'base' }));
  },
  async searchUsers(query: string): Promise<FriendUser[]> {
    const needle = query.trim();
    if (!needle) return [];
    const rows = await allPages<ApiSearchUser>(`/api/friends/search?q=${encodeURIComponent(needle)}`);
    return rows.map((user) => ({
      ...mapUser(user), isFriend: user.relationshipStatus === 'FRIEND',
      requestStatus: user.relationshipStatus === 'OUTGOING_PENDING' ? 'SENT' : user.relationshipStatus === 'INCOMING_PENDING' ? 'RECEIVED' : 'NONE',
    }));
  },
  async getFriendRequests(): Promise<{ received: FriendRequest[]; sent: FriendRequest[] }> {
    const [received, sent] = await Promise.all([
      allPages<ApiFriendRequest>('/api/friends/requests/incoming'),
      allPages<ApiFriendRequest>('/api/friends/requests/outgoing'),
    ]);
    return {
      received: received.map((item) => mapRequest(item, 'incoming')),
      sent: sent.map((item) => mapRequest(item, 'outgoing')),
    };
  },
  async sendFriendRequest(targetUser: FriendUser): Promise<'SENT' | 'FRIEND'> {
    const response = await apiFetch<{ status: 'OUTGOING_PENDING' | 'FRIEND' }>(`/api/friends/requests/${targetUser.userId}`, { method: 'POST' });
    return response.data?.status === 'FRIEND' ? 'FRIEND' : 'SENT';
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
