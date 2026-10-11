import { apiFetch, getStoredUser } from './apiClient';

export interface FriendUser {
  id: string;
  userId: number;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar: string;
  status: 'online' | 'offline' | 'busy';
  mutualFriendsCount?: number;
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
  message?: string;
}

const STORAGE_KEY = 'signify_friends_storage_v2';

// Initial mock data mirroring the users in Zalo reference images
const INITIAL_FRIENDS: FriendUser[] = [
  {
    id: 'f_01',
    userId: 101,
    username: 'andrew',
    fullName: 'Andrew',
    email: 'andrew@signbridge.vn',
    phone: '0981 112 233',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
    status: 'online',
    isFriend: true,
  },
  {
    id: 'f_02',
    userId: 102,
    username: 'anhlong',
    fullName: 'Anh Long',
    email: 'long.nguyen@signbridge.vn',
    phone: '0972 334 455',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150',
    status: 'offline',
    isFriend: true,
  },
  {
    id: 'f_03',
    userId: 103,
    username: 'anhtu',
    fullName: 'Anh Tú',
    email: 'anhtu.design@gmail.com',
    phone: '0963 556 677',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    status: 'online',
    isFriend: true,
  },
  {
    id: 'f_04',
    userId: 104,
    username: 'ba',
    fullName: 'Ba',
    email: 'baparent@gmail.com',
    phone: '0912 345 678',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    status: 'offline',
    isFriend: true,
  },
  {
    id: 'f_05',
    userId: 105,
    username: 'baoduy',
    fullName: 'Bảo Duy',
    email: 'baoduy.tech@gmail.com',
    phone: '0934 778 899',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150',
    status: 'online',
    isFriend: true,
  },
  {
    id: 'f_06',
    userId: 106,
    username: 'giakhanh',
    fullName: 'Bùi Gia Khánh',
    email: 'giakhanh.bui@signify.vn',
    phone: '0945 889 900',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    status: 'offline',
    isFriend: true,
  },
  {
    id: 'f_07',
    userId: 107,
    username: 'buinguyen',
    fullName: 'Bùi Nguyên',
    email: 'buinguyen@signbridge.vn',
    phone: '0909 234 567',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150',
    status: 'online',
    isFriend: true,
  },
  {
    id: 'f_08',
    userId: 108,
    username: 'khaivinh',
    fullName: 'Bùi Nguyễn Khải Vinh',
    email: 'khaivinh.bui@fpt.edu.vn',
    phone: '0918 345 987',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150',
    status: 'busy',
    isFriend: true,
  },
  {
    id: 'f_09',
    userId: 109,
    username: 'caoquang',
    fullName: 'Cao Quang',
    email: 'caoquang@signify.vn',
    phone: '0922 456 789',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150',
    status: 'offline',
    isFriend: true,
  },
  {
    id: 'f_10',
    userId: 110,
    username: 'minhkhoi',
    fullName: 'Lê Minh Khôi',
    email: 'khoi.lm@fpt.edu.vn',
    phone: '0988 776 655',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=150',
    status: 'online',
    isFriend: true,
  },
];

// Initial suggested users (matching Image 1: Ánh Hồng, Chín Thị, Emily, etc.)
const INITIAL_SUGGESTIONS: FriendUser[] = [
  {
    id: 's_01',
    userId: 201,
    username: 'anhhong',
    fullName: 'Ánh Hồng',
    email: 'anhhong@signify.vn',
    phone: '0987 654 321',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    status: 'online',
    sourceHint: 'Từ gợi ý kết bạn',
    isFriend: false,
    requestStatus: 'NONE',
  },
  {
    id: 's_02',
    userId: 202,
    username: 'chinthi',
    fullName: 'Chín Thị',
    email: 'chinthi@gmail.com',
    phone: '0912 888 999',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
    status: 'offline',
    sourceHint: 'Từ gợi ý kết bạn',
    isFriend: false,
    requestStatus: 'NONE',
  },
  {
    id: 's_03',
    userId: 203,
    username: 'emily',
    fullName: 'Emily',
    email: 'emily.turner@signbridge.vn',
    phone: '0933 111 222',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    status: 'online',
    sourceHint: 'Từ gợi ý kết bạn',
    isFriend: false,
    requestStatus: 'NONE',
  },
  {
    id: 's_04',
    userId: 204,
    username: 'hoangyen',
    fullName: 'Hoàng Yến',
    email: 'hoangyen@signify.vn',
    phone: '0977 444 333',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150',
    status: 'online',
    sourceHint: 'Có 5 bạn chung',
    isFriend: false,
    requestStatus: 'NONE',
  },
  {
    id: 's_05',
    userId: 205,
    username: 'namkhanh',
    fullName: 'Đỗ Nam Khánh',
    email: 'namkhanh.do@signbridge.vn',
    phone: '0966 555 444',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    status: 'offline',
    sourceHint: 'Từ gợi ý kết bạn',
    isFriend: false,
    requestStatus: 'NONE',
  },
];

// Initial received friend requests (to test "xem danh sách gửi lời mời kết bạn" & "từ chối" / "chấp nhận")
const INITIAL_RECEIVED_REQUESTS: FriendRequest[] = [
  {
    id: 'req_rec_01',
    senderId: 301,
    receiverId: 1,
    sender: {
      id: 'u_301',
      userId: 301,
      username: 'datphan',
      fullName: 'Phan Văn Đạt',
      email: 'dat.phan@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
      status: 'online',
      sourceHint: 'Gửi lời mời kết bạn',
    },
    receiver: {
      id: 'u_1',
      userId: 1,
      username: 'me',
      fullName: 'Tôi',
      email: 'me@signbridge.vn',
      avatar: '',
      status: 'online',
    },
    status: 'PENDING',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    message: 'Chào bạn, mình thấy bạn qua nhóm Ngôn ngữ ký hiệu Signify, kết bạn nhé!',
  },
  {
    id: 'req_rec_02',
    senderId: 302,
    receiverId: 1,
    sender: {
      id: 'u_302',
      userId: 302,
      username: 'lanvu',
      fullName: 'Vũ Thị Lan',
      email: 'lan.vu@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
      status: 'offline',
      sourceHint: 'Gửi lời mời kết bạn',
    },
    receiver: {
      id: 'u_1',
      userId: 1,
      username: 'me',
      fullName: 'Tôi',
      email: 'me@signbridge.vn',
      avatar: '',
      status: 'online',
    },
    status: 'PENDING',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    message: 'Rất vui được làm quen với bạn trên Signify.',
  },
];

// Initial sent friend requests (to test "xem danh sách gửi lời mời kết bạn" & "thu hồi")
const INITIAL_SENT_REQUESTS: FriendRequest[] = [
  {
    id: 'req_sent_01',
    senderId: 1,
    receiverId: 303,
    sender: {
      id: 'u_1',
      userId: 1,
      username: 'me',
      fullName: 'Tôi',
      email: 'me@signbridge.vn',
      avatar: '',
      status: 'online',
    },
    receiver: {
      id: 'u_303',
      userId: 303,
      username: 'hadung',
      fullName: 'Hà Quang Dũng',
      email: 'dung.ha@signify.vn',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150',
      status: 'busy',
    },
    status: 'PENDING',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    message: 'Xin chào, mình kết bạn trao đổi nhé!',
  },
];

interface StoredData {
  friends: FriendUser[];
  suggestions: FriendUser[];
  receivedRequests: FriendRequest[];
  sentRequests: FriendRequest[];
}

function loadStorage(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.friends)) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  const initial: StoredData = {
    friends: INITIAL_FRIENDS,
    suggestions: INITIAL_SUGGESTIONS,
    receivedRequests: INITIAL_RECEIVED_REQUESTS,
    sentRequests: INITIAL_SENT_REQUESTS,
  };
  saveStorage(initial);
  return initial;
}

function saveStorage(data: StoredData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export const friendApi = {
  /**
   * Get all friends
   */
  async getFriends(query?: string, sort: 'asc' | 'desc' = 'asc'): Promise<FriendUser[]> {
    try {
      // Attempt backend endpoint if exists
      const response = await apiFetch<FriendUser[]>('/api/friends');
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch {
      // Fallback to local storage
    }

    const data = loadStorage();
    let result = [...data.friends];

    if (query?.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (f) =>
          f.fullName.toLowerCase().includes(q) ||
          f.username.toLowerCase().includes(q) ||
          f.email.toLowerCase().includes(q) ||
          (f.phone && f.phone.includes(q))
      );
    }

    result.sort((a, b) => {
      const nameA = a.fullName.trim();
      const nameB = b.fullName.trim();
      const cmp = nameA.localeCompare(nameB, 'vi', { sensitivity: 'base' });
      return sort === 'asc' ? cmp : -cmp;
    });

    return result;
  },

  /**
   * Get suggestions ("Có thể bạn quen")
   */
  async getSuggestions(): Promise<FriendUser[]> {
    try {
      const response = await apiFetch<FriendUser[]>('/api/friends/suggestions');
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
    } catch {
      // Fallback
    }

    const data = loadStorage();
    // Return suggestions that are not already friends or pending sent
    const friendIds = new Set(data.friends.map((f) => f.userId));
    const sentReceiverIds = new Set(data.sentRequests.map((r) => r.receiverId));

    return data.suggestions.map((s) => ({
      ...s,
      isFriend: friendIds.has(s.userId),
      requestStatus: sentReceiverIds.has(s.userId) ? 'SENT' : 'NONE',
    }));
  },

  /**
   * Search users by email or username
   */
  async searchUsers(query: string): Promise<FriendUser[]> {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    try {
      const response = await apiFetch<FriendUser[]>(`/api/users/search?query=${encodeURIComponent(query)}`);
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
    } catch {
      // Fallback search across local database
    }

    const data = loadStorage();
    const currentUser = getStoredUser();
    const myId = currentUser?.userId ?? 1;

    const allUsers: FriendUser[] = [
      ...data.friends,
      ...data.suggestions,
      ...data.receivedRequests.map((r) => r.sender),
      ...data.sentRequests.map((r) => r.receiver),
      // Add extra searchable candidates
      {
        id: 'u_user_99',
        userId: 99,
        username: 'nguyenvana',
        fullName: 'Nguyễn Văn A',
        email: 'nguyenvana@gmail.com',
        phone: '0901 234 567',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
        status: 'online',
      },
      {
        id: 'u_user_98',
        userId: 98,
        username: 'thu.pa',
        fullName: 'Phạm Anh Thư',
        email: 'thu.pa@fpt.edu.vn',
        phone: '0912 345 678',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
        status: 'online',
      },
    ];

    // Deduplicate by userId
    const map = new Map<number, FriendUser>();
    for (const u of allUsers) {
      if (u.userId !== myId) {
        map.set(u.userId, u);
      }
    }

    const friendIds = new Set(data.friends.map((f) => f.userId));
    const sentReceiverIds = new Set(data.sentRequests.map((r) => r.receiverId));
    const receivedSenderIds = new Set(data.receivedRequests.map((r) => r.senderId));

    const matches: FriendUser[] = [];
    for (const u of map.values()) {
      const match =
        u.email.toLowerCase().includes(trimmed) ||
        u.username.toLowerCase().includes(trimmed) ||
        u.fullName.toLowerCase().includes(trimmed) ||
        (u.phone && u.phone.includes(trimmed));

      if (match) {
        let reqStatus: 'NONE' | 'SENT' | 'RECEIVED' = 'NONE';
        if (sentReceiverIds.has(u.userId)) reqStatus = 'SENT';
        else if (receivedSenderIds.has(u.userId)) reqStatus = 'RECEIVED';

        matches.push({
          ...u,
          isFriend: friendIds.has(u.userId),
          requestStatus: reqStatus,
        });
      }
    }

    return matches;
  },

  /**
   * Get friend requests (both received and sent)
   */
  async getFriendRequests(): Promise<{ received: FriendRequest[]; sent: FriendRequest[] }> {
    try {
      const response = await apiFetch<{ received: FriendRequest[]; sent: FriendRequest[] }>('/api/friends/requests');
      if (response.data) {
        return response.data;
      }
    } catch {
      // Fallback
    }

    const data = loadStorage();
    return {
      received: data.receivedRequests.filter((r) => r.status === 'PENDING'),
      sent: data.sentRequests.filter((r) => r.status === 'PENDING'),
    };
  },

  /**
   * Send a friend request to a user
   */
  async sendFriendRequest(targetUser: FriendUser, message?: string): Promise<FriendRequest> {
    try {
      const response = await apiFetch<FriendRequest>('/api/friends/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: targetUser.userId, message }),
      });
      if (response.data) return response.data;
    } catch {
      // Fallback
    }

    const data = loadStorage();
    const currentUser = getStoredUser();

    const senderUser: FriendUser = {
      id: `u_${currentUser?.userId || 1}`,
      userId: currentUser?.userId || 1,
      username: currentUser?.username || 'me',
      fullName: [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ') || currentUser?.username || 'Tôi',
      email: currentUser?.email || 'me@signbridge.vn',
      avatar: currentUser?.avatar || '',
      status: 'online',
    };

    const newRequest: FriendRequest = {
      id: `req_${Date.now()}`,
      senderId: senderUser.userId,
      receiverId: targetUser.userId,
      sender: senderUser,
      receiver: targetUser,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      message: message || 'Xin chào, mình muốn kết bạn với bạn!',
    };

    // Remove any previous requests between these two
    data.sentRequests = data.sentRequests.filter((r) => r.receiverId !== targetUser.userId);
    data.sentRequests.unshift(newRequest);

    // Update suggestions list status
    data.suggestions = data.suggestions.map((s) =>
      s.userId === targetUser.userId ? { ...s, requestStatus: 'SENT' } : s
    );

    saveStorage(data);
    return newRequest;
  },

  /**
   * Accept friend request
   */
  async acceptFriendRequest(requestId: string): Promise<FriendUser> {
    try {
      await apiFetch(`/api/friends/requests/${requestId}/accept`, { method: 'POST' });
    } catch {
      // Fallback
    }

    const data = loadStorage();
    const targetReq = data.receivedRequests.find((r) => r.id === requestId);
    if (!targetReq) {
      throw new Error('Không tìm thấy lời mời kết bạn.');
    }

    // Remove from received
    data.receivedRequests = data.receivedRequests.filter((r) => r.id !== requestId);

    // Add sender to friends
    const newFriend: FriendUser = {
      ...targetReq.sender,
      isFriend: true,
      addedAt: new Date().toISOString(),
    };

    if (!data.friends.some((f) => f.userId === newFriend.userId)) {
      data.friends.unshift(newFriend);
    }

    saveStorage(data);
    return newFriend;
  },

  /**
   * Reject / decline friend request (Từ chối)
   */
  async rejectFriendRequest(requestId: string): Promise<void> {
    try {
      await apiFetch(`/api/friends/requests/${requestId}/reject`, { method: 'POST' });
    } catch {
      // Fallback
    }

    const data = loadStorage();
    data.receivedRequests = data.receivedRequests.filter((r) => r.id !== requestId);
    saveStorage(data);
  },

  /**
   * Cancel sent friend request (Thu hồi)
   */
  async cancelFriendRequest(requestId: string): Promise<void> {
    try {
      await apiFetch(`/api/friends/requests/${requestId}`, { method: 'DELETE' });
    } catch {
      // Fallback
    }

    const data = loadStorage();
    const req = data.sentRequests.find((r) => r.id === requestId);
    if (req) {
      data.sentRequests = data.sentRequests.filter((r) => r.id !== requestId);
      // Reset suggestion status if matches
      data.suggestions = data.suggestions.map((s) =>
        s.userId === req.receiverId ? { ...s, requestStatus: 'NONE' } : s
      );
    }
    saveStorage(data);
  },

  /**
   * Remove friend (Hủy kết bạn)
   */
  async removeFriend(userId: number): Promise<void> {
    try {
      await apiFetch(`/api/friends/${userId}`, { method: 'DELETE' });
    } catch {
      // Fallback
    }

    const data = loadStorage();
    data.friends = data.friends.filter((f) => f.userId !== userId);
    saveStorage(data);
  },
};
